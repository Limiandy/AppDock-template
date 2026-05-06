import fs from 'node:fs'
import path from 'node:path'
import { getApplicationProjects, readProjectPort } from './workspace-projects.mjs'

const defaultPortStart = 60010

export function toKebabCase(value) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function toPascalCase(value) {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}

export function validateAppName(name) {
  if (!name || !/^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/.test(name)) {
    throw new Error('子项目名称只能使用小写字母、数字和中划线，并且必须以字母开头')
  }
}

export function getNextApplicationPort(rootDir) {
  const usedPorts = getApplicationProjects(rootDir)
    .map((project) => Number(readProjectPort(project.dir)))
    .filter((port) => Number.isInteger(port))

  if (usedPorts.length === 0) return defaultPortStart

  return Math.max(...usedPorts) + 1
}

export function createApplicationFiles(rootDir, options) {
  const name = toKebabCase(options.name)
  validateAppName(name)

  const title = options.title?.trim() || toPascalCase(name)
  const port = Number(options.port ?? getNextApplicationPort(rootDir))
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('端口号必须是有效的正整数')
  }

  const appDir = path.join(rootDir, 'application', name)
  if (fs.existsSync(appDir)) {
    throw new Error(`子项目已存在: application/${name}`)
  }

  const pascalName = toPascalCase(name)
  const files = createApplicationFileMap({ name, title, port, pascalName })

  for (const [relativePath, content] of Object.entries(files)) {
    const targetPath = path.join(appDir, relativePath)
    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.writeFileSync(targetPath, content)
  }

  updateRootTsConfigReferences(rootDir, {
    add: [`./application/${name}/tsconfig.json`],
  })

  return {
    name,
    title,
    port,
    dir: appDir,
    files: Object.keys(files).sort(),
  }
}

export function deleteApplicationFiles(rootDir, options) {
  const name = toKebabCase(options.name)
  validateAppName(name)

  const appDir = path.join(rootDir, 'application', name)
  if (!fs.existsSync(appDir)) {
    throw new Error(`子项目不存在: application/${name}`)
  }

  const routeModulePath = path.join(rootDir, 'main-app/src/router/modules', `${name}.ts`)

  fs.rmSync(appDir, { recursive: true, force: true })
  fs.rmSync(routeModulePath, { force: true })
  updateRootTsConfigReferences(rootDir, {
    remove: [`./application/${name}/tsconfig.json`],
  })

  return {
    name,
    dir: appDir,
    removedRouteModule: routeModulePath,
  }
}

function normalizeReferencePath(value) {
  return value.replaceAll('\\', '/')
}

function sortReferencePaths(paths) {
  const priority = (value) => {
    if (value === './common/tsconfig.json') return 0
    if (value === './main-app/tsconfig.json') return 1
    if (value.startsWith('./application/')) return 2
    if (value === './tsconfig.node.json') return 3
    return 4
  }

  return [...paths].sort((left, right) => priority(left) - priority(right) || left.localeCompare(right))
}

export function updateRootTsConfigReferences(rootDir, { add = [], remove = [] } = {}) {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) return null

  const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
  const removedPaths = new Set(remove.map(normalizeReferencePath))
  const referencePaths = new Set(
    (config.references || [])
      .map((reference) => normalizeReferencePath(reference.path))
      .filter((referencePath) => !removedPaths.has(referencePath)),
  )

  for (const referencePath of add.map(normalizeReferencePath)) {
    referencePaths.add(referencePath)
  }

  config.references = sortReferencePaths(referencePaths).map((referencePath) => ({ path: referencePath }))
  fs.writeFileSync(tsconfigPath, `${JSON.stringify(config, null, 2)}\n`)
  return config
}

export function createApplicationFileMap({ name, title, port, pascalName }) {
  return {
    'package.json': `${JSON.stringify(
      {
        name,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
        },
        description: '',
        dependencies: {},
      },
      null,
      2,
    )}\n`,
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
    'tsconfig.json': `{
  "extends": "../../tsconfig.app.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "../../node_modules/.tmp/application-${name}.tsbuildinfo",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
`,
    'vite.config.ts': `import ViteConfigBase from '../../vite.config.base'
import { defineConfig } from 'vite'
import merge from 'lodash.merge'

const port = ${port}

export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)

  return merge(baseConfig, {
    server: {
      port,
    },
  })
})
`,
    'src/App.vue': `<template>
  <router-view />
</template>
`,
    'src/main.ts': `import App from './App.vue'
import { registerQiankun } from 'common'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from '@/router'

registerQiankun(App, {
  container: '#app',
  plugins: [Antd, router],
})
`,
    'src/router/index.ts': `import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { type App } from 'vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/${name}',
    name: '${pascalName}',
    component: null,
    meta: { title: '${title}', icon: 'solar:widget-outline' },
    redirect: '/${name}/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', icon: 'solar:home-outline' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App<Element>) {
  app.use(router)
}

export default router
`,
    'src/views/Home.vue': `<template>
  <div class="home-page">
    <h2>${title}</h2>
  </div>
</template>

<style lang="less" scoped>
.home-page {
  min-height: 100%;
  padding: 24px;
}
</style>
`,
    'src/vite-env.d.ts': `/// <reference types="vite/client" />
`,
  }
}
