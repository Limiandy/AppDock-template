# 工程约定

本文是 AppDock 仓库的编码与协作约定，也是 Agent 执行任务时的验收标准。命令与机制分别见
`docs/scaffold.md`、`docs/architecture.md`。

## 1. 命名与目录

| 对象        | 约定                                            | 示例                                                     |
| ----------- | ----------------------------------------------- | -------------------------------------------------------- |
| 子应用      | kebab-case，字母开头                            | `demo-app`、`custom-comp-app`                            |
| 路由 `name` | PascalCase，子应用内加父级前缀避免冲突          | `SystemManagement`、`CssApp` + `Home`                    |
| 权限        | `资源:动作`，资源可加子级                       | `shelter:update`、`system:user:delete`                   |
| 组件文件    | PascalCase.vue；组合式函数 `useXxx.ts`          | `SuperTableFormModal.vue`、`useAccess.ts`                |
| 数据域目录  | `main-app/src/data/<domain>/`，域名单数或语义名 | `shelters/`、`base-admin/`                               |
| 脚本        | `scripts/<动词>-<对象>.mjs` / `.js`             | `create-application.mjs`、`sync-tsconfig-references.mjs` |

目录职责：

```text
main-app/src/
├── router/       路由定义（BaseAppRoutes 手写；modules 生成）
├── layout/       布局与面包屑，不放业务逻辑
├── views/        页面组件，一个路由对应一个页面
├── data/         数据访问层（repository 接口 + 适配器）
├── hooks/        组合式函数（event/style/theme）
└── store/        Pinia 模块与全局反馈实例
```

## 2. 路由与菜单

在 `main-app/src/router/BaseAppRoutes.ts` 新增基座路由：

```ts
{
  path: 'users',
  name: 'BaseAdminUsers',
  component: () => import('@/views/BaseAdminUsers.vue'),
  meta: { title: '用户管理', icon: 'solar:users-group-rounded-outline' },
}
```

约定：

- `meta.title` 是菜单与面包屑文案的**唯一来源**，必须提供；`meta.icon` 用 solar 图标名。
- 一级路由 `path` 以 `/` 开头，子路由用相对路径；`component: null` 表示纯分组。
- 仅调试用途的路由放进 `baseAppDevRoutes`（内部已用 `import.meta.env.DEV` 门控）。
- 子应用路由写在 `application/<app>/src/router/index.ts`，不要手写 `main-app/src/router/modules/`。
- 页面懒加载统一 `() => import('@/views/Xxx.vue')`。

## 3. SuperTable 约定

### 3.1 props

| prop                                                                   | 说明                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| `columns`                                                              | 列定义；`key: 'action'` 为操作列，`actions[]` 声明行按钮  |
| `request` / `api` + `requestMethod`                                    | 分页请求函数或接口地址；`autoRequest` 默认 true           |
| `transformParams` / `transformResponse`                                | 请求/响应字段不统一时做适配                               |
| `searchFields`                                                         | 查询项，支持 `fields` + `moreFields` 展开收起             |
| `searchModel`                                                          | 受控查询条件（`v-model:searchModel`）                     |
| `toolbarActions`                                                       | 工具栏按钮，`visible` 控制权限                            |
| `formConfig`                                                           | 新建/编辑/详情弹窗配置（字段、规则、transform、onSubmit） |
| `importConfig`                                                         | 导入弹窗文案、模板下载                                    |
| `showSelection` / `showIndex` / `rowKey` / `pagination` / `tableProps` | 常规表格能力                                              |

### 3.2 事件

`search`、`reset`、`create`、`import`、`export`、`batchDelete`、`toolbarAction`、`rowAction`、
`edit`、`detail`、`delete`、`formSubmit`、`change`、`uploadChange`、`downloadTemplate`、
`requestStart`、`requestSuccess`、`requestError`。

### 3.3 约定

