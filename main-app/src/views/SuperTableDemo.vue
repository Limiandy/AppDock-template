<template>
  <div class="super-table-demo">
    <SuperTable
      ref="superTableRef"
      :columns="columns"
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
import { SuperTable } from 'common'
import type {
  SuperTableColumn,
  SuperTableFormConfig,
  SuperTableRecord,
  SuperTableRequestParams,
  SuperTableRequestResult,
  SuperTableSearchFields,
} from 'common'
import { ref } from 'vue'
import { useGlobalStore } from '@/store/modules/global.ts'

interface ShelterRecord {
  id: string
  shelterName: string
  shelterCode: string
  type: string
  totalArea: number
  contact: string
  phone: string
}

const global = useGlobalStore()
const superTableRef = ref<InstanceType<typeof SuperTable>>()

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
  { key: 'shelterName', title: '应急避难所名称', dataIndex: 'shelterName', width: 200 },
  { key: 'shelterCode', title: '应急避难所编号', dataIndex: 'shelterCode', width: 200 },
  { key: 'type', title: '类型', dataIndex: 'type', width: 140 },
  { key: 'totalArea', title: '总面积', dataIndex: 'totalArea', width: 140 },
  { key: 'contact', title: '人防工作联系人', dataIndex: 'contact', width: 190 },
  { key: 'phone', title: '人防工作联系电话', dataIndex: 'phone', width: 190 },
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

function appendLikeFilter(searchParams: URLSearchParams, field: string, value: unknown) {
  if (!value) return
  searchParams.set(field, `ilike.*${String(value)}*`)
}

function getDateValue(value: unknown) {
  if (!value) return ''
  if (typeof value === 'object' && 'toISOString' in value && typeof value.toISOString === 'function') {
    return value.toISOString()
  }
  return String(value)
}

function appendDateRangeFilter(searchParams: URLSearchParams, field: string, value: unknown) {
  if (!Array.isArray(value)) return
  const [start, end] = value
  if (start) searchParams.append(field, `gte.${getDateValue(start)}`)
  if (end) searchParams.append(field, `lte.${getDateValue(end)}`)
}

async function getShelterPage(params: SuperTableRequestParams): Promise<SuperTableRequestResult<ShelterRecord>> {
  const { current, pageSize, search } = params
  const from = (current - 1) * pageSize
  const to = from + pageSize - 1
  const searchParams = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: String(pageSize),
    offset: String(from),
  })

  appendLikeFilter(searchParams, 'shelter_name', search.shelterName)
  appendLikeFilter(searchParams, 'shelter_code', search.shelterCode)
  appendLikeFilter(searchParams, 'type', search.type)
  appendLikeFilter(searchParams, 'contact', search.contact)
  appendLikeFilter(searchParams, 'phone', search.phone)
  appendDateRangeFilter(searchParams, 'created_at', search.createdAt)

  const response = await fetch(`/supabase/rest/shelters?${searchParams.toString()}`, {
    headers: {
      Prefer: 'count=exact',
      Range: `${from}-${to}`,
    },
  })
  if (!response.ok) {
    throw new Error(`查询失败：${response.status} ${response.statusText}`)
  }

  const rows = await response.json()
  return {
    list: rows.map((row: any) => ({
      id: row.id,
      shelterName: row.shelter_name,
      shelterCode: row.shelter_code,
      type: row.type,
      totalArea: row.total_area,
      contact: row.contact,
      phone: row.phone,
    })),
    total: Number(response.headers.get('content-range')?.split('/')?.[1] || rows.length),
  }
}

function toShelterPayload(values: SuperTableRecord) {
  return {
    shelter_name: values.shelterName,
    shelter_code: values.shelterCode,
    type: values.type,
    total_area: values.totalArea,
    contact: values.contact,
    phone: values.phone,
  }
}

async function requestShelter(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`操作失败：${response.status} ${await response.text()}`)
  }

  return response
}

async function submitShelterForm(
  values: SuperTableRecord,
  context: { mode: 'create' | 'edit'; record?: SuperTableRecord },
) {
  if (context.mode === 'create') {
    await requestShelter('/supabase/rest/shelters', {
      method: 'POST',
      body: JSON.stringify(toShelterPayload(values)),
    })
    global.message.success('新建成功')
    return
  }

  if (!context.record?.id) return
  await requestShelter(`/supabase/rest/shelters?id=eq.${context.record.id}`, {
    method: 'PATCH',
    body: JSON.stringify(toShelterPayload(values)),
  })
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
  const params = ids.map((id) => String(id)).join(',')
  await requestShelter(`/supabase/rest/shelters?id=in.(${params})`, {
    method: 'DELETE',
  })
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
