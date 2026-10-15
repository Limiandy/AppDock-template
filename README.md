# AppDock

AppDock 是一个基于 Vue 3、Vite、TypeScript、Ant Design Vue 和 qiankun 的微前端实验项目。

仓库默认包含一个主应用和一个公共库；子应用通过脚手架创建，可独立运行和打包。项目提供了脚本来创建子应用、删除子应用、选择运行子应用、选择打包子应用，并自动维护主应用需要的微应用配置与路由。

## 文档导航

| 文档                    | 内容                                                             |
| ----------------------- | ---------------------------------------------------------------- |
| `AGENTS.md`             | Agent/贡献者入口契约：硬性规则、常用命令、验证责任、提交约定     |
| `docs/architecture.md`  | 架构与运行机制：启动链路、qiankun、路由同步、数据/权限/主题流    |
| `docs/scaffold.md`      | 脚手架使用手册：命令、子应用增删、构建、本地 Supabase、CLI       |
| `docs/conventions.md`   | 工程约定：命名、路由、SuperTable、权限、数据层、样式、生成物     |
| `docs/design-tokens.md` | 视觉 token 提炼：色板、排版、尺寸/圆角/阴影、Antd 映射与落地预设 |
| `common/README.md`      | 共享库公开入口与 API                                             |
| `PLANS.md`              | 计划与决策记录                                                   |

## 项目结构

```text
.
├── application/              # 子应用（通过 pnpm create:app 生成）
├── common/                   # 公共库
├── main-app/                 # 主应用
├── scripts/                  # 项目脚本
├── types/                    # 全局类型声明
├── vite/                     # 自定义 Vite 插件
├── vite.config.base.ts       # 主应用和子应用共用 Vite 配置
└── pnpm-workspace.yaml       # pnpm workspace 配置
```

## 环境要求

- Node.js 20+
- pnpm 9+

安装依赖：

```bash
pnpm install
```

## 常用命令

```bash
pnpm dev              # 生成 dev 微应用配置并运行主应用
pnpm dev:select       # 选择要运行的主应用/子应用
pnpm build            # 生成 build 微应用配置并构建主应用
pnpm build:select     # 选择要参与打包的子应用
pnpm create:app       # 创建子应用
pnpm delete:app       # 删除子应用
pnpm gen-micro-apps   # 手动生成微应用配置
pnpm sync:tsconfig    # 手动同步根 tsconfig 的项目引用（dev/build 会自动执行）
pnpm test:scripts     # 运行脚本单元测试
```

Vite 参数可以透传：

```bash
pnpm dev:select -- --mode test
pnpm build:select -- --mode staging
```

## 创建子应用

交互式创建：

```bash
pnpm create:app
```

直接传参创建：

```bash
pnpm create:app -- --name demo-app --title 演示应用 --port 60013
```

创建完成后会自动刷新 `main-app/src/micro-apps.json`。

## 删除子应用

交互式删除：

```bash
pnpm delete:app
```

直接删除：

```bash
pnpm delete:app -- --name demo-app --yes
```

删除脚本会同步清理：

- `application/<app-name>`
- `main-app/src/router/modules/<app-name>.ts`
- `main-app/src/micro-apps.json`

不加 `--yes` 时，脚本会要求输入项目名确认。

## 微应用配置

`main-app/src/micro-apps.json` 由脚手架扫描 `application/*` 生成，作为子应用注册清单入库，不要手动维护。

文件只记录子应用名称、开发端口和挂载约定；主应用在运行时按当前模式推导 qiankun 入口：

- 开发态：`//localhost:<port>`
- 构建产物：`/<app-name>/`

因此切换 dev/build 不会反复改写该文件，只有新增、删除子应用或修改端口时才会更新。

`pnpm dev` / `pnpm dev:select` / `pnpm build` / `pnpm build:select` 会按扫描或选择结果重写该文件。

## 开发运行

运行主应用：

```bash
pnpm dev
```

选择运行多个项目：

```bash
pnpm dev:select
```

`dev:select` 会扫描 `application/*`，然后在当前终端中并行启动选中的项目。

## 打包

只构建主应用：

```bash
pnpm build
```

选择子应用一起打包：

```bash
pnpm build:select
```

构建产物规则：

- `main-app` 输出到根目录 `dist/`
- 子应用输出到 `dist/<app-name>/`
- `common` 作为 workspace 公共库参与应用构建，不作为独立部署目录

示例：

```text
dist/
├── index.html
├── assets/
├── css-app/
│   ├── index.html
│   └── assets/
└── custom-comp-app/
    ├── index.html
    └── assets/
```

## 路由同步

子应用开发时，`vite.config.base.ts` 会通过路由同步插件读取子应用的 `src/router/index.ts`，并生成主应用路由模块：

```text
main-app/src/router/modules/<app-name>.ts
```

这些路由模块会被主应用自动加载，用于菜单和路由展示。生成的 `main-app/src/router/modules/<app-name>.ts`
随子应用一起入库，`modules/` 目录通过 `.gitkeep` 保留。

## 本地部署验证

可以用 nginx 容器挂载构建后的 `dist`：

```bash
docker rm -f app-dock-dist 2>/dev/null || true
docker run -d --name app-dock-dist -p 18080:80 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  nginx:alpine
```

访问：

```text
http://localhost:18080/
```

如果需要支持前端路由刷新，静态服务需要配置 fallback。例如：

