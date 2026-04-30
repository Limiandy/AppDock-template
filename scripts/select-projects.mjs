#!/usr/bin/env node

import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createViteCommand,
  getApplicationProjects,
  getDevProjects,
  getProjectDistDir,
  getRequiredBuildProjects,
  parseSelection,
  uniqueProjects,
  writeMicroApps,
} from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [task, ...viteArgs] = process.argv.slice(2)

if (!['build', 'dev'].includes(task)) {
  console.error('用法: node scripts/select-projects.mjs <build|dev> [vite args...]')
  process.exit(1)
}

function printProjects(projects) {
  projects.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name} (${path.relative(rootDir, project.dir)})`)
  })
}

async function promptSelection(projects, options) {
  if (projects.length === 0) return []

  const rl = readline.createInterface({ input, output })
  try {
    while (true) {
      const answer = await rl.question(options.message)
      try {
        return parseSelection(answer, projects, { defaultAll: options.defaultAll })
      } catch (error) {
        console.log(error.message)
      }
    }
  } finally {
    rl.close()
  }
}

function runCommand(project, command, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${project.name}: ${command} ${args.join(' ')}`)

    const child = spawn(command, args, {
      cwd: project.dir,
      env: process.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${project.name} 执行失败，退出码 ${code}`))
      }
    })
  })
}

function cleanProjectDist(project) {
  const distDir = getProjectDistDir(rootDir, project)
  fs.rmSync(distDir, { recursive: true, force: true })
}

async function runBuild() {
  const requiredProjects = getRequiredBuildProjects(rootDir)
  const optionalProjects = getApplicationProjects(rootDir)

  console.log('必选打包项目:')
  printProjects(requiredProjects)

  console.log('\n可选 application 子项目:')
  printProjects(optionalProjects)

  const selectedOptionalProjects = await promptSelection(optionalProjects, {
    defaultAll: false,
    message: '\n请选择要打包的 application 子项目编号，多个用逗号分隔；输入 all 全选，直接回车跳过: ',
  })
  const buildMicroApps = uniqueProjects(selectedOptionalProjects)

  writeMicroApps(rootDir, buildMicroApps, 'build')
  console.log(`\n已生成 build 微应用配置，共 ${buildMicroApps.length} 个子应用`)

  console.log('\n> vue-tsc -b')
  await runCommand({ name: 'root', dir: rootDir }, 'pnpm', ['exec', 'vue-tsc', '-b'])
  await runCommand({ name: 'common', dir: path.join(rootDir, 'common') }, 'pnpm', ['run', 'build'])

  for (const project of uniqueProjects([...requiredProjects, ...buildMicroApps])) {
    cleanProjectDist(project)
    const [command, args] = createViteCommand('build', viteArgs, { rootDir, project })
    await runCommand(project, command, args)
  }
}

async function runDev() {
  const projects = getDevProjects(rootDir)

  console.log('可运行项目:')
  printProjects(projects)

  const selectedProjects = await promptSelection(projects, {
    defaultAll: true,
    message: '\n请选择要运行的项目编号，多个用逗号分隔；输入 all 全选，直接回车默认全选: ',
  })

  if (selectedProjects.length === 0) {
    console.log('未选择运行项目。')
    return
  }

  const selectedMicroApps = selectedProjects.filter((project) => project.name !== 'main-app')
  writeMicroApps(rootDir, selectedMicroApps, 'dev')
  console.log(`\n已生成 dev 微应用配置，共 ${selectedMicroApps.length} 个子应用`)

  const [command, args] = createViteCommand('dev', viteArgs)
  await Promise.all(selectedProjects.map((project) => runCommand(project, command, args)))
}

try {
  if (task === 'build') {
    await runBuild()
  } else {
    await runDev()
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
