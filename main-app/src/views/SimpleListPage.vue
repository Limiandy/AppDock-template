<template>
  <div :class="[scopeClass, className]">
    <p v-if="config.description" class="simple-list-page__desc">{{ config.description }}</p>
    <SuperTable
      :row-key="'id'"
      :columns="config.columns"
      :search-fields="config.searchFields"
      :toolbar-actions="config.toolbarActions"
      :show-selection="config.showSelection !== false"
      :request="request"
      @create="onCreate"
      @export="onExport"
      @import="onImport"
      @batch-delete="onBatchDelete"
      @delete="onDelete"
      @edit="onEdit"
      @detail="onDetail"
      @toolbar-action="onToolbarAction"
    >
      <template #cell-certified="{ record }">
        <a-tag :color="record.certified ? 'cyan' : 'default'">{{ record.certified ? '已认证' : '未认证' }}</a-tag>
      </template>
      <template #cell-erpImported="{ record }">
        <a-tag v-if="record.erpImported" color="geekblue">已导入到ERP</a-tag>
        <span v-else class="simple-list-page__muted">未导入</span>
      </template>
      <template #cell-honors="{ record }">
        <a-tag v-for="item in record.honors" :key="item" color="volcano">{{ item }}</a-tag>
      </template>
      <template #cell-tags="{ record }">
        <a-tag v-for="item in record.tags" :key="item">{{ item }}</a-tag>
      </template>
      <template #cell-status="{ record }">
        <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
      </template>
    </SuperTable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SuperTable } from 'common'
import type { SuperTableRecord, SuperTableRequestParams, SuperTableRequestResult } from 'common'
import { queryDataset, type DatasetKey } from '@/data/prototype'
import { listPageConfigs } from '@/views/list-page-configs'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const props = defineProps<{ configKey: DatasetKey }>()

const global = useGlobalStore()
const config = computed(
  () =>
    listPageConfigs[props.configKey] ?? {
      title: '',
      columns: [],
      searchFields: { fields: [] },
    },
)

function request(params: SuperTableRequestParams): Promise<SuperTableRequestResult> {
  return queryDataset(props.configKey, params)
}

function statusColor(status: string) {
  if (['报名中', '进行中', '考察中', '启用', '已发布'].includes(status)) return 'cyan'
  if (['评标中', '待考察', '草稿'].includes(status)) return 'gold'
  if (['已截止', '已结束', '停用'].includes(status)) return 'default'
  return 'geekblue'
}

function notify(action: string, record?: SuperTableRecord) {
  global.message.info(record ? `原型演示：${action}「${record.name ?? record.title}」` : `原型演示：${action}`)
}

function onCreate() {
  notify('新建')
}
function onExport() {
  notify('导出到 Excel')
}
function onImport() {
  notify('批量导入')
}
function onBatchDelete(keys: (string | number)[]) {
  notify(`批量删除 ${keys.length} 条`)
}
function onDelete(record: SuperTableRecord) {
  notify('删除', record)
}
function onEdit(record: SuperTableRecord) {
  notify('编辑', record)
}
function onDetail(record: SuperTableRecord) {
  notify('查看详情', record)
}
function onToolbarAction(key: string) {
  notify(`执行 ${key}`)
}

const [className, scopeClass] = useStyle('simple-list-page', (token) => ({
  '.simple-list-page__desc': {
    margin: `0 0 ${token.marginSM}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSize}px`,
  },
  '.simple-list-page__muted': {
    color: token.colorTextTertiary,
  },
}))
</script>