```nginx
location ^~ /css-app/ {
    try_files $uri $uri/ /css-app/index.html;
}

location ^~ /custom-comp-app/ {
    try_files $uri $uri/ /custom-comp-app/index.html;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## 本地 Supabase

项目内置了一个轻量 Docker Supabase 环境，用来测试列表接口、Storage 文件上传下载等能力：

```bash
pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop
pnpm supabase:reset   # 删除容器和数据卷，重新初始化
```

首次启动会自动生成 `docker/supabase/.env.local`，里面包含本地 Postgres 密码、JWT secret、anon key 和 service role
key。该文件只用于本机调试，不要提交。

默认地址：

```text
Supabase URL: http://localhost:54321
Postgres:     localhost:55432
Storage bucket: super-table-files
```

测试表：

```text
public.shelters
```

## 静态 Mock 模式

默认的前端数据源是浏览器 IndexedDB
Mock：它随静态前端产物部署，不需要网关、数据库或运行时 Secret，数据仅保留在当前浏览器。

```bash
pnpm dev:mock
pnpm build:mock
```

Mock 模式支持演示数据的筛选、分页、新增、编辑、删除与重置。需要联调本地 Supabase 时，先启动本地服务，再使用 Supabase 模式：

```bash
pnpm supabase:start
pnpm dev:supabase
pnpm build:supabase
```

线上静态站点如需共享数据、跨设备访问或服务端文件存储，应切换到 Supabase 或其他部署后的后端服务。

Mock 环境内置模拟管理员、业务录入员和只读审计员，可在顶部选择器切换，并将当前身份保存到浏览器。默认身份可在
`main-app/.env.mock` 的 `VITE_MOCK_ACCESS_PROFILE` 配置。实际登录完成后，应用应调用
`useAccess().setPermissions(identity.permissions)` 覆盖模拟权限集；未写入权限时，受权限控制的工具栏和行操作默认不展示。

Storage 的本地 bucket 已配置匿名读写策略，方便调试导入、导出、上传和下载流程。生产环境不要沿用这组策略。

## 注意事项

- 子应用名称建议使用小写字母、数字和中划线，例如 `demo-app`
- 子应用端口在 `application/<app-name>/vite.config.ts` 中定义
- `main-app/src/micro-apps.json` 由脚本生成并已入库，不要手动编辑
- `main-app/.env.mock`、`main-app/.env.supabase` 只包含数据源开关和模拟身份，已入库，不含密钥
- `dist/`、`node_modules/`、各子应用独立生成的 `dist/` 不要提交
- 仓库当前只有 `master` 分支；`create-app-dock` 的模板快照在打包时由 `scripts/sync-cli-template.mjs`
  生成，不再维护独立的 `template` 分支

## 当前进度

记录时间：2026-05-12

已完成：

- 已建立 Vue monorepo 的 ESLint、Prettier、TypeScript 检查命令，`pnpm run fix` 和 `pnpm run check` 是当前默认质量入口。
- 已将 `main-app/src/components/antdv-token-previewer` 和 `main-app/src/components/vue-colorful` 纳入格式化/检查范围。
- 已修复 TypeScript project references，使 `common`、`main-app` 和 `application/*` 子应用能被根级 `typecheck` 覆盖。
- 已完成 SuperTable 的基础 CRUD 表单弹窗封装，并接入本地 Supabase `public.shelters` 接口做新增、编辑、详情、删除测试。
- 本地 Supabase 已准备约 500 条 `public.shelters` 测试数据，供 SuperTable 分页、查询和 CRUD 调试。
- 已根据 Ant Design Vue token 优化 SuperTable 外层 UI，减少硬编码样式并提升与主题编辑器的兼容性。
- 已优化主布局侧栏样式，折叠按钮改为侧栏内部自定义触发器，并跟随 Ant Design token。
- 已抽取全局 Codex skill：`vue-quality-config`，用于后续新 Vue 项目快速配置 ESLint、Prettier、TypeScript、`fix/check`
  命令。
- 已默认使用 IndexedDB Mock 数据源，可在顶部切换模拟管理员/录入员/审计员，权限通过 `common` 的 `useAccess`
  控制；Supabase 模式保持可选。
- 已补齐 `create-app-dock` 初始化 CLI 与 npm 发布工作流（GitHub Actions OIDC），当前发布版本 `0.1.1`。
- 已清理 `main-app/vite.config.ts` 中遗留的内网代理，仅保留 Supabase 代理。
- `main-app/src/micro-apps.json` 与 `main-app/src/router/modules/*.ts`
  已入库；注册清单只记录名称、端口和挂载约定，入口在运行时按 dev/build 推导。
- 已新增 `pnpm sync:tsconfig`，并在 `gen-micro-apps`、`dev:select`、`build:select` 和子应用增删时自动同步根
  `tsconfig.json` 的 `application/*` 引用。
- 已移除根 `package.json` 中无效的 npm `workspaces` 字段，并入库 `.env.mock`、`.env.supabase` 两个数据源配置。

暂停点：

- 当前视觉优化仍处于评审阶段，后续恢复时建议先打开 `http://localhost:5173/base-app/super-table`
  检查 SuperTable 和侧栏视觉效果。
- 如果继续做全局 UI 规范，应优先使用 Ant Design Vue 组件能力和 token，避免深度覆盖组件库内部样式。

建议恢复流程：

```bash
pnpm install
pnpm supabase:start
pnpm dev
pnpm run check
```
