#!/usr/bin/env node

import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'
import { createApplicationFiles, getNextApplicationPort, toKebabCase } from './scaffold-application.mjs'
import { getApplicationProjects, writeMicroApps } from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--name' || value === '-n') {
      args.name = argv[index + 1]
      index += 1
    } else if (value === '--title' || value === '-t') {
      args.title = argv[index + 1]
      index += 1
    } else if (value === '--port' || value === '-p') {
      args.port = argv[index + 1]
      index += 1
    } else if (!args.name) {
      args.name = value
    }
  }

  return args
}

async function promptMissingOptions(options) {
  if (options.name && options.title && options.port) return options

  const rl = readline.createInterface({ input, output })
  try {
    const name = options.name || (await rl.question('子项目名称，例如 demo-app: '))
    const normalizedName = toKebabCase(name)
    const title = options.title || (await rl.question(`菜单标题，直接回车使用 ${normalizedName}: `)) || normalizedName
    const defaultPort = getNextApplicationPort(rootDir)
    const port = options.port || (await rl.question(`开发端口，直接回车使用 ${defaultPort}: `)) || defaultPort

    return {
      name: normalizedName,
      title,
      port,
    }
  } finally {
    rl.close()
  }
}

try {
  const options = await promptMissingOptions(readArgs(process.argv.slice(2)))
  const result = createApplicationFiles(rootDir, options)
  const microApps = writeMicroApps(rootDir, getApplicationProjects(rootDir), 'dev')

  console.log(`已生成 application/${result.name}`)
  console.log(`开发端口: ${result.port}`)
  console.log(`文件数: ${result.files.length}`)
  console.log(`已刷新 main-app/src/micro-apps.json，共 ${microApps.length} 个子应用`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
