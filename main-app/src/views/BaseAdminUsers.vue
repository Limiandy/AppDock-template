<template>
  <SuperTable
    ref="superTableRef"
    :columns="columns"
    :toolbar-actions="toolbarActions"
    :show-selection="can('system:user:delete')"
    :search-fields="searchFields"
    :form-config="formConfig"
    :request="getUserPage"
    @export="onExport"
    @batch-delete="onBatchDelete"
    @delete="onDelete"
  >
    <template #cell-status="{ record }">
      <a-tag :color="record.status ? 'success' : 'default'">{{ record.status ? '启用' : '停用' }}</a-tag>
    </template>
  </SuperTable>
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
import { toUserInput, type UserRecord, userRepository } from '@/data/base-admin'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()
const superTableRef = ref<InstanceType<typeof SuperTable>>()
const { can, permissions } = useAccess()

const roleOptions = [
  { label: '系统管理员', value: '系统管理员' },
  { label: '业务录入员', value: '业务录入员' },
  { label: '只读审计员', value: '只读审计员' },
]
const statusOptions = [
  { label: '启用', value: true },
  { label: '停用', value: false },
]

const searchFields: SuperTableSearchFields = [
  { field: 'account', label: '账号', placeholder: '请输入账号' },
  { field: 'name', label: '姓名', placeholder: '请输入姓名' },
  { field: 'role', label: '角色', component: 'select', placeholder: '请选择角色', options: roleOptions },
  { field: 'status', label: '状态', component: 'select', placeholder: '请选择状态', options: statusOptions },
]

const columns: SuperTableColumn[] = [
  { key: 'account', title: '账号', dataIndex: 'account', width: 140 },
  { key: 'name', title: '姓名', dataIndex: 'name', width: 120 },
  { key: 'mobile', title: '联系电话', dataIndex: 'mobile', width: 150 },
  { key: 'department', title: '所属部门', dataIndex: 'department', width: 160 },
  { key: 'role', title: '角色', dataIndex: 'role', width: 140 },
  { key: 'status', title: '状态', dataIndex: 'status', width: 90, align: 'center' },
  {
    key: 'action',
    title: '操作',
    width: 180,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline', visible: () => can('system:user:update') },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline', visible: () => can('system:user:read') },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        icon: 'solar:trash-bin-trash-outline',
        visible: () => can('system:user:delete'),
      },
    ],
  },
]

const toolbarActions: SuperTableAction[] = [
  {
    key: 'create',
    label: '新建用户',
    type: 'primary',
    icon: 'solar:add-circle-outline',
    visible: () => can('system:user:create'),
  },
  { key: 'export', label: '导出', icon: 'solar:download-outline', visible: () => can('system:user:export') },
  {
    key: 'batchDelete',
    label: '批量删除',
    danger: true,
    icon: 'solar:trash-bin-trash-outline',
    visible: () => can('system:user:delete'),
  },
]

const formConfig: SuperTableFormConfig<UserRecord> = {
  fields: [
    {
      field: 'account',
      label: '账号',
      readonly: (mode) => mode === 'edit',
      rules: [{ required: true, message: '请输入账号' }],
    },
    { field: 'name', label: '姓名', rules: [{ required: true, message: '请输入姓名' }] },
    { field: 'mobile', label: '联系电话', rules: [{ required: true, message: '请输入联系电话' }] },
    { field: 'department', label: '所属部门', rules: [{ required: true, message: '请输入所属部门' }] },
    {
      field: 'role',
      label: '角色',
      component: 'select',
      options: roleOptions,
      rules: [{ required: true, message: '请选择角色' }],
    },
    { field: 'status', label: '启用状态', component: 'switch' },
  ],
  create: { title: '新建用户', submitText: '新建', initialValues: { status: true } },
  edit: { title: (record) => `编辑用户：${record?.name || ''}`, submitText: '保存' },
  detail: { title: (record) => `用户详情：${record?.name || ''}` },
  onSubmit: submitUserForm,
}

watch(permissions, () => {
  void superTableRef.value?.reload({ current: 1 })
})

function getUserPage(params: SuperTableRequestParams): Promise<SuperTableRequestResult<UserRecord>> {
  if (!can('system:user:read')) return Promise.resolve({ list: [], total: 0 })
  return userRepository.list(params)
}

async function submitUserForm(values: SuperTableRecord, context: { mode: 'create' | 'edit'; record?: UserRecord }) {
  const input = toUserInput(values)
  if (context.mode === 'create') {
    await userRepository.create(input)
    global.message.success('新建用户成功')
    return
  }
  if (!context.record) return
  await userRepository.update(context.record.id, input)
  global.message.success('保存用户成功')
}

function onExport() {
  global.message.info('用户数据已导出')
}

async function deleteUsers(ids: (string | number)[]) {
  if (!ids.length) return
  await userRepository.remove(ids.map(String))
  global.message.success(`已删除 ${ids.length} 名用户`)
  await superTableRef.value?.reload()
}

function onBatchDelete(keys: (string | number)[]) {
  if (!keys.length) {
    global.message.warning('请选择要删除的用户')
    return
  }
  global.modal.confirm({
    title: '确认批量删除用户？',
    content: `将删除已选中的 ${keys.length} 名用户。`,
    async onOk() {
      await deleteUsers(keys)
    },
  })
}

function onDelete(record: SuperTableRecord) {
  global.modal.confirm({
    title: '确认删除用户？',
    content: `将删除「${String(record.name || '')}」。`,
    async onOk() {
      await deleteUsers([record.id])
    },
  })
}
</script>
