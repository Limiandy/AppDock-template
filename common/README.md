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
import {
  DirectivesPlugin,
  EventEmitter,
  registerQiankun,
  store,
  SuperTable,
  SvgIcon,
  useAccess,
  WorkerPool,
} from 'common'
```

- `registerQiankun`：封装 `vite-plugin-qiankun` 生命周期，负责创建 Vue 应用、注册 Pinia、注册
  `SvgIcon`、安装公共指令，并挂载子应用。
- `SvgIcon`：基于 SVG symbol 的图标组件，默认使用 `icon` 前缀，支持 `app:xxx` / `solar:xxx` 这类图标名；图标来自构建产物
  `app-icons.svg`（由 `vite/plugins/svgSpritePlugin.ts` 生成，HTML 通过 `<meta name="app-icon-sprite">`
  提供地址），不内联进 JS。
- `SuperTable`：基于 Ant Design Vue
  Table/Form 的配置化表格，内置查询区、工具栏、行操作、分页和导入弹窗，并跟随全局主题 token 变化。
- `DirectivesPlugin`：公共指令插件，目前注册 `v-loading`。
- `EventEmitter`：轻量事件总线，支持 `on`、`off`、`once`、`emit`、`clear`。
- `WorkerPool`：Web Worker 池封装，支持按名称注册 worker 代码并提交任务。
- `store`：公共 Pinia 实例。
- `useAccess`：应用级权限集与权限判断。默认无权限，支持精确权限、`资源:*` 和全局 `*`。

## 子入口能力

### icons

```ts
import { getIconsGrouped } from 'common/icons'
```

图标资源放在 `common/src/icons/<dir>/<name>.svg`；`pnpm gen:icons` 会更新 `icons.json` 与
`sql/icons.postgres.sql`、`sql/icons.mysql.sql`（`sys_icon` 表，业务表存 `code` 即可）。

### components

```ts
import { SuperTable, SvgIcon } from 'common/components'
```

`SuperTable` 通过 `columns`、`searchFields`、`toolbarActions` 等配置组织常见列表页能力。组件会透传 Ant Design Vue
Table 的 attrs、`tableProps` 和常用 slots；如果需要定制单元格，优先使用 `cell-字段名` slot，也可以使用 `bodyCell` slot。

最小使用方式推荐把分页请求交给组件，页面只提供列、查询项和请求函数：

```vue
<template>
  <SuperTable row-key="id" :columns="columns" :search-fields="searchFields" :request="getPage" />
</template>

<script setup lang="ts">
import { SuperTable, useAccess } from 'common'

const { can } = useAccess()
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

### 配置操作列

操作列及其行操作按钮都在 `columns` 中配置。加入固定的 `key: 'action'` 后，可统一声明位置、宽度、固定方式、对齐方式和
`actions`：

```ts
import { SuperTable } from 'common'

const columns = [
  { key: 'name', title: '名称', dataIndex: 'name', width: 200 },
  {
    key: 'action',
    title: '操作',
    width: 300,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline', visible: () => can('shelter:update') },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline' },
      { key: 'delete', label: '删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
      {
        key: 'archive',
        label: '归档',
        icon: 'solar:archive-outline',
        visible: (record) => record.type !== '室外',
      },
    ],
  },
]
```

未声明 `key: 'action'` 时，组件会在最后自动补一个包含编辑、详情、删除按钮的默认操作列。

工具栏通过既有的 `toolbarActions` 配置权限，不需要为组件增加额外 props：

```ts
const toolbarActions = [
  { key: 'create', label: '新建', type: 'primary', visible: () => can('shelter:create') },
  { key: 'import', label: '导入', visible: () => can('shelter:import') },
  { key: 'export', label: '导出', visible: () => can('shelter:export') },
  { key: 'batchDelete', label: '批量删除', danger: true, visible: () => can('shelter:delete') },
]
```

`visible` 可传函数；工具栏与行操作都会实时按其结果隐藏无权限项。

### helper

```ts
import { classNames, EventEmitter, setupStore, WorkerPool } from 'common/helper'
```

`helper` 用于放置纯工具、基础类和跨应用初始化辅助。新增稳定工具时优先从这里导出。

### hooks

```ts
import { useAccess, useWorkerPool } from 'common/hooks'
```

`hooks` 用于放置 Vue 组合式 API。当前 `useWorkerPool` 返回共享的 `WorkerPool` 实例。

`useAccess` 不依赖 SuperTable props。认证完成后写入权限集，随后页面和操作列可直接使用 `can`：

```ts
const { can, canAll, canAny, setPermissions } = useAccess()

setPermissions(identity.permissions)
can('shelter:update')
canAny(['shelter:update', 'shelter:delete'])
canAll(['shelter:read', 'shelter:update'])
```

未写入权限时所有权限判断均为 `false`；`setPermissions(['shelter:*'])` 可匹配 `shelter:` 前缀的权限，`*` 匹配全部权限。

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
