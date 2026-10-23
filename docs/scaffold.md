# 脚手架使用手册

本文面向在本仓库或由 `create-app-dock`
生成的项目中工作的开发者与 Agent，说明命令、子应用生命周期与数据源切换。机制原理见 `docs/architecture.md`，编码约定见
`docs/conventions.md`。

## 1. 环境与安装

- Node.js 20+
- pnpm 9+
- 可选：Docker（本地 Supabase）；现代浏览器

```bash
pnpm install          # postinstall 会自动构建 common
```

## 2. 命令一览

| 命令                                                | 说明                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                                          | 生成 `micro-apps.json`（全量）→ 构建 common → 启动 main-app           |
| `pnpm dev:mock`                                     | 同 `dev`，显式 mock 数据源（默认）                                    |
| `pnpm dev:supabase`                                 | 同 `dev`，Supabase 数据源                                             |
| `pnpm dev:select`                                   | 扫描 main-app + `application/*`，交互选择后并行启动                   |
| `pnpm build`                                        | `gen → vue-tsc -b → common build → main-app build`                    |
| `pnpm build:mock` / `pnpm build:supabase`           | 指定数据源的构建                                                      |
| `pnpm build:select`                                 | 交互选择子应用；main-app 输出到根 `dist/`，子应用输出到 `dist/<app>/` |
| `pnpm create:app`                                   | 交互创建子应用                                                        |
| `pnpm delete:app`                                   | 交互删除子应用                                                        |
| `pnpm gen-micro-apps`                               | 手动刷新微应用清单（同时同步 tsconfig 引用）                          |
| `pnpm sync:tsconfig`                                | 手动同步根 `tsconfig.json` 的 `application/*` 引用                    |
| `pnpm check`                                        | 格式 + ESLint + 类型 + 脚本/CLI 测试（提交门禁）                      |
| `pnpm fix`                                          | 自动格式 + ESLint 修复                                                |
| `pnpm test:scripts`                                 | 同步 CLI 模板快照 + 运行脚本/CLI 测试                                 |
| `pnpm supabase:start` / `status` / `stop` / `reset` | 本地 Supabase 生命周期                                                |

Vite 参数透传：`pnpm dev:select -- --mode mock`、`pnpm build:select -- --mode supabase`。

## 3. 创建子应用

交互式：

```bash
pnpm create:app
```

参数式：

```bash
pnpm create:app -- --name demo-app --title 演示应用 --port 60013
```

脚本会自动完成：

1. 生成 `application/<name>/`：`package.json`、`index.html`、`vite.config.ts`（写入 `const port`）、
   `tsconfig.json`、`src/main.ts`、`src/router/index.ts`、`src/views/Home.vue`、`src/vite-env.d.ts`。
2. 端口分配：未指定时从 `60010` 起，取现有子应用最大端口 + 1。
3. 刷新 `main-app/src/micro-apps.json`。
4. 同步根 `tsconfig.json` 的 `application/*` 引用。

名称规则：小写字母开头，仅小写字母、数字、中划线（如 `demo-app`）。

## 4. 删除子应用

```bash
pnpm delete:app                                   # 交互选择，需输入项目名确认
pnpm delete:app -- --name demo-app --yes          # 直接删除
```

清理范围：`application/<name>/`、`main-app/src/router/modules/<name>.ts`、`micro-apps.json` 条目、根 `tsconfig.json`
引用。

## 5. 运行与选择

- `pnpm dev`：全量注册 `application/*` 后启动基座（默认端口 5173）。
- `pnpm dev:select`：列出 main-app 与全部子应用；输入编号（逗号分隔）、`all` 或直接回车全选；未勾选的项目不会写入清单。
- 子应用也可以独立运行：在 `application/<app>` 下执行 `pnpm dev`（走 `registerQiankun`
  的独立分支），同时会触发生成主应用路由模块。

