import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getApplicationProjects, writeMicroApps } from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = process.argv.includes('--build') ? 'build' : 'dev'
const apps = writeMicroApps(rootDir, getApplicationProjects(rootDir), target)

console.log(`已生成 ${target} micro-apps.json，共 ${apps.length} 个子应用`)
