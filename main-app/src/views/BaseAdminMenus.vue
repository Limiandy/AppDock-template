<template>
  <SuperTable
    ref="superTableRef"
    :columns="columns"
    :toolbar-actions="toolbarActions"
    :show-index="false"
    :show-selection="false"
    :search-fields="searchFields"
    :form-config="formConfig"
    :pagination="false"
    :request="getMenuPage"
    :table-props="treeTableProps"
    @export="onExport"
    @delete="onDelete"
  >
    <template #toolbar>
      <div class="menu-tree-heading">
        <span class="menu-tree-heading__icon">
          <SvgIcon name="solar:folder-with-files-outline" />
        </span>
        <div>
          <div class="menu-tree-heading__title">菜单结构</div>
          <div class="menu-tree-heading__meta">共 {{ treeTotal }} 个节点，可展开查看层级</div>
        </div>
      </div>
    </template>
    <template #cell-name="{ record }">
      <div class="menu-tree-node" :class="`menu-tree-node--level-${record.depth || 0}`">
        <span class="menu-tree-node__accent" />
        <span>{{ record.name }}</span>
      </div>
    </template>
    <template #cell-type="{ record }">
      <a-tag :color="getMenuTypeColor(record.type)">{{ record.type }}</a-tag>
    </template>
    <template #cell-status="{ record }">
      <a-tag :color="record.status ? 'cyan' : 'default'">{{ record.status ? '启用' : '停用' }}</a-tag>
    </template>
  </SuperTable>
</template>

<script setup lang="ts">
import { SuperTable, SvgIcon, useAccess } from 'common'
import type {
  SuperTableAction,
  SuperTableColumn,
  SuperTableFormConfig,
  SuperTableRecord,
  SuperTableRequestParams,
  SuperTableRequestResult,
  SuperTableSearchFields,
} from 'common'
import { ref, watch } from 'vue'
import { menuRepository, toMenuInput, type MenuRecord } from '@/data/base-admin'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()
const superTableRef = ref<InstanceType<typeof SuperTable>>()
const treeTotal = ref(0)
const { can, permissions } = useAccess()

type MenuTreeRecord = MenuRecord & {
  children?: MenuTreeRecord[]
  depth: number
}

const treeTableProps = {
  childrenColumnName: 'children',
  defaultExpandAllRows: true,
  indentSize: 20,
}
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]
const typeOptions = [
  { label: '目录', value: '目录' },
  { label: '菜单', value: '菜单' },
  { label: '按钮', value: '按钮' },
]
const parentOptions = [
  { label: '根目录', value: '根目录' },
  { label: '系统管理', value: '系统管理' },
  { label: '用户管理', value: '用户管理' },
]
const typeColors: Record<MenuRecord['type'], string> = {
  目录: 'geekblue',
  菜单: 'purple',
  按钮: 'volcano',
}

function getMenuTypeColor(type: MenuRecord['type']) {
  return typeColors[type]
}

const searchFields: SuperTableSearchFields = [
  { field: 'name', label: '菜单名称', placeholder: '请输入菜单名称' },
  { field: 'code', label: '权限标识', placeholder: '请输入权限标识' },
  { field: 'type', label: '类型', component: 'select', placeholder: '请选择类型', options: typeOptions },
  { field: 'status', label: '状态', component: 'select', placeholder: '请选择状态', options: statusOptions },
]

const columns: SuperTableColumn[] = [
  { key: 'name', title: '菜单名称', dataIndex: 'name', width: 220 },
  { key: 'code', title: '权限标识', dataIndex: 'code', width: 220 },
  { key: 'path', title: '路由地址', dataIndex: 'path', width: 220 },
  { key: 'type', title: '类型', dataIndex: 'type', width: 90, align: 'center' },
  { key: 'sort', title: '排序', dataIndex: 'sort', width: 80, align: 'center' },
  { key: 'status', title: '状态', dataIndex: 'status', width: 90, align: 'center' },
  {
    key: 'action',
    title: '操作',
    width: 160,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline', visible: () => can('system:menu:update') },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline', visible: () => can('system:menu:read') },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        icon: 'solar:trash-bin-trash-outline',
        visible: () => can('system:menu:delete'),
      },
    ],
  },
]

const toolbarActions: SuperTableAction[] = [
  {
    key: 'create',
    label: '新建菜单',
    type: 'primary',
    icon: 'solar:add-circle-outline',
    visible: () => can('system:menu:create'),
  },
  { key: 'export', label: '导出', icon: 'solar:download-outline', visible: () => can('system:menu:export') },
]

