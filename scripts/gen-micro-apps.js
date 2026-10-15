import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getApplicationProjects, syncRootTsConfigReferences, writeMicroApps } from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

syncRootTsConfigReferences(rootDir)
const apps = writeMicroApps(rootDir, getApplicationProjects(rootDir))

console.log(`已生成微应用配置 micro-apps.json，共 ${apps.length} 个子应用`)
