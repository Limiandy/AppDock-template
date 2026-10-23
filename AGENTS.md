# AGENTS.md — AppDock Agent 协作指南

本文件是代码 Agent（Codex / Claude Code / pi 等）与贡献者在本仓库工作时的入口契约。仓库是 Vue 3 + Vite +
qiankun 微前端模板，`docs/` 存放完整说明；本文件只保留必须遵守的规则与最短路径。

## 仓库速览

```text
main-app/                 基座：布局、路由、主题、数据源、演示页
application/*             子应用：由 pnpm create:app 生成，默认为空
common/                   共享库：SuperTable、SvgIcon、useAccess、qiankun 生命周期封装
packages/create-app-dock/ 初始化 CLI（模板快照在打包时由脚本生成）
scripts/                  工程脚本：生成、增删子应用、选择运行/构建、Supabase、模板同步
vite/plugins/             自定义 Vite 插件（路由同步、rawJs）
docs/                     Agent 与工程文档
```

技术栈：Vue 3、vue-router 5、Pinia 4、Ant Design Vue 4、Vite 8、TypeScript 6、pnpm 9 workspace、qiankun 2。

## 先读顺序

| 顺序 | 文档                                 | 用途                                                           |
| ---- | ------------------------------------ | -------------------------------------------------------------- |
| 1    | `README.md`                          | 项目定位、命令、部署、当前进度                                 |
| 2    | `docs/architecture.md`               | 运行机制：启动链路、qiankun、路由同步、数据/权限/主题流        |
| 3    | `docs/scaffold.md`                   | 脚手架使用手册：命令、子应用增删、构建、本地 Supabase、CLI     |
| 4    | `docs/conventions.md`                | 工程约定与任务配方：命名、路由、SuperTable、权限、数据层、样式 |
| 5    | `docs/design-tokens.md`              | 视觉 token：色板、排版、组件规则、Antd 映射与预设              |
| 6    | `common/README.md`                   | 共享库公开入口与 API                                           |
| 7    | `packages/create-app-dock/README.md` | 初始化 CLI 用法                                                |
| 8    | `PLANS.md`                           | 历史计划与状态，判断“为什么这样设计”时查阅                     |

## 常用命令

| 命令                                                | 作用                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| `pnpm install`                                      | 安装依赖（`postinstall` 会自动构建 `common`）          |
| `pnpm dev`                                          | 全量生成微应用清单 + 构建 common + 启动 main-app       |
| `pnpm dev:mock` / `pnpm dev:supabase`               | 指定数据源的开发模式                                   |
| `pnpm dev:select`                                   | 交互选择要并行启动的项目                               |
| `pnpm build`                                        | 全量构建（gen → `vue-tsc` → common → main-app）        |
| `pnpm build:mock` / `pnpm build:supabase`           | 指定数据源构建                                         |
| `pnpm build:select`                                 | 选择子应用构建到根 `dist/<app>/`                       |
| `pnpm create:app` / `pnpm delete:app`               | 创建 / 删除子应用（含清单、路由模块、tsconfig 联动）   |
| `pnpm gen-micro-apps`                               | 手动刷新 `main-app/src/micro-apps.json`                |
| `pnpm sync:tsconfig`                                | 手动同步根 `tsconfig.json` 的 `application/*` 引用     |
| `pnpm check`                                        | 提交门禁：格式检查 + ESLint + 类型检查 + 脚本/CLI 测试 |
| `pnpm fix`                                          | 自动格式化 + ESLint 修复                               |
| `pnpm test:scripts`                                 | 同步 CLI 模板快照并运行脚本/CLI 测试                   |
| `pnpm supabase:start` / `status` / `stop` / `reset` | 本地 Supabase 生命周期                                 |

Vite 参数可透传：`pnpm dev:select -- --mode mock`。

## 硬性规则

1. **生成物不手改，只改来源。**
   `main-app/src/micro-apps.json`、`main-app/src/router/modules/*.ts`、`common/src/icons/icons.json`
   都由脚本生成。子应用增删用 `pnpm create:app` / `pnpm delete:app`；图标清单用 `node common/scripts/gen-icons.mjs`。
2. **不要手改根 `tsconfig.json` 的 `application/*` 引用。**
   `gen-micro-apps`、`dev:select`、`build:select`、子应用增删都会自动同步；必要时执行 `pnpm sync:tsconfig`。
3. **改动 `common` 后必须重新构建 `common`。** `dev*` / `build*` 脚本已内置；单独验证时执行
   `pnpm build:common`，否则 main-app 读到的仍是旧 `dist`。
4. **不提交构建与本地产物：**
   `dist/`、`node_modules/`、`packages/create-app-dock/template/`、`docker/supabase/.env.local`、`.build/`。
5. **提交前先跑一次 ESLint 自动修复，再跑门禁。** 先执行 `pnpm run lint:fix`（等价于 `eslint --fix`；需要同时格式化时用
   `pnpm run fix`），然后 `pnpm run check` 必须通过。不允许用“本地看起来没问题”代替门禁。
