<template>
  <SuperTable
    ref="superTableRef"
    :columns="columns"
    :toolbar-actions="toolbarActions"
    :show-selection="can('system:role:delete')"
    :search-fields="searchFields"
    :form-config="formConfig"
    :request="getRolePage"
    @export="onExport"
    @batch-delete="onBatchDelete"
    @delete="onDelete"
    @row-action="onRowAction"
  >
    <template #cell-permissions="{ record }">
      <a-tag color="blue">{{ record.permissions?.length || 0 }} 项</a-tag>
    </template>
    <template #cell-status="{ record }">
      <a-tag :color="record.status ? 'success' : 'default'">{{ record.status ? '启用' : '停用' }}</a-tag>
    </template>
  </SuperTable>

  <a-drawer
    v-model:open="permissionDrawerOpen"
    :title="`配置权限：${configuredRole?.name || ''}`"
    placement="right"
    width="480px"
    destroy-on-close
  >
    <a-tree
      v-model:checked-keys="checkedPermissionKeys"
      class="permission-drawer__tree"
      checkable
      default-expand-all
      :tree-data="permissionTreeData"
    />
    <template #footer>
      <div class="permission-drawer__footer">
        <a-button @click="permissionDrawerOpen = false">取消</a-button>
        <a-button type="primary" :loading="savingPermissions" @click="saveRolePermissions">保存</a-button>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { SuperTable, useAccess } from 'common'
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
import { menuRepository, roleRepository, toRoleInput, type MenuRecord, type RoleRecord } from '@/data/base-admin'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()
const superTableRef = ref<InstanceType<typeof SuperTable>>()
const { can, permissions } = useAccess()
const permissionDrawerOpen = ref(false)
const savingPermissions = ref(false)
const configuredRole = ref<RoleRecord>()
const checkedPermissionKeys = ref<string[]>([])
const permissionTreeData = ref<PermissionTreeNode[]>([])

interface PermissionTreeNode {
  key: string
  title: string
  children?: PermissionTreeNode[]
}
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const searchFields: SuperTableSearchFields = [
  { field: 'code', label: '角色编码', placeholder: '请输入角色编码' },
  { field: 'name', label: '角色名称', placeholder: '请输入角色名称' },
  { field: 'status', label: '状态', component: 'select', placeholder: '请选择状态', options: statusOptions },
]

const columns: SuperTableColumn[] = [
  { key: 'code', title: '角色编码', dataIndex: 'code', width: 160 },
  { key: 'name', title: '角色名称', dataIndex: 'name', width: 160 },
  { key: 'description', title: '角色说明', dataIndex: 'description', width: 280 },
  { key: 'userCount', title: '关联用户数', dataIndex: 'userCount', width: 120, align: 'center' },
  { key: 'permissions', title: '权限数', dataIndex: 'permissions', width: 100, align: 'center' },
  { key: 'status', title: '状态', dataIndex: 'status', width: 90, align: 'center' },
  {
    key: 'action',
    title: '操作',
    width: 180,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline', visible: () => can('system:role:update') },
      {
        key: 'permissions',
        label: '权限',
        icon: 'solar:shield-check-outline',
        visible: () => can('system:role:update'),
      },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline', visible: () => can('system:role:read') },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        icon: 'solar:trash-bin-trash-outline',
        visible: () => can('system:role:delete'),
      },
    ],
  },
]

const toolbarActions: SuperTableAction[] = [
  {
    key: 'create',
    label: '新建角色',
    type: 'primary',
    icon: 'solar:add-circle-outline',
    visible: () => can('system:role:create'),
  },
  { key: 'export', label: '导出', icon: 'solar:download-outline', visible: () => can('system:role:export') },
  {
    key: 'batchDelete',
    label: '批量删除',
    danger: true,
    icon: 'solar:trash-bin-trash-outline',
    visible: () => can('system:role:delete'),
  },
]

