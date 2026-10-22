# create-app-dock

Create an AppDock workspace, either as a **micro-frontend** or a **single application**, with or without the demo pages.

```bash
npx create-app-dock@latest my-app
# 或
pnpm create app-dock my-app
```

创建结果的第一行会打印 CLI 版本（如 `create-app-dock v0.1.4`），可用 `create-app-dock --version`
单独查看，避免误用旧版本。`npx create-app-dock@latest` 是拿到最新版的推荐方式。

The initializer also accepts the npm-style alias:

```bash
pnpm init app-dock my-app --template default
```

> **pnpm 装到了旧版本（没有形态/示例选项）？** `pnpm create` / `pnpm dlx`
> 会缓存包解析结果（`~/Library/Caches/pnpm/dlx`、`~/Library/Caches/pnpm/v11/metadata`，Linux 为
> `~/.cache/pnpm/...`），发布新版本后仍可能继续安装旧版；删除缓存后依然如此时，**直接指定精确版本**最可靠：
>
> ```bash
> pnpm create app-dock@0.1.4 my-app     # 精确版本
> npx create-app-dock@latest my-app     # 或改用 npx
> ```
>
> 生成结果首行的 `create-app-dock vX.Y.Z` 会显示实际使用的版本。

## Options

| 选项                | 说明                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| `--micro`           | 微前端形态（默认）：基座 + `application/*` 子应用 + qiankun + 子应用脚手架脚本       |
| `--single`          | 单应用形态：移除 qiankun、子应用目录与子应用脚手架，仅保留 `main-app` + `common`     |
| `--examples`        | 包含示例页面（默认）：工作台、寻源、供应商、招募、招标、公司设置、消息中心等原型页面 |
| `--no-examples`     | 不包含示例页面：保留布局、主题、公共库与开发工具页，并生成一个最小首页 `/home`       |
| `--force`           | 覆盖非空目录（谨慎使用）                                                             |
| `--template <name>` | 模板名称，目前仅支持 `default`                                                       |
| `--version`, `-v`   | 打印 CLI 版本                                                                        |
| `--help`, `-h`      | 显示帮助                                                                             |

不带形态/示例选项时会在终端中交互选择：

```text
项目形态：(1) 微前端（默认） (2) 单应用 >
是否包含示例页面（工作台 / 寻源 / 供应商等）？(Y/n) >
```

在非交互环境（CI、管道）中未传选项时，使用默认值：`--micro --examples`。

## 示例

```bash
# 交互式
pnpm create app-dock my-app

# 微前端 + 示例（默认组合）
pnpm create app-dock my-app --micro

# 单应用 + 不含示例
pnpm create app-dock my-app --single --no-examples
```

## 生成后

```bash
cd my-app
pnpm install
pnpm dev
```

单应用形态的可用命令：`dev`、`dev:mock`、`dev:supabase`、`build`、`build:mock`、`build:supabase`、`check`、`fix`
以及 Supabase 相关脚本；微前端形态额外包含 `dev:select`、`build:select`、`create:app`、`delete:app`、 `gen-micro-apps`。