开发调试入口：DEV 模式下右下角有浮动按钮组，可直达 `/base-app/icons`、`/base-app/theme-editor`、
`/base-app/super-table`；这些路由在生产构建中不会注册。

## 6. 构建

```bash
pnpm build            # 全量构建（mock 默认）
pnpm build:supabase   # 指定数据源
pnpm build:select     # 选择要参与打包的子应用
```

产物布局（`build:select`）：

```text
dist/
├── index.html          # main-app
├── assets/
├── css-app/            # 子应用（base 为 /css-app/）
│   ├── index.html
│   └── assets/
└── custom-comp-app/
```

说明：

- `pnpm build` 直接调用 main-app 自身的 `vite build`，产物在 `main-app/dist`；需要根级 `dist/` 合并布局时用
  `build:select`。
- 子应用构建由根脚本传入 `--outDir ../../dist/<app> --emptyOutDir`。
- `common` 作为 workspace 依赖参与构建，不单独产出部署目录。

## 7. 微应用清单契约

`main-app/src/micro-apps.json`：

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

- 由脚本生成且已入库；不要在应用代码里手工编辑。
- 文件不存 `entry`，基座运行时按 `DEV ? //localhost:<port> : /<name>/` 推导，因此切换 dev/build 不会改动文件。
- 只有新增/删除子应用、修改端口、`dev:select`/`build:select` 选择结果变化时才会更新。
- 端口来源：`application/<app>/vite.config.ts` 中的 `const port = <数字>`。

## 8. 路由同步

- 触发：子应用 dev server 启动/运行期间（`routeSyncPlugin` 仅 `apply: 'serve'`）。
- 输入：`application/<app>/src/router/index.ts` 中名为 `routes` 的导出。
- 输出：`main-app/src/router/modules/<app>.ts`，其中 `component: null` 会替换为 `MicroAppLoader`。
- 产物入库；改完子应用路由后由 dev server 自动刷新并提示 `[microapp-routes] ✅`，提交时一并提交。
- 基座通过 `import.meta.glob('./modules/*.ts', { eager: true })` 自动聚合，无需手工注册。

## 9. 数据源模式

| 模式         | 开启方式                                    | 数据位置                                   | 适用场景                       |
| ------------ | ------------------------------------------- | ------------------------------------------ | ------------------------------ |
| Mock（默认） | `pnpm dev:mock` / `pnpm build:mock`         | 浏览器 IndexedDB（`app-dock-static-mock`） | 静态部署、演示、无后端         |
| Supabase     | `pnpm dev:supabase` / `pnpm build:supabase` | 本地 PostgREST 代理 `/supabase/rest`       | 联调列表接口、Storage 上传下载 |

- mock 模式内置模拟身份 admin/operator/auditor，可在顶栏切换并持久化；默认身份由 `main-app/.env.mock` 的
  `VITE_MOCK_ACCESS_PROFILE` 决定。
- 生产环境若需共享数据、跨设备访问或服务端文件存储，应切换到部署后的 Supabase（或等价后端），不要沿用本地匿名策略。

## 10. 本地 Supabase

```bash
pnpm supabase:start     # 首次会生成 docker/supabase/.env.local（含本地密钥）
pnpm supabase:status
pnpm supabase:stop
pnpm supabase:reset     # 删除容器/数据卷并重新初始化
```

默认地址与资源：

```text
Supabase URL:    http://localhost:54321
Postgres:        localhost:55432
Storage bucket:  super-table-files
测试表:          public.shelters（init/99-app.sql 建表 + 示例数据）
```

`docker/supabase/.env.local` 仅本机使用，已 gitignore；`main-app/vite.config.ts` 会读取其中的 `ANON_KEY`
注入代理请求头。前端通过 `VITE_SUPABASE_REST_URL`（默认 `/supabase/rest`）与 `VITE_SUPABASE_ANON_KEY` 访问。

## 11. 本地部署验证

