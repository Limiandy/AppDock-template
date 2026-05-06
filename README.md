# VuePlayground

VuePlayground 是一个基于 Vue 3、Vite、TypeScript、Ant Design Vue 和 qiankun 的微前端实验项目。

当前项目包含一个主应用、一个公共库，以及多个可独立运行和打包的子应用。项目提供了脚本来创建子应用、删除子应用、选择运行子应用、选择打包子应用，并自动维护主应用需要的微应用配置。

## 项目结构

```text
.
├── application/              # 子应用
│   ├── css-app/
│   ├── custom-comp-app/
│   └── test-app/
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
pnpm gen-micro-apps   # 手动生成 dev 微应用配置
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

`main-app/src/micro-apps.json` 是生成文件，已加入 `.gitignore`，不要手动维护。

不同命令会生成不同环境的入口：

- `pnpm dev` / `pnpm dev:select`：生成开发态入口，例如 `//localhost:60012`
- `pnpm build` / `pnpm build:select`：生成部署态入口，例如 `/css-app/`

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

这些路由模块会被主应用自动加载，用于菜单和路由展示。

## 本地部署验证

可以用 nginx 容器挂载构建后的 `dist`：

```bash
docker rm -f vue-playground-dist 2>/dev/null || true
docker run -d --name vue-playground-dist -p 18080:80 \
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

Storage 的本地 bucket 已配置匿名读写策略，方便调试导入、导出、上传和下载流程。生产环境不要沿用这组策略。

## 注意事项

- 子应用名称建议使用小写字母、数字和中划线，例如 `demo-app`
- 子应用端口在 `application/<app-name>/vite.config.ts` 中定义
- `main-app/src/micro-apps.json` 是生成文件，不要提交
- `dist/`、`node_modules/`、各子应用独立生成的 `dist/` 不要提交
- 模板分支暂时只作为空壳模板使用，需要同步能力时再单独整理
