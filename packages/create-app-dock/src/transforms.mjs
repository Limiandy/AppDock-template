import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectPath = (root, ...parts) => resolve(root, ...parts)

async function removeEntries(root, entries) {
  await Promise.all(entries.map((entry) => rm(projectPath(root, entry), { recursive: true, force: true })))
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(projectPath(root, relativePath), 'utf8'))
}

async function writeJson(root, relativePath, value) {
  await writeFile(projectPath(root, relativePath), `${JSON.stringify(value, null, 2)}\n`)
}

async function patchFile(root, relativePath, patcher, label) {
  const filePath = projectPath(root, relativePath)
  const source = await readFile(filePath, 'utf8')
  const next = patcher(source)

  if (next === source) {
    throw new Error(`模板补丁未生效：${label}`)
  }

  await writeFile(filePath, next)
}

const HOME_VIEW = `<template>
  <div :class="[scopeClass, className]">
    <a-card :bordered="false">
      <h2 class="home-view__title">欢迎使用 AppDock</h2>
      <p class="home-view__desc">项目已就绪，可以从这里开始搭建业务页面。</p>

      <a-space wrap>
        <a-tag color="geekblue">Vue 3</a-tag>
        <a-tag color="geekblue">Vite</a-tag>
        <a-tag color="geekblue">TypeScript</a-tag>
        <a-tag color="cyan">Ant Design Vue</a-tag>
        <a-tag color="volcano">Token 主题</a-tag>
      </a-space>

      <a-divider />

      <ul class="home-view__list">
        <li>
          路由入口：
          <code>main-app/src/router/BaseAppRoutes.ts</code>
        </li>
        <li>
          布局与菜单：
          <code>main-app/src/layout/BasicLayout.vue</code>
        </li>
        <li>
          公共库：
          <code>common</code>
          （SuperTable / SvgIcon / useAccess）
        </li>
        <li>
          视觉 token：
          <code>main-app/src/hooks/theme/presets/managementSystem.ts</code>
        </li>
      </ul>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import useStyle from '@/hooks/style/useStyle.ts'
import { pageInsetStyles } from '@/hooks/style/pageStyles'

const [className, scopeClass] = useStyle('home-view', (token) => ({
  ...pageInsetStyles(token),

  '.home-view__title': {
    margin: 0,
    fontSize: \`\${token.fontSizeHeading4}px\`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.home-view__desc': {
    margin: \`\${token.marginXS}px 0 \${token.margin}px\`,
    color: token.colorTextSecondary,
  },

  '.home-view__list': {
    margin: 0,
    paddingInlineStart: \`\${token.paddingLG}px\`,
    color: token.colorTextSecondary,
    lineHeight: 2,
  },
}))
</script>
`

const MINIMAL_ROUTES = `import type { RouteRecordRaw } from 'vue-router'

export const baseAppDevEntries = [
  { path: '/base-app/icons', title: '全量图标', icon: 'solar:album-outline' },
  { path: '/base-app/theme-editor', title: '主题编辑器', icon: 'solar:palette-2-outline' },
] as const

const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', icon: 'solar:home-2-outline' },
  },
]

const baseAppDevRoutes: RouteRecordRaw[] = [
  {
    path: '/base-app',
    name: 'BaseApp',
    component: null,
    meta: {
      title: '基座应用',
      icon: 'solar:dumbbell-large-minimalistic-outline',
      hideInMenu: true,
    },
    children: [
      {
        path: 'icons',
        name: 'Icons',
        component: () => import('@/views/IconsRender.vue'),
        meta: { title: '全量图标', icon: 'solar:album-outline' },
      },
      {
        path: 'theme-editor',
        name: 'ThemeEditor',
        component: () => import('@/views/ThemeEditor/ThemeEditor.vue'),
        meta: { title: '主题编辑器', icon: 'solar:album-outline' },
      },
    ],
  },
]

export const asyncRoutes: RouteRecordRaw[] = [...homeRoutes, ...(import.meta.env.DEV ? baseAppDevRoutes : [])]

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/views/exceptions/NotFound.vue'),
  },
]
`