```bash
docker rm -f app-dock-dist 2>/dev/null || true
docker run -d --name app-dock-dist -p 18080:80 \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  nginx:alpine
```

前端路由刷新需要 fallback：

```nginx
location ^~ /css-app/ {
    try_files $uri $uri/ /css-app/index.html;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

### Docker 镜像

```bash
# 质量门禁（等价 pnpm run check，节点不需要 node/pnpm）
docker build --target verify .

# 生产镜像（dist：压缩 + 混淆）
docker build --build-arg BUILD_SCRIPT=build:mock -t app-dock:local .
docker run --rm -p 18080:80 app-dock:local

# 可调试镜像（dist-debug：不压缩、带 sourcemap，仅内网）
docker build --build-arg BUILD_SCRIPT=build:mock --target debug -t app-dock:debug .
docker run --rm -p 18081:80 app-dock:debug
```

- 多阶段：`build`（node:22-alpine + pnpm，`BUILD_SCRIPT` 可选 `build` / `build:mock` / `build:supabase`）→ `verify` /
  `runtime` / `debug`（nginx:alpine）。
- `docker/nginx.conf`：SPA fallback、gzip、`/assets/` 长缓存、`app-icons.svg` 缓存一天、`index.html`
  no-cache、`/healthz` 健康检查。
- 子应用单独部署到子路径时，追加 `location ^~ /<app>/ { try_files $uri $uri/ /<app>/index.html; }`。

### Jenkins

根目录 `Jenkinsfile` 是 Declarative Pipeline，参数：`BUILD_SCRIPT`、`IMAGE_REPOSITORY`、`IMAGE_TAG` （默认 git short
SHA）、`REGISTRY_URL`、`DOCKER_CREDENTIALS_ID`、`PUSH_IMAGE`、`BUILD_DEBUG_IMAGE`。

阶段：Prepare（算 tag）→ Verify（`docker build --target verify`）→ Build image → 可选 Build debug image → Smoke
test（起容器校验 `/healthz`、`index.html`、`app-icons.svg`）→ 可选 Push。

- 节点只需要 docker；`corepack`/`pnpm` 都在镜像里执行，避免污染 Jenkins 工作区。
- 推送使用 `docker.withRegistry`，凭据默认 ID 为 `docker-registry`，按实际环境修改。

## 12. create-app-dock CLI

```bash
npx create-app-dock@latest my-app                 # 推荐：npx 拉取最新版
pnpm create app-dock my-app                       # 交互式选择形态与示例
pnpm create app-dock my-app --micro               # 微前端（默认）
pnpm create app-dock my-app --single              # 单应用
pnpm create app-dock my-app --no-examples         # 不含示例页面
pnpm create app-dock my-app --force               # 覆盖非空目录（谨慎）
```

生成选项：

| 选项                           | 效果                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `--micro` / `--single`         | 微前端保留 `application/*`、qiankun、子应用脚手架脚本；单应用移除这些内容，只保留 `main-app` + `common`            |
| `--examples` / `--no-examples` | 示例页面指工作台/寻源/供应商/招募/招标/公司设置/消息中心等参考稿原型；关闭后保留布局与主题，并生成最小首页 `/home` |

- 非交互环境未传选项时默认 `--micro --examples`。
- 成功后首行会打印 CLI 版本（`create-app-dock vX.Y.Z`），也可用 `--version` / `-v` 单独查看。
- **默认无需指定版本**：不带版本号的包名按 registry 的 `latest` 标签解析，每次发布都会更新该标签。
- **pnpm 可能装到旧版本**（表现为「没有出现形态/示例选项」）：pnpm 的 `create` / `dlx`
  会缓存包解析结果（`~/Library/Caches/pnpm/dlx`、`~/Library/Caches/pnpm/v11/metadata`；Linux 为
  `~/.cache/pnpm/...`），个别环境会长期停在旧版本。排查顺序：`npm view create-app-dock version`
  确认最新版 → 删缓存重试 → 改用 `npx create-app-dock@latest`，必要时用 `pnpm create app-dock@<version>` 精确版本兜底。
- 模板快照由 `scripts/sync-cli-template.mjs` 在 `prepack` / `test:scripts` 时生成（目录本身已 gitignore）。
- **新增根级文件或文档，如果生成的项目也需要，必须登记到 `templateEntries`。**
- 发布：更新 `packages/create-app-dock/package.json` 版本 → 打 tag `create-app-dock-v<version>` → GitHub
  Actions 校验后经 npm Trusted Publishing 发布。

## 13. 构建产物与代码混淆

`pnpm build` / `build:mock` / `build:supabase` 会连续产出两套包（`scripts/build-app.mjs` 驱动）：

| 目录（相对 `main-app`） | 内容                                                                     |
| ----------------------- | ------------------------------------------------------------------------ |
| `dist/`                 | 生产包：oxc 压缩 + javascript-obfuscator 混淆（vendor 跳过），不产出 map |
| `dist-debug/`           | 调试包：不压缩、不混淆、带 sourcemap，用于排查线上问题                   |

- 开关是环境变量 `APP_DEBUG_BUNDLE=1`；只出其中一套时：
  `node scripts/build-app.mjs <mode> --prod-only|--debug-only`。根脚本 `pnpm build:debug` 只出调试包。
- 混淆配置在 `vite.config.base.ts`：`vite-plugin-bundle-obfuscator` + `autoExcludeNodeModules` （node_modules 拆成
  `vendor-modules-*` 并跳过）+ `threadPool`。业务 chunk 才会被混淆。
- `build:select`（多子应用选择构建）目前只出生产包。
- 调试包本地预览：`pnpm --filter main-app exec vite preview --outDir dist-debug`。
- `dist-debug/` 已在 `.gitignore` 中。

图标（`common/src/icons`）不再内联进 JS，构建时由 `vite/plugins/svgSpritePlugin.ts` 生成 `app-icons.svg` 静态资源：

- **始终输出全量图标**：菜单等场景的图标名可能由后端配置下发（新建菜单时选图标），前端运行时才拼出 `app:xxx` /
  `solar:xxx`，构建期无法可靠判断「用到哪些」，裁剪会漏图标；
- 全量 sprite 约 1.7MB，gzip 后约 400KB，作为独立文件可被浏览器/CDN 缓存，不再进入 JS 包；
- HTML 会注入 `<meta name="app-icon-sprite">`，`SvgIcon` 通过 `<use href="…">` 引用该文件；
- 新增图标把 SVG 放进 `common/src/icons/<dir>/` 并运行 `node common/scripts/gen-icons.mjs`；
- SVG 里不要带 `<!DOCTYPE>` / `<!ENTITY>`（插件会自动剥离，其它 `<!...>`
  声明会直接构建失败，因为非法声明会让整个 sprite 解析失败、后续图标全部不显示）。

## 14. 排错速查

| 现象                           | 原因与处理                                                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 启动报找不到 `micro-apps.json` | 直接跑了 `vite` 而没走根脚本；执行 `pnpm gen-micro-apps` 或改用 `pnpm dev`                                           |
| 子应用菜单不出现               | 路由模块未生成：让子应用 dev server 跑起来触发同步，或检查 `application/<app>/src/router/index.ts` 是否导出 `routes` |
| 类型检查缺少子应用             | 根 `tsconfig.json` 引用漂移：执行 `pnpm sync:tsconfig`                                                               |
| 改了 `common` 页面无变化       | `common` 读取的是 `dist`：执行 `pnpm build:common` 后重启 dev                                                        |
| 图标显示空白                   | 检查 `common/src/icons/icons.json` 是否包含该图标；新增图标后执行 `node common/scripts/gen-icons.mjs`                |
| 端口冲突                       | 修改 `application/<app>/vite.config.ts` 的 `const port`，再跑 `pnpm gen-micro-apps`                                  |