const formConfig: SuperTableFormConfig<MenuRecord> = {
  fields: [
    {
      field: 'parentName',
      label: '上级菜单',
      component: 'select',
      options: parentOptions,
      rules: [{ required: true, message: '请选择上级菜单' }],
    },
    { field: 'name', label: '菜单名称', rules: [{ required: true, message: '请输入菜单名称' }] },
    {
      field: 'code',
      label: '权限标识',
      readonly: (mode) => mode === 'edit',
      rules: [{ required: true, message: '请输入权限标识' }],
    },
    { field: 'path', label: '路由地址', rules: [{ required: true, message: '请输入路由地址' }] },
    {
      field: 'type',
      label: '类型',
      component: 'select',
      options: typeOptions,
      rules: [{ required: true, message: '请选择类型' }],
    },
    { field: 'sort', label: '排序', component: 'inputNumber', props: { min: 0, precision: 0 } },
    { field: 'status', label: '启用状态', component: 'switch' },
  ],
  create: {
    title: '新建菜单',
    submitText: '新建',
    initialValues: { parentName: '根目录', type: '菜单', sort: 0, status: true },
  },
  edit: { title: (record) => `编辑菜单：${record?.name || ''}`, submitText: '保存' },
  detail: { title: (record) => `菜单详情：${record?.name || ''}` },
  onSubmit: submitMenuForm,
}

watch(permissions, () => {
  void superTableRef.value?.reload({ current: 1 })
})

async function getMenuPage(params: SuperTableRequestParams): Promise<SuperTableRequestResult<MenuTreeRecord>> {
  if (!can('system:menu:read')) {
    treeTotal.value = 0
    return { list: [], total: 0 }
  }
  const result = await menuRepository.list({ ...params, current: 1, pageNum: 1, pageSize: Number.MAX_SAFE_INTEGER })
  treeTotal.value = result.total

  return {
    list: toMenuTree(result.list),
    total: result.total,
  }
}

function toMenuTree(records: MenuRecord[]): MenuTreeRecord[] {
  const nodes = new Map<string, MenuTreeRecord>()
  const roots: MenuTreeRecord[] = []

  records
    .slice()
    .sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name))
    .forEach((record) => {
      nodes.set(record.name, { ...record, depth: 0 })
    })

  nodes.forEach((node) => {
    const parent = nodes.get(node.parentName)
    if (!parent || parent.id === node.id) {
      roots.push(node)
      return
    }

    parent.children ||= []
    parent.children.push(node)
  })

  function applyDepth(node: MenuTreeRecord, depth: number) {
    node.depth = depth
    node.children?.forEach((child) => applyDepth(child, depth + 1))
  }

  roots.forEach((node) => applyDepth(node, 0))

  return roots
}

async function submitMenuForm(values: SuperTableRecord, context: { mode: 'create' | 'edit'; record?: MenuRecord }) {
  const input = toMenuInput(values)
  if (context.mode === 'create') {
    await menuRepository.create(input)
    global.message.success('新建菜单成功')
    return
  }
  if (!context.record) return
  await menuRepository.update(context.record.id, input)
  global.message.success('保存菜单成功')
}

function onExport() {
  global.message.info('菜单数据已导出')
}

async function deleteMenus(ids: (string | number)[]) {
  if (!ids.length) return
  await menuRepository.remove(ids.map(String))
  global.message.success(`已删除 ${ids.length} 个菜单`)
  await superTableRef.value?.reload()
}

function onDelete(record: SuperTableRecord) {
  global.modal.confirm({
    title: '确认删除菜单？',
    content: `将删除「${String(record.name || '')}」。`,
    async onOk() {
      await deleteMenus([record.id])
    },
  })
}
</script>

<style lang="less" scoped>
.menu-tree-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: auto;
}

.menu-tree-heading__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 8px;
}

.menu-tree-heading__title {
  color: #1f1f1f;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.menu-tree-heading__meta {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 16px;
}

.menu-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #434343;
  font-weight: 500;
}

.menu-tree-node__accent {
  width: 6px;
  height: 6px;
  background: #91caff;
  border-radius: 50%;
}

.menu-tree-node--level-0 {
  color: #1f1f1f;
  font-weight: 600;

  .menu-tree-node__accent {
    width: 8px;
    height: 8px;
    background: #1677ff;
  }
}

:deep(.ant-table-thead > tr > th) {
  color: #595959;
  font-size: 12px;
  font-weight: 600;
  background: #fafcff;
}

:deep(.ant-table-tbody > tr > td) {
  padding-top: 14px;
  padding-bottom: 14px;
}

:deep(.ant-table-tbody > tr.ant-table-row-level-0 > td) {
  background: #fcfdff;
}

:deep(.ant-table-tbody > tr.ant-table-row-level-0:hover > td) {
  background: #f0f7ff !important;
}

:deep(.ant-table-row-expand-icon) {
  border-color: #91caff;
  border-radius: 5px;
}
</style>
