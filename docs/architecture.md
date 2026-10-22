# 架构说明

本文说明 AppDock 模板的运行机制，帮助 Agent 在改动前建立正确的系统模型。使用方式与命令见 `docs/scaffold.md`，编码约束见
`docs/conventions.md`。

## 1. 模块总览

```text
main-app（基座）
├── src/App.vue              ConfigProvider（zhCN + theme）+ a-app 反馈容器
├── src/InjectApply.vue      初始化全局 store、把 Antd token 写入 :root CSS 变量
├── src/layout/              BasicLayout（顶栏/侧栏/面包屑/内容区）+ BasicLayoutBreadcrumb
├── src/router/              BaseAppRoutes（手写）+ modules/*.ts（子应用路由，生成）
├── src/data/                repository 接口 + mock / supabase 适配器
├── src/access.ts            mock 权限身份（admin/operator/auditor）
├── src/hooks/               useEvent、style/useStyle、theme/themeCore
└── src/store/               Pinia（含持久化插件、全局反馈实例）

application/<app>（子应用）
├── src/main.ts              registerQiankun(App, { container: '#app', plugins: [Antd, router] })
├── src/router/index.ts      导出 routes，被基座的路由同步插件解析
└── vite.config.ts           继承根 vite.config.base，声明端口

common（共享库，构建为 dist 后被应用引用）
├── qiankunLifeCycle.ts      生命周期封装：独立运行 / 被 qiankun 加载
├── components/              SuperTable、SuperTableFormModal、SvgIcon
├── hooks/                   useAccess、useWorkerPool
├── helper/                  EventEmitter、WorkerPool、piniaHelper、typeJudg
└── icons/                   solar SVG + icons.json（生成）

packages/create-app-dock   CLI：把仓库快照生成新项目
scripts/                   生成、增删、选择、Supabase、模板同步
vite/plugins/              routeSyncPlugin（路由同步）、rawJSPlugin（?rawJs 转译）
```

## 2. 基座启动链路

`main-app/src/main.ts`：

```text
createApp(App)
  → initializeAccess()        根据 VITE_DATA_SOURCE 决定 mock 身份或读取配置权限
  → setupStore(app)           Pinia
  → setupRouter(app)          路由（含 import.meta.glob 聚合的子应用路由模块）
  → app.use(Antd).mount()
  → registerMicroApp()        注册 qiankun 子应用并 start
```

`main-app/src/registerMicroApp.ts` 的关键行为：

1. `initGlobalState({ user })` 并监听全局状态变化（日志用途）。
2. **入口在运行时推导**，`micro-apps.json` 不再存 `entry`：
   - 开发态（`import.meta.env.DEV`）：`//localhost:<port>`
   - 构建产物：`/<app-name>/`
3. `registerMicroApps` 的 `beforeLoad` / `afterMount` 通过事件总线切换全局 loading。
4. `start({ prefetch: true, sandbox: { experimentalStyleIsolation: true } })`。

## 3. 布局与渲染分流

`BasicLayout.vue` 是与参考稿对齐的后台壳层：

- 整高侧栏：顶部 Logo 区 + 内联菜单（可滚动），选中项为浅蓝底（`colorPrimaryBg`）+ 主色文字；折叠状态持久化到
  `localStorage`。宽度随主题密度变化：紧凑 152（折叠 64）/ 常规 200（折叠 80）。
- 顶栏：折叠按钮 + 面包屑（当前位置）+ 右侧控件（动作图标、主题开关、用户菜单）。高度随密度变化：紧凑 36 / 常规 48。
- 内容区：独立滚动，渲染 `router-view`（基座页面）或 `#qiankun-container`（qiankun 子应用）。

主应用根据当前路径决定内容渲染方式：

```ts
const baseAppRoutePaths = getBaseAppRoutePaths(asyncRoutes.concat(constantRoutes))
const isBaseRoutePath = computed(() => baseAppRoutePaths.includes(route.fullPath))
// true  → <router-view />（基座页面）
// false → <div id="qiankun-container" />（交给 qiankun 的子应用）
```

面包屑数据来自 `route.matched` 中带 `meta.title` 的记录：

- 仅当前页为纯文本且加粗，父级只有在“有真实组件”时才渲染为可点击链接（`component: null`
  的父级保持文本，避免跳到空页面）。