- 行操作按钮只在 `key: 'action'` 列上声明；未声明时组件补默认列。权限用 `actions[].visible: () => can('x:y')`。
- 工具栏行为统一通过事件回传，不在组件内部直接发请求；新建/编辑/删除的持久化由页面调用 repository 完成。
- 单元格自定义用 `#cell-<字段名>`，整行用 `#bodyCell`；表单自定义用 `#form-<字段名>`。
- 请求参数统一 `{ current, pageNum, pageSize, search, sorter, filters }`，响应统一 `{ list, total }`。
- 表单字段的 `readonly`、`hidden` 支持函数形式 `(mode, record) => boolean`，详情模式默认只读。
- 需要重置演示数据时，由页面决定触发方式，不在公共组件内置。

## 4. 表单约定

所有业务表单统一使用 Ant Design Vue 的 `a-form` + `a-form-item` 结构，不要把字段散写成普通 `div` + 控件。

- 表单根节点：`<a-form ref="formRef" :model="formModel" :rules="rules" @finish="onSubmit">`；字段用
  `<a-form-item name="字段名" label="标签" :rules="字段规则">` 包裹，`name` 必须与 `model` 字段一致。
- 校验统一走表单实例：`a-form-item` 的 `rules` 声明规则；提交时由 `a-form` 的
  `@finish`（校验通过后触发）调用接口，或显式 `await formRef.value?.validate()`
  后再提交；校验失败时由表单展示错误，不要自己拼接错误提示。
- 回显与重置：编辑/详情用 `formRef.value?.setFieldsValue(record)`；关闭或取消时用
  `formRef.value?.resetFields()`，不要手动逐字段赋值。
- 提交中状态用 `:confirm-loading` / 按钮 `loading`，避免重复提交。
- 禁止从 DOM 取值、手写 `if (!value) message.error(...)` 之类的字段校验，也不要绕过 `validate` 直接调用接口。
- 配置化表格里的表单（SuperTable 的 `formConfig`）同样遵循本约定：字段规则走 `rules`，提交走 `onSubmit` + `formSubmit`
  事件，不要在页面里重复校验。

```vue
<template>
  <a-form ref="formRef" :model="formModel" :rules="rules" layout="vertical" @finish="onSubmit">
    <a-form-item label="公司名称" name="name" :rules="[{ required: true, message: '请输入公司名称' }]">
      <a-input v-model:value="formModel.name" />
    </a-form-item>
    <a-button type="primary" html-type="submit" :loading="submitting">保存</a-button>
  </a-form>
</template>
```

## 5. 数据层约定

新增数据域必须包含：

```text
main-app/src/data/<domain>/
├── types.ts     # 记录类型、输入类型、repository 接口
├── index.ts     # 依据 VITE_DATA_SOURCE 选择适配器并导出单例
├── mock.ts      # IndexedDB（或内存）实现
└── supabase.ts  # PostgREST 实现（若支持）
```

接口形状参考 `shelters`：

```ts
export interface XxxRepository {
  list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<XxxRecord>>
  create(input: XxxInput): Promise<XxxRecord>
  update(id: string, input: XxxInput): Promise<XxxRecord>
  remove(ids: string[]): Promise<void>
  resetDemoData?: () => Promise<void>
}
```

- 页面只依赖 `types.ts` 的接口，不 import 具体适配器。
- 环境开关集中在 `index.ts`，不要在页面里判断 `import.meta.env`。
- 字段命名：前端 camelCase，Supabase 表 snake_case，映射放在 supabase 适配器内。

## 6. 权限约定

```ts
import { useAccess } from 'common'

const { can, canAny, canAll, setPermissions } = useAccess()
can('shelter:update') // 精确
canAny(['shelter:update', 'shelter:delete'])
setPermissions(identity.permissions) // 登录完成后覆盖
```

- 匹配规则：`*` 全量、`资源:*` 前缀、精确匹配；空白权限默认全部 `false`。
- 页面与操作入口默认隐藏（`visible: () => can(...)`），不要用禁用态代替隐藏，除非产品明确要求。
- mock 身份在 `main-app/src/access.ts` 维护；新增权限时同步三个 profile 的语义（管理员 `*`、录入员可写、审计员只读）。
- 真实登录接入后必须调用 `setPermissions`，不要依赖 mock 默认值。

## 7. 样式与主题约定

- 主题相关样式通过 `useStyle` 注入，选择器挂到布局/组件根类上：