const formConfig: SuperTableFormConfig<RoleRecord> = {
  fields: [
    {
      field: 'code',
      label: '角色编码',
      readonly: (mode) => mode === 'edit',
      rules: [{ required: true, message: '请输入角色编码' }],
    },
    { field: 'name', label: '角色名称', rules: [{ required: true, message: '请输入角色名称' }] },
    {
      field: 'description',
      label: '角色说明',
      component: 'textarea',
      span: 24,
      rules: [{ required: true, message: '请输入角色说明' }],
    },
    { field: 'status', label: '启用状态', component: 'switch' },
  ],
  create: { title: '新建角色', submitText: '新建', initialValues: { status: true } },
  edit: { title: (record) => `编辑角色：${record?.name || ''}`, submitText: '保存' },
  detail: { title: (record) => `角色详情：${record?.name || ''}` },
  onSubmit: submitRoleForm,
}

watch(permissions, () => {
  void superTableRef.value?.reload({ current: 1 })
})

function getRolePage(params: SuperTableRequestParams): Promise<SuperTableRequestResult<RoleRecord>> {
  if (!can('system:role:read')) return Promise.resolve({ list: [], total: 0 })
  return roleRepository.list(params)
}

async function submitRoleForm(values: SuperTableRecord, context: { mode: 'create' | 'edit'; record?: RoleRecord }) {
  const input = {
    ...toRoleInput(values),
    permissions: context.record?.permissions ?? [],
  }
  if (context.mode === 'create') {
    await roleRepository.create(input)
    global.message.success('新建角色成功')
    return
  }
  if (!context.record) return
  await roleRepository.update(context.record.id, input)
  global.message.success('保存角色成功')
}

function onExport() {
  global.message.info('角色数据已导出')
}

function onRowAction(key: string, record: SuperTableRecord) {
  if (key !== 'permissions') return
  void openPermissionConfig(record as RoleRecord)
}

async function openPermissionConfig(role: RoleRecord) {
  const result = await menuRepository.list({
    current: 1,
    pageNum: 1,
    pageSize: Number.MAX_SAFE_INTEGER,
    search: {},
  })

  configuredRole.value = role
  checkedPermissionKeys.value = [...(role.permissions ?? [])]
  permissionTreeData.value = toPermissionTree(result.list)
  permissionDrawerOpen.value = true
}

function toPermissionTree(records: MenuRecord[]): PermissionTreeNode[] {
  const nodesByName = new Map<string, PermissionTreeNode>()
  const roots: PermissionTreeNode[] = []

  records
    .slice()
    .sort((left, right) => left.sort - right.sort || left.name.localeCompare(right.name))
    .forEach((record) => {
      nodesByName.set(record.name, {
        key: record.code,
        title: `${record.name} · ${record.code}`,
      })
    })

  records.forEach((record) => {
    const node = nodesByName.get(record.name)
    if (!node) return

    const parent = nodesByName.get(record.parentName)
    if (!parent) {
      roots.push(node)
      return
    }

    parent.children ||= []
    parent.children.push(node)
  })

  return roots
}

async function saveRolePermissions() {
  if (!configuredRole.value) return

  savingPermissions.value = true
  try {
    const role = configuredRole.value
    await roleRepository.update(role.id, {
      code: role.code,
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: [...checkedPermissionKeys.value],
    })
    global.message.success('角色权限已保存')
    permissionDrawerOpen.value = false
    await superTableRef.value?.reload()
  } finally {
    savingPermissions.value = false
  }
}

async function deleteRoles(ids: (string | number)[]) {
  if (!ids.length) return
  await roleRepository.remove(ids.map(String))
  global.message.success(`已删除 ${ids.length} 个角色`)
  await superTableRef.value?.reload()
}

function onBatchDelete(keys: (string | number)[]) {
  if (!keys.length) {
    global.message.warning('请选择要删除的角色')
    return
  }
  global.modal.confirm({
    title: '确认批量删除角色？',
    content: `将删除已选中的 ${keys.length} 个角色。`,
    async onOk() {
      await deleteRoles(keys)
    },
  })
}

function onDelete(record: SuperTableRecord) {
  global.modal.confirm({
    title: '确认删除角色？',
    content: `将删除「${String(record.name || '')}」。`,
    async onOk() {
      await deleteRoles([record.id])
    },
  })
}
</script>

<style lang="less" scoped>
.permission-drawer__tree {
  padding: 8px 0;
}

.permission-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
