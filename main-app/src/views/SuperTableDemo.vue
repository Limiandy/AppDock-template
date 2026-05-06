<template>
  <div class="super-table-demo">
    <SuperTable
      :columns="columns"
      :search-fields="searchFields"
      :request="getShelterPage"
      @reset="onReset"
      @create="onCreate"
      @export="onExport"
      @batch-delete="onBatchDelete"
      @edit="onEdit"
      @detail="onDetail"
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
  SuperTableRecord,
  SuperTableRequestParams,
  SuperTableRequestResult,
  SuperTableSearchField,
} from 'common'
import { useGlobalStore } from '@/store/modules/global.ts'

interface ShelterRecord {
  id: string
  shelterName: string
  shelterCode: string
  type: string
  totalArea: string
  contact: string
}

const global = useGlobalStore()

const searchFields: SuperTableSearchField[] = [
  { field: 'shelterName', label: '应急避难所名称', placeholder: '请输入应急避难所名称' },
  { field: 'shelterCode', label: '应急避难所编号', placeholder: '请输入应急避难所编号' },
  { field: 'type', label: '类型', placeholder: '请输入类型' },
  { field: 'totalArea', label: '总面积', placeholder: '请输入总面积' },
  { field: 'contact', label: '人防工作联系人', placeholder: '请输入人防工作联系人' },
  { field: 'phone', label: '人防工作联系电话', placeholder: '请输入人防工作联系电话' },
  {
    field: 'createdAt',
    label: '创建时间',
    component: 'rangePicker',
    placeholder: ['起始创建时间', '结束创建时间'],
  },
]

const columns: SuperTableColumn[] = [
  { key: 'shelterName', title: '应急避难所名称', dataIndex: 'shelterName', width: 200 },
  { key: 'shelterCode', title: '应急避难所编号', dataIndex: 'shelterCode', width: 200 },
  { key: 'type', title: '类型', dataIndex: 'type', width: 140 },
  { key: 'totalArea', title: '总面积', dataIndex: 'totalArea', width: 140 },
  { key: 'contact', title: '人防工作联系人', dataIndex: 'contact', width: 190 },
]

function notice(content: string) {
  global.message.info(content)
}

function appendLikeFilter(searchParams: URLSearchParams, field: string, value: unknown) {
  if (!value) return
  searchParams.set(field, `ilike.*${String(value)}*`)
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
    })),
    total: Number(response.headers.get('content-range')?.split('/')?.[1] || rows.length),
  }
}

function onReset() {
  notice('已重置查询条件')
}

function onCreate() {
  notice('新建')
}

function onExport() {
  notice('导出')
}

function onBatchDelete(keys: (string | number)[]) {
  notice(`批量删除：${keys.length} 条`)
}

function getShelterName(record: SuperTableRecord) {
  return String(record.shelterName || '')
}

function onEdit(record: SuperTableRecord) {
  notice(`编辑：${getShelterName(record)}`)
}

function onDetail(record: SuperTableRecord) {
  notice(`详情：${getShelterName(record)}`)
}

function onDelete(record: SuperTableRecord) {
  notice(`删除：${getShelterName(record)}`)
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