```ts
const [className, scopeClass] = useStyle('basic-layout', (token) => ({
  'color': token.colorText,
  '.basic-layout-breadcrumb__link': {
    '&:hover': { color: token.colorPrimary },
  },
}))
```

- 静态 `scoped less` 只写结构与布局；颜色、间距、圆角、动效必须来自 token。
- 需要跨组件 CSS 变量时使用 `InjectApply` 写入的根变量或组件自身的 token 样式，不新增自定义全局色值。
- 禁止使用 `:deep()` 大面积覆盖 `ant-*` 组件内部样式；优先使用组件 props、slots 与 token。
- 主题模式：`light` / `dark` / `light,compact` / `dark,compact`；切换通过
  `eventBus.emit('themeChange')`，不要直接改 Antd 配置。
- 图标统一 `<SvgIcon name="solar:xxx" />`；新增图标后执行 `node common/scripts/gen-icons.mjs` 并提交 `icons.json`。
- 主题预设放在 `main-app/src/hooks/theme/presets/`，导出 `ThemeConfig`；新增预设同步 `docs/design-tokens.md`。
- 全局默认视觉以 `presets/managementSystem.ts` 为准；不要另起一套色板，确需扩展时在预设中补层并同步 token 文档。

## 8. common 公共库约定

- 公开入口固定为：`common`、`common/components`、`common/helper`、`common/hooks`、`common/icons`。
- 新公共能力先判断归属：组件 → `components/`，纯函数/类 → `helper/`，组合式 → `hooks/`，图标 → `icons/`。
- 必须从对应 `index.ts` 统一导出，禁止应用侧 import 内部文件路径。
- 新增/修改公共 API 时同步更新 `common/README.md`（入口、用途、最小示例）。
- 改动后至少执行 `pnpm build:common`；涉及类型变化时执行 `pnpm typecheck`。
- 依赖保持精简：能复用现有依赖就不新增；`vue` 与 `ant-design-vue` 为 external。

## 9. 生成物与脚本约定

| 文件                                                   | 生成方式                                | 是否入库       |
| ------------------------------------------------------ | --------------------------------------- | -------------- |
| `main-app/src/micro-apps.json`                         | `pnpm gen-micro-apps` / dev、build 脚本 | 入库，禁止手改 |
| `main-app/src/router/modules/*.ts`                     | 子应用 dev server 的路由同步插件        | 入库           |
| `common/src/icons/icons.json`                          | `node common/scripts/gen-icons.mjs`     | 入库           |
| `packages/create-app-dock/template/`                   | `scripts/sync-cli-template.mjs`         | 不入库         |
| `common/dist/`、`dist/`、`application/*/dist/`         | Vite 构建                               | 不入库         |
| `docker/supabase/.env.local`、`.generated/`、`.build/` | 本地工具                                | 不入库         |

约定：

- 生成脚本必须保持**幂等**：重复执行不产生多余 diff。
- 新增脚本逻辑要配套 `scripts/*.test.mjs` 测试；影响 CLI 模板的要更新 `templateEntries` 与 CLI 测试断言。
- 生成物发生变化时，和对应的源码/脚本改动放在同一个提交里。

## 10. 质量与提交约定

- 提交前先运行一次 `pnpm run lint:fix`（ESLint 自动修复；需要同时格式化用 `pnpm run fix`），再执行
  `pnpm run check`；只跑了部分检查时要在说明里写清楚。
- 提交信息：Conventional Commits，subject 英文，正文可中文列要点；一个提交一个主题。
- 禁止提交密钥、本地环境文件（`*.local`）、构建产物。
- 修复缺陷时优先补测试（脚本逻辑）或说明人工验证路径（UI 逻辑）。
- 不擅自升级/降级依赖；确需变更时单独提交并在 `PLANS.md` 记录原因。

## 11. 文档约定

- 面向 Agent 的入口是 `AGENTS.md`；行为或约定变化必须同步更新它。
- 机制变化 → `docs/architecture.md`；用法/命令变化 → `docs/scaffold.md`；约定变化 → 本文档。
- 公共库 API → `common/README.md`；CLI → `packages/create-app-dock/README.md`；计划与决策 → `PLANS.md`。
- 文档中的命令、路径、文件清单必须与仓库实际一致；无法确认的内容不要写。