/** 单应用模式：去掉 qiankun、子应用与相关脚本，保留基座页面能力 */
export async function applySingleAppMode(root, options = {}) {
  await removeEntries(root, [
    'application',
    'main-app/src/registerMicroApp.ts',
    'main-app/src/micro-apps.json',
    'main-app/src/router/modules',
    'vite/plugins/routeSyncPlugin.ts',
    'scripts/gen-micro-apps.js',
    'scripts/create-application.mjs',
    'scripts/delete-application.mjs',
    'scripts/scaffold-application.mjs',
    'scripts/select-projects.mjs',
    'scripts/workspace-projects.mjs',
    'scripts/workspace-projects.test.mjs',
    'scripts/sync-tsconfig-references.mjs',
    'common/src/qiankunLifeCycle.ts',
  ])

  await patchFile(
    root,
    'main-app/src/main.ts',
    (source) =>
      source
        .replace("import { registerMicroApp } from './registerMicroApp.ts'\n", '')
        .replace('bootstrap().then(() => {\n  registerMicroApp()\n})', 'bootstrap()'),
    'main.ts',
  )

  await patchFile(
    root,
    'main-app/src/router/index.ts',
    (source) =>
      source
        .replace(
          /const modules = import\.meta\.glob<\{ default: RouteRecordRaw\[\] \}>\('\.\/modules\/\*\.ts', \{\n  eager: true,\n\}\)\n\n/,
          '',
        )
        .replace(
          /const microAppRoutes: RouteRecordRaw\[\] = Object\.values\(modules\)\.flatMap\(\(mod\) => mod\.default\)\n\n/,
          '',
        )
        .replace('children: [...asyncRoutes, ...microAppRoutes],', 'children: [...asyncRoutes],'),
    'router/index.ts',
  )

  await patchFile(
    root,
    'vite.config.base.ts',
    (source) =>
      source
        .replace("import qiankun from 'vite-plugin-qiankun'\n", '')
        .replace("import routeSyncPlugin from './vite/plugins/routeSyncPlugin.ts'\n", '')
        .replace(/\n  if \(appName !== 'main-app'\) \{[\s\S]*?\n  \}\n/, '\n'),
    'vite.config.base.ts',
  )

  await patchFile(
    root,
    'common/src/index.ts',
    (source) =>
      source
        .replace("// @ts-ignore\nimport { registerQiankun } from './qiankunLifeCycle'\n", '')
        .replace('export { registerQiankun, SvgIcon,', 'export { SvgIcon,'),
    'common/src/index.ts',
  )

  const manifest = await readJson(root, 'package.json')
  Object.assign(manifest.scripts, {
    'dev': 'pnpm run build:common && npm run dev --workspace=main-app',
    'dev:mock': 'pnpm run build:common && pnpm --filter main-app exec vite --mode mock',
    'dev:supabase': 'pnpm run build:common && pnpm --filter main-app exec vite --mode supabase',
    'build': 'vue-tsc -b && pnpm --filter common build && node scripts/build-app.mjs',
    'build:mock': 'vue-tsc -b && pnpm --filter common build && node scripts/build-app.mjs mock',
    'build:supabase': 'vue-tsc -b && pnpm --filter common build && node scripts/build-app.mjs supabase',
    'build:debug': 'vue-tsc -b && pnpm --filter common build && node scripts/build-app.mjs mock --debug-only',
    'check': 'pnpm run format:check && pnpm run lint && pnpm run typecheck',
  })
  for (const key of [
    'build:select',
    'dev:select',
    'create:app',
    'delete:app',
    'gen-micro-apps',
    'sync:tsconfig',
    'test:scripts',
  ]) {
    delete manifest.scripts[key]
  }
  for (const dependency of [
    'vite-plugin-qiankun',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@types/babel__traverse',
    'node-module-type',
  ]) {
    delete manifest.devDependencies?.[dependency]
  }
  await writeJson(root, 'package.json', manifest)

  const mainAppManifest = await readJson(root, 'main-app/package.json')
  delete mainAppManifest.dependencies?.qiankun
  await writeJson(root, 'main-app/package.json', mainAppManifest)

  await writeFile(projectPath(root, 'README.md'), renderReadme({ examples: options.examples }))
}

