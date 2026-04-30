#!/usr/bin/env node

import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import { deleteApplicationFiles, toKebabCase } from './scaffold-application.mjs'
import { getApplicationProjects, writeMicroApps } from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readArgs(argv) {
  const args = {
    yes: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--name' || value === '-n') {
      args.name = argv[index + 1]
      index += 1
    } else if (value === '--yes' || value === '-y') {
      args.yes = true
    } else if (!args.name) {
      args.name = value
    }
  }

  return args
}

function printProjects(projects) {
  projects.forEach((project, index) => {
    console.log(`  ${index + 1}. ${project.name} (${path.relative(rootDir, project.dir)})`)
  })
}

async function selectProject(options) {
  if (options.name) return toKebabCase(options.name)

  const projects = getApplicationProjects(rootDir)
  if (projects.length === 0) {
    throw new Error('application 下没有可删除的子项目')
  }

  console.log('可删除子项目:')
  printProjects(projects)

  const rl = readline.createInterface({ input, output })
  try {
    while (true) {
      const answer = await rl.question('\n请选择要删除的子项目编号: ')
      const index = Number(answer.trim())
      if (Number.isInteger(index) && index >= 1 && index <= projects.length) {
        return projects[index - 1].name
      }
      console.log(`无效选择: ${answer}`)
    }
  } finally {
    rl.close()
  }
}

async function confirmDelete(name, yes) {
  if (yes) return true

  const rl = readline.createInterface({ input, output })
  try {
    const answer = await rl.question(`确认删除 application/${name}？输入 ${name} 继续: `)
    return answer.trim() === name
  } finally {
    rl.close()
  }
}

try {
  const options = readArgs(process.argv.slice(2))
  const name = await selectProject(options)
  const confirmed = await confirmDelete(name, options.yes)

  if (!confirmed) {
    console.log('已取消删除。')
    process.exit(0)
  }

  const result = deleteApplicationFiles(rootDir, { name })
  const microApps = writeMicroApps(rootDir, getApplicationProjects(rootDir), 'dev')

  console.log(`已删除 application/${result.name}`)
  console.log(`已删除路由模块 ${path.relative(rootDir, result.removedRouteModule)}`)
  console.log(`已刷新 main-app/src/micro-apps.json，共 ${microApps.length} 个子应用`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
