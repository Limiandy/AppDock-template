# common

`common`
是当前微前端项目的共享包，用来沉淀主应用和子应用都会复用的基础能力。它以本地 workspace 包的形式被其他应用引用，应用构建时会一起打进最终产物中。

## 公开入口

| 入口                | 说明                                                             |
| ------------------- | ---------------------------------------------------------------- |
| `common`            | 主入口，导出微应用生命周期注册、全局组件、指令插件和部分基础工具 |
| `common/components` | 公共 Vue 组件，目前包含 `SvgIcon` 和 `SuperTable`                |
| `common/helper`     | 工具函数、事件总线、WorkerPool、Pinia 初始化辅助                 |
| `common/hooks`      | 组合式 hooks，目前包含 WorkerPool 相关 hook                      |
| `common/icons`      | 图标元数据读取能力，用于图标列表和分组展示                       |

## 主入口能力

```ts
import { DirectivesPlugin, EventEmitter, registerQiankun, store, SuperTable, SvgIcon, WorkerPool } from 'common'
```

- `registerQiankun`：封装 `vite-plugin-qiankun` 生命周期，负责创建 Vue 应用、注册 Pinia、注册
  `SvgIcon`、安装公共指令，并挂载子应用。
- `SvgIcon`：基于 SVG symbol 的图标组件，默认使用 `icon` 前缀，支持 `solar:xxx` 这类图标名。
- `SuperTable`：基于 Ant Design Vue
  Table/Form 的配置化表格，内置查询区、工具栏、行操作、分页和导入弹窗，并跟随全局主题 token 变化。
- `DirectivesPlugin`：公共指令插件，目前注册 `v-loading`。
- `EventEmitter`：轻量事件总线，支持 `on`、`off`、`once`、`emit`、`clear`。
- `WorkerPool`：Web Worker 池封装，支持按名称注册 worker 代码并提交任务。
- `store`：公共 Pinia 实例。

## 子入口能力

### components

```ts
import { SuperTable, SvgIcon } from 'common/components'
```

`SuperTable` 通过 `columns`、`searchFields`、`toolbarActions`、`rowActions` 等配置组织常见列表页能力。组件会透传 Ant
Design Vue Table 的 attrs、`tableProps` 和常用 slots；如果需要定制单元格，优先使用 `cell-字段名` slot，也可以使用
`bodyCell` slot。

最小使用方式推荐把分页请求交给组件，页面只提供列、查询项和请求函数：

```vue
<template>
  <SuperTable row-key="id" :columns="columns" :search-fields="searchFields" :request="getPage" />
</template>

<script setup lang="ts">
import { SuperTable } from 'common'
import type { SuperTableRequestParams, SuperTableRequestResult } from 'common'

async function getPage(params: SuperTableRequestParams): Promise<SuperTableRequestResult> {
  return fetch('/api/list', {
    method: 'POST',
    body: JSON.stringify(params),
  }).then((res) => res.json())
}
</script>
```

也可以直接传 `api`：

```vue
<SuperTable api="/api/list" request-method="POST" :columns="columns" :search-fields="searchFields" />
```

如果后端分页字段不统一，可以用 `transformParams` 和 `transformResponse` 适配；静态数据场景继续使用
`dataSource`、`loading`、`pagination` 即可。

### helper

```ts
import { classNames, EventEmitter, setupStore, WorkerPool } from 'common/helper'
```

`helper` 用于放置纯工具、基础类和跨应用初始化辅助。新增稳定工具时优先从这里导出。

### hooks

```ts
import { useWorkerPool } from 'common/hooks'
```

`hooks` 用于放置 Vue 组合式 API。当前 `useWorkerPool` 返回共享的 `WorkerPool` 实例。

### icons

```ts
import { getAllIcons, getIconsGrouped } from 'common/icons'
```

`icons` 用于读取内置 SVG 图标清单：

- `getAllIcons()`：返回全部图标。
- `getIconsGrouped()`：按图标分组返回。

## 构建

```bash
pnpm --filter common build
pnpm --filter common clean
```

构建产物输出到 `common/dist`，由 `package.json` 的 `exports` 暴露给应用侧使用。业务应用通常不需要单独关心 `dist`
内容，只需要按公开入口导入。

## 维护约定

- 新增 `common` 功能时，同步更新本文档，至少说明导出入口、用途和最小使用示例。
- 新增公共 API 时，优先通过 `common/src/index.ts` 或对应子入口统一导出，避免应用直接依赖内部文件路径。
- `dist` 是构建产物，不在文档中作为源码能力描述。