/** 去掉参考稿示例页面与数据，保留布局、主题与开发工具页 */
export async function removeExamples(root) {
  await removeEntries(root, [
    'main-app/src/views/workbench',
    'main-app/src/views/supplier',
    'main-app/src/views/recruitment',
    'main-app/src/views/tender',
    'main-app/src/views/company',
    'main-app/src/views/message',
    'main-app/src/views/profile',
    'main-app/src/views/SimpleListPage.vue',
    'main-app/src/views/list-page-configs.ts',
    'main-app/src/views/SuperTableDemo.vue',
    'main-app/src/views/BaseAdminUsers.vue',
    'main-app/src/views/BaseAdminRoles.vue',
    'main-app/src/views/BaseAdminMenus.vue',
    'main-app/src/data/prototype',
    'main-app/src/data/shelters',
    'main-app/src/data/base-admin',
  ])

  await writeFile(projectPath(root, 'main-app/src/router/BaseAppRoutes.ts'), MINIMAL_ROUTES)
  await writeFile(projectPath(root, 'main-app/src/views/HomeView.vue'), HOME_VIEW)
  await patchFile(
    root,
    'main-app/src/router/index.ts',
    (source) => source.replace("redirect: '/workbench'", "redirect: '/home'"),
    'router redirect',
  )
}

export async function writeModeNote(root, { single = false, examples = true } = {}) {
  const facts = []
  if (single) facts.push('单应用形态')
  if (!examples) facts.push('不含示例页面')
  if (!facts.length) return

  const note = `> 本项目由 \`create-app-dock\` 生成：${facts.join(' · ')}。\n`

  for (const fileName of ['README.md', 'AGENTS.md']) {
    const filePath = projectPath(root, fileName)
    try {
      const source = await readFile(filePath, 'utf8')
      await writeFile(filePath, `${note}\n${source}`)
    } catch {
      // 文件不存在时忽略
    }
  }
}

function renderReadme({ examples = true } = {}) {
  return `# AppDock（单应用）

基于 **Vue 3 + Vite + TypeScript + Ant Design Vue** 的后台应用模板，由 \`create-app-dock\` 生成。

${examples ? '' : '> 本次生成未包含示例页面（工作台 / 寻源 / 供应商等原型页面）。\n\n'}## 环境要求

- Node.js 20+
- pnpm 9+

## 快速开始

\`\`\`bash
pnpm install
pnpm dev          # 默认 mock 数据源
\`\`\`

可选数据源模式：

\`\`\`bash
pnpm dev:mock
pnpm dev:supabase   # 需先 pnpm supabase:start
pnpm build
pnpm build:mock
pnpm build:supabase
\`\`\`

## 质量检查

\`\`\`bash
pnpm run fix     # Prettier + ESLint 修复
pnpm run check   # 格式 + Lint + 类型检查
\`\`\`

## 目录结构

\`\`\`text
main-app/                 基座应用（布局 / 路由 / 主题 / 数据）
common/                   公共库（SuperTable / SvgIcon / useAccess）
docker/supabase/          本地 Supabase
docs/                     工程文档
scripts/                  Supabase 等本地脚本
\`\`\`

## 约定

- 视觉 token：\`main-app/src/hooks/theme/presets/managementSystem.ts\`（紧凑模式默认开启）
- 路由与菜单：\`main-app/src/router/BaseAppRoutes.ts\`，\`meta.title/icon\` 决定菜单
- 数据访问：\`main-app/src/data/<domain>\` 提供 repository 接口
- 更多约定见 \`AGENTS.md\` 与 \`docs/\`（其中微前端相关章节在单应用模式下不适用）
`
}

export default { applySingleAppMode, removeExamples, writeModeNote }
