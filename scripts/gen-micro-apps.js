import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appsRoot = path.resolve(__dirname, '../') // 即 application 目录

function getMicroApps() {
  const appDirs = fs
    .readdirSync(path.join(appsRoot, 'application'))
    .filter((dir) => {
      const fullPath = path.join(appsRoot, 'application', dir)
      return (
        fs.statSync(fullPath).isDirectory() &&
        !['main-app', 'common'].includes(dir)
      )
    })

  const apps = []

  for (const appDir of appDirs) {
    const basePath = path.join(appsRoot, 'application', appDir)

    const packagePath = path.join(basePath, 'package.json')
    const viteConfigPath = path.join(basePath, 'vite.config.ts')

    if (!fs.existsSync(packagePath) || !fs.existsSync(viteConfigPath)) continue

    // 获取子应用名称
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    const appName = pkg.name

    // 获取端口号：简单正则读取（不运行 vite.config.js）
    const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8')
    const portMatch = viteConfigContent.match(/const\s+port\s*=\s*(\d+)/)
    const port = portMatch ? portMatch[1] : null

    if (!appName || !port) continue

    apps.push({
      name: appName,
      entry: `//localhost:${port}`,
      container: '#qiankun-container',
      activeRule: `/${appName}`, // 你可以自定义规则生成方式
      props: {},
    })
  }

  return apps
}

const apps = getMicroApps()

// 写入 main-app/src/micro-apps.json
const targetPath = path.join(appsRoot, 'main-app/src/micro-apps.json')
fs.writeFileSync(targetPath, JSON.stringify(apps, null, 2))

console.log(`✅ 已生成 micro-apps.json，共 ${apps.length} 个子应用`)