- 不显示图标（按设计约定）。

布局尺寸（顶栏 36px、侧栏 228/80px）由 `BasicLayout.vue` 固定，顶栏高度不再跟随 Antd 的 `controlHeight * 2` 推导。

## 4. 路由体系

`main-app/src/router/index.ts` 聚合三类路由：

| 来源             | 说明                                                                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constantRoutes` | 404 兜底，永远注册                                                                                                                                                               |
| `asyncRoutes`    | 原型菜单：工作台/寻源/招募管理/供应商考察/供应商管理/招标管理/对接会/公司设置/个人设置；DEV 下额外挂载 `baseAppDevRoutes`（图标/主题编辑器/超级表格）与 `systemManagementRoutes` |
| `microAppRoutes` | `import.meta.glob('./modules/*.ts', { eager: true })`，由路由同步插件生成                                                                                                        |

菜单由 `router.getRoutes()` 转换而来：`meta.title` 作为标签、`meta.icon` 作为图标、`meta.hideInMenu` 控制隐藏。
`component: null` 的父路由只作为菜单容器，最终跳转由子路由承担；根路由重定向到 `/workbench`。

原型中的列表页大量复用 `SimpleListPage.vue`：路由 props 传入 `configKey`，列/查询配置在
`main-app/src/views/list-page-configs.ts`，数据来自 `main-app/src/data/prototype/datasets.ts`。正式项目应将原型数据按
`data/<domain>/` 拆为带 mock/supabase 双实现的领域 repository。

供应商各阶段列表（初筛/储备/收藏/回收站/补充资料/不合格）复用 `views/supplier/SupplierListPage.vue`，阶段间流转由
`data/prototype/store.ts`
的内存态仓库驱动；供应商详情抽屉、消息中心（`views/message/MessageCenter.vue`）、组织架构树表（`views/company/CompanyOrg.vue`）是参考稿定制页。

## 5. 微应用注册契约

`main-app/src/micro-apps.json`（已入库，由脚本生成）：

```json
[
  {
    "name": "css-app",
    "port": 60012,
    "container": "#qiankun-container",
    "activeRule": "/css-app",
    "props": {}
  }
]
```

- `port` 来自子应用 `vite.config.ts` 中的 `const port = <数字>`。
- 不存 `entry`；开发/生产入口由基座运行时推导，因此该文件不随 dev/build 模式变化。
- 变化时机：新增/删除子应用、修改端口、`dev:select` / `build:select` 选择结果。

子应用侧的接入由 `common/src/qiankunLifeCycle.ts` 的 `registerQiankun` 封装：被 qiankun 加载时注册
`bootstrap/mount/unmount` 生命周期；独立运行时直接 `render({})`
挂载。无论哪种模式都会安装 Pinia、`SvgIcon`、公共指令与调用方传入的插件。

## 6. 路由同步（开发期）

`vite/plugins/routeSyncPlugin.ts` 在**子应用的 dev server** 中生效（`apply: 'serve'`），流程：

```text
解析 application/<app>/src/router/index.ts
  → 找到名为 routes 的变量（Babel AST）
  → 递归转换：component: null 占位、name 前缀去重、path 去前导斜杠
  → 用 MicroAppLoader 替换 null
  → 写入 main-app/src/router/modules/<app>.ts（prettier 格式化）
  → watch 源文件，变更时重新生成
```

要点：

- 路由模块是**生成物但入库**；修改子应用路由后由 dev server 自动刷新。
- `MicroAppLoader` 目前就是 `<router-view />`，保证子应用路由在基座内可嵌套渲染。
- 生产构建不会触发生成，因此提交前应确保模块已生成并入库。

## 7. 构建与产物

```bash
pnpm build          # gen → vue-tsc -b → common build → main-app build（默认 mock 数据源）
pnpm build:select   # 交互选择子应用，输出到根 dist/<app>/
```

产物布局：

```text
dist/
├── index.html          # main-app（仅 build:select 输出到根 dist；pnpm build 输出在 main-app/dist）
├── assets/
└── <app-name>/         # 子应用静态资源，需 nginx fallback
```

`vite.config.base.ts` 决定 `base`：`main-app` 为 `/`，子应用为
`/<app-name>/`；子应用额外注册 qiankun 插件与路由同步插件。

## 8. 数据流

`VITE_DATA_SOURCE`（`main-app/.env.mock` / `.env.supabase`）选择适配器：

```text
页面 → main-app/src/data/<domain>/index.ts 导出 repository
        ├── mock.ts      IndexedDB，浏览器本地持久化，默认
        └── supabase.ts  PostgREST，开发经 /supabase/rest 代理