6. **样式优先使用 Ant Design Vue token。** 主题相关样式走 `useStyle` 的 token 参数；`scoped less`
   只做结构与布局；禁止硬编码颜色与深度覆盖组件库内部样式。全局色板以
   `main-app/src/hooks/theme/presets/managementSystem.ts`（`docs/design-tokens.md`）为准，明暗切换用 `applyThemeMode`。
7. **表单统一使用 Ant Design Vue 的 `a-form` + `a-form-item` 结构。** 校验规则写在 `a-form-item` 的
   `rules`，通过表单实例校验与提交（`formRef.validate()` / `a-form` 的
   `@finish`），不要手写字段校验，也不要直接从 DOM 取值或绕过校验调用接口。示例见 `docs/conventions.md`「表单约定」。
8. **权限统一走 `useAccess`。** 权限命名 `资源:动作`（如 `shelter:update`），支持 `资源:*` 与
   `*`；未授权时默认隐藏入口。
9. **数据访问走 `main-app/src/data/<domain>` 的 repository 接口**，不要直接在页面里散写
   `fetch`；新增数据域必须同时提供 mock 与 supabase 实现（或明确说明只支持一种）。
10. **图标统一走 sprite，不在组件里内联 SVG。** 图标放 `common/src/icons/<dir>/<name>.svg`，组件用
    `<SvgIcon name="<dir>:<name>" />`；构建时由 `vite/plugins/svgSpritePlugin.ts` 生成
    `app-icons.svg`（全量输出，支持后端下发图标名）。不要在组件里直接写 `<svg>` 路径数据。
11. **新增公共 API 必须同步文档**：`common/README.md`（入口/用法），行为变化同步 `README.md`
    / 本目录文档；文档与实现不一致视为未完成。
12. **不要擅自 push、发布 npm 包、修改远端服务或升级依赖版本**；需要时先说明并获得确认。

## 典型任务 → 做什么

| 任务              | 最短路径（详见 `docs/conventions.md`）                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 新增子应用        | `pnpm create:app` → 在 `application/<app>/src/router/index.ts` 写路由 → 启动子应用 dev，路由模块自动生成                      |
| 新增基座页面      | 在 `main-app/src/router/BaseAppRoutes.ts` 的 `asyncRoutes` 增加路由（`meta.title/icon`）→ 在 `main-app/src/views/` 建页面     |
| 新增列表页        | 用 `SuperTable`，只提供 `columns/searchFields/toolbarActions/formConfig/request`；权限用 `actions[].visible`                  |
| 新增公共组件/工具 | 放 `common/src/{components,helper,hooks}` → 更新对应出口与 `common/README.md` → 至少跑 `pnpm build:common` + `pnpm typecheck` |
| 新增图标          | `common/src/icons/<dir>/<name>.svg` → `node common/scripts/gen-icons.mjs` → 组件里用 `<SvgIcon name="<dir>:<name>" />`        |
| 新增数据域        | 建 `main-app/src/data/<domain>/{types,index,mock,supabase}.ts`，导出 repository 接口与工厂                                    |
| 调整权限          | 在 `main-app/src/access.ts` 的 mock profiles 增加权限；页面用 `can/canAny/canAll`                                             |
| 调整主题/布局     | `main-app/src/layout/BasicLayout*.vue` + `main-app/src/hooks/theme/themeCore.ts`，样式走 token                                |
| 套用/扩展视觉规范 | 见 `docs/design-tokens.md`；主题预设放 `main-app/src/hooks/theme/presets/`                                                    |

## 验证责任

| 改动类型                                | 必须执行                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 任意代码                                | `pnpm run check`                                                                                                            |
| `scripts/`、`packages/create-app-dock/` | `pnpm run check`（含 `test:scripts`，会同步模板快照并跑 CLI 测试）                                                          |
| `common/`                               | `pnpm build:common && pnpm typecheck`，必要时在页面验证                                                                     |
| 布局 / 交互 / 主题                      | `pnpm dev:mock` 打开对应路由人工确认（或截图核对）                                                                          |
| 子应用增删                              | 增删后检查 `micro-apps.json`、`router/modules/`、根 `tsconfig.json` 是否被正确更新                                          |
| 构建产物                                | `pnpm build` 或 `pnpm build:select`；确认 `dist`（混淆）+ `dist-debug`（不压缩、带 map）均产出，结构符合 `docs/scaffold.md` |
| 构建脚本 / 混淆配置 / 图标 sprite       | `pnpm build:mock`，确认 `dist/app-icons.svg` 生成、生产包无 `.map`、调试包有 `.map`                                         |

## 提交与文档约定

- 每次提交前运行一次 ESLint 自动修复：`pnpm run lint:fix`（同时格式化用 `pnpm run fix`），随后执行 `pnpm run check`。
- 提交信息使用 Conventional
  Commits：`feat:`、`fix:`、`refactor:`、`chore:`、`docs:`、`style:`、`test:`；subject 用英文，正文可中文列要点。
- 一个提交聚焦一个主题；生成物变化（如 `micro-apps.json`）与对应的脚本/代码改动放在同一提交，避免悬空。
- 文档、模板快照相关改动与代码同提交；新增根级文件后，若要进入 `create-app-dock` 模板，记得同步
  `scripts/sync-cli-template.mjs` 的 `templateEntries`。
