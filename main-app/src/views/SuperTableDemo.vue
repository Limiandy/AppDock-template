<template>
  <div class="super-table-demo">
    <SuperTable
      ref="superTableRef"
      :columns="columns"
      :toolbar-actions="toolbarActions"
      :show-selection="can('shelter:delete')"
      :search-fields="searchFields"
      :form-config="formConfig"
      :request="getShelterPage"
      @reset="onReset"
      @export="onExport"
      @batch-delete="onBatchDelete"
      @delete="onDelete"
      @download-template="onDownloadTemplate"
      @upload-change="onUploadChange"
    />
  </div>
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
import { ref } from 'vue'
import { shelterRepository, toShelterInput, type ShelterRecord } from '@/data/shelters'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()
const superTableRef = ref<InstanceType<typeof SuperTable>>()
const { can } = useAccess()

const searchFields: SuperTableSearchFields = {
  fields: [
    { field: 'shelterName', label: '应急避难所名称', placeholder: '请输入应急避难所名称' },
    { field: 'shelterCode', label: '应急避难所编号', placeholder: '请输入应急避难所编号' },
    { field: 'type', label: '类型', placeholder: '请输入类型' },
    { field: 'totalArea', label: '总面积', placeholder: '请输入总面积' },
  ],
  moreFields: [
    { field: 'contact', label: '人防工作联系人', placeholder: '请输入人防工作联系人' },
    { field: 'phone', label: '人防工作联系电话', placeholder: '请输入人防工作联系电话' },
    {
      field: 'createdAt',
      label: '创建时间',
      component: 'rangePicker',
      placeholder: ['起始创建时间', '结束创建时间'],
    },
  ],
}

const columns: SuperTableColumn[] = [
  { key: 'shelterName', title: '应急避难所名称', dataIndex: 'shelterName', width: 200, align: 'center' },
  { key: 'shelterCode', title: '应急避难所编号', dataIndex: 'shelterCode', width: 140, align: 'center' },
  { key: 'type', title: '类型', dataIndex: 'type', width: 80, align: 'center' },
  { key: 'totalArea', title: '总面积', dataIndex: 'totalArea', width: 120, align: 'center' },
  { key: 'contact', title: '人防工作联系人', dataIndex: 'contact', width: 120, align: 'center' },
  { key: 'phone', title: '人防工作联系电话', dataIndex: 'phone', width: 180, align: 'center' },
  {
    key: 'action',
    title: '操作',
    width: 180,
    fixed: 'right',
    align: 'center',
    actions: [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline', visible: () => can('shelter:update') },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline', visible: () => can('shelter:read') },
      {
        key: 'delete',
        label: '删除',
        danger: true,
        icon: 'solar:trash-bin-trash-outline',
        visible: () => can('shelter:delete'),
      },
    ],
  },
]

const toolbarActions: SuperTableAction[] = [
  {
    key: 'create',
    label: '新建',
    type: 'primary',
    icon: 'solar:add-circle-outline',
    visible: () => can('shelter:create'),
  },
  { key: 'import', label: '导入', icon: 'solar:upload-outline', visible: () => can('shelter:import') },
  { key: 'export', label: '导出', icon: 'solar:download-outline', visible: () => can('shelter:export') },
  {
    key: 'batchDelete',
    label: '批量删除',
    danger: true,
    icon: 'solar:trash-bin-trash-outline',
    visible: () => can('shelter:delete'),
  },
]

const formConfig: SuperTableFormConfig = {
  fields: [
    {
      field: 'shelterName',
      label: '应急避难所名称',
      rules: [{ required: true, message: '请输入应急避难所名称' }],
    },
    {
      field: 'shelterCode',
      label: '应急避难所编号',
      readonly: (mode) => mode === 'edit',
      rules: [{ required: true, message: '请输入应急避难所编号' }],
    },
    {
      field: 'type',
      label: '类型',
      component: 'select',
      options: [
        { label: '室内', value: '室内' },
        { label: '室外', value: '室外' },
        { label: '地下空间', value: '地下空间' },
        { label: '综合', value: '综合' },
      ],
      rules: [{ required: true, message: '请选择类型' }],
    },
    {
      field: 'totalArea',
      label: '总面积',
      component: 'inputNumber',
      props: {
        min: 0,
        precision: 2,
      },
      rules: [{ required: true, message: '请输入总面积' }],
    },
    {
      field: 'contact',
      label: '人防工作联系人',
      rules: [{ required: true, message: '请输入人防工作联系人' }],
    },
    {
      field: 'phone',
      label: '人防工作联系电话',
      rules: [{ required: true, message: '请输入人防工作联系电话' }],
    },
  ],
  create: {
    title: '新建应急避难所',
    submitText: '新建',
  },
  edit: {
    title: (record) => `编辑：${String(record?.shelterName || '')}`,
    submitText: '保存',
  },
  detail: {
    title: (record) => `详情：${String(record?.shelterName || '')}`,
  },
  onSubmit: submitShelterForm,
}

function notice(content: string) {
  global.message.info(content)
}

function getShelterPage(params: SuperTableRequestParams): Promise<SuperTableRequestResult<ShelterRecord>> {
  return shelterRepository.list(params)
}

async function submitShelterForm(
  values: SuperTableRecord,
  context: { mode: 'create' | 'edit'; record?: SuperTableRecord },
) {
  const input = toShelterInput(values)

  if (context.mode === 'create') {
    await shelterRepository.create(input)
    global.message.success('新建成功')
    return
  }

  if (!context.record?.id) return
  await shelterRepository.update(String(context.record.id), input)
  global.message.success('保存成功')
}

function onReset() {
  notice('已重置查询条件')
}

function onExport() {
  notice('导出')
}

function getShelterName(record: SuperTableRecord) {
  return String(record.shelterName || '')
}

async function deleteShelters(ids: (string | number)[]) {
  if (!ids.length) return
  await shelterRepository.remove(ids.map(String))
  global.message.success(`已删除 ${ids.length} 条`)
  await superTableRef.value?.reload()
}

function onBatchDelete(keys: (string | number)[]) {
  if (!keys.length) {
    global.message.warning('请选择要删除的数据')
    return
  }

  global.modal.confirm({
    title: '确认批量删除？',
    content: `将删除已选中的 ${keys.length} 条数据。`,
    async onOk() {
      await deleteShelters(keys)
    },
  })
}

function onDelete(record: SuperTableRecord) {
  global.modal.confirm({
    title: '确认删除？',
    content: `将删除「${getShelterName(record)}」。`,
    async onOk() {
      await deleteShelters([record.id])
    },
  })
}

function onDownloadTemplate() {
  notice('下载模板')
}

function onUploadChange(info: unknown) {
  console.log('upload', info)
}
</script>

<style lang="less" scoped>
.super-table-demo {
  min-height: 100%;
}
</style>