```

- Supabase 模式的匿名 key 由 `main-app/vite.config.ts` 从 `docker/supabase/.env.local` 读取并注入代理请求头。
- repository 接口形状参考 `main-app/src/data/shelters/types.ts`：`list/create/update/remove`，可选 `resetDemoData`。
- 页面不直接调用 Supabase/IndexedDB，只依赖接口，便于替换与测试。

## 9. 权限流

```text
main-app/src/access.ts
  ├── mock 模式：内置 admin/operator/auditor，选择结果持久化到 localStorage
  └── supabase 模式：读取 VITE_ACCESS_PERMISSIONS
        ↓ setPermissions(identity.permissions)
common/src/hooks/useAccess.ts（全局响应式权限集）
        ↓ can('shelter:update') / canAny / canAll
SuperTable 的 toolbarActions[].visible 与 columns[].actions[].visible
```

匹配规则：精确匹配、`资源:*` 前缀匹配、`*` 全量；未设置权限时全部为 `false`（默认不展示敏感入口）。

## 10. 主题流

```text
全局默认 = presets/managementSystem（seed + light 中性层）
BasicLayout / ThemeEditor 切换主题
  → applyThemeMode(mode)：整层替换 light/dark 中性 token（保留品牌种子与编辑器自定义）
  → eventBus.emit('themeChange', 完整 themeConfig, info)
  → App.vue 监听并 setGlobalThemeConfig(...)（replaceToken / replaceComponents）
  → Antd ConfigProvider 响应式更新
  → InjectApply 把 token 写入 :root CSS 变量（color/font-size/background）
  → useStyle 生成 token 驱动的样式表（如 BasicLayout、SuperTable）
```

`main-app/src/hooks/theme/themeCore.ts` 提供
`globalThemeMode/globalThemeConfig/setGlobalThemeConfig/applyThemeMode/getAlgorithmsByMode/getModeByThemeConfig`。色板与 token 说明见
`docs/design-tokens.md`。

## 11. common 的构建形态

- 多入口：`index`、`components`、`helper`、`hooks`、`icons`（`common/vite.config.ts`）。
- `preserveModules` 保留模块结构，便于按需引入；`vue` 与 `ant-design-vue` 为 external。
- `vite-plugin-dts` 产出类型；`vite-plugin-lib-inject-css` 处理样式注入。
- `virtual:svg-icons-register` 在 `common/src/index.ts` 引入，注册 `icon-<dir>-<name>` symbol；`SvgIcon` 把 `solar:xxx`
  映射成对应 symbol id。

## 12. create-app-dock 模板机制

`packages/create-app-dock/template/` 不是手写目录，而是 `scripts/sync-cli-template.mjs` 在 `prepack` / `test:scripts`
时从仓库根生成的快照：

- 白名单复制 `templateEntries`（新增根级文件需登记）。
- 排除 `dist`、`node_modules`、`.git`、`.env.local`、模板目录自身等。
- 生成时改写：`pnpm-workspace.yaml` 移除 `packages/*`、lockfile 移除工作区包、`test:scripts` 调整为不依赖同步脚本。
- 发布流程：打 tag `create-app-dock-v<version>` → GitHub Actions 校验版本 → npm Trusted Publishing（见
  `.github/workflows/publish-create-app-dock.yml`）。

## 13. 质量体系

| 工具                  | 作用                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Prettier              | 统一格式，`pnpm format:check`；忽略 `dist`、`micro-apps.json`、模板快照等                                   |
| ESLint（flat config） | TS/Vue 规则，`pnpm lint`                                                                                    |
| `vue-tsc -b`          | 基于 TypeScript project references 的全仓类型检查；根 `tsconfig.json` 的 `application/*` 引用由脚本自动同步 |
| `node:test`           | `scripts/*.test.mjs` 与 `packages/create-app-dock/test/*.test.mjs`，覆盖生成逻辑与 CLI 行为                 |
| `pnpm check`          | 上述全部串联，作为提交门禁                                                                                  |
