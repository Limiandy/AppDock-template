<template>
  <section class="super-table" :style="themeVars">
    <a-form
      v-if="visibleSearchFields.length"
      class="super-table__search"
      :model="innerSearchModel"
      :colon="false"
      :layout="searchLabelVisible ? 'vertical' : 'horizontal'"
    >
      <a-row :gutter="[24, 12]" align="middle">
        <a-col v-for="field in visibleSearchFields" :key="field.field" :xs="24" :md="12" :xl="6">
          <a-form-item class="super-table__search-item" :label="searchLabelVisible ? field.label : undefined">
            <slot
              v-if="field.component === 'slot'"
              :name="field.slot || `search-${field.field}`"
              :field="field"
              :model="innerSearchModel"
            />
            <a-select
              v-else-if="field.component === 'select'"
              v-model:value="innerSearchModel[field.field]"
              allow-clear
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            >
              <a-select-option
                v-for="option in field.options || []"
                :key="String(option.value)"
                :value="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
            <a-range-picker
              v-else-if="field.component === 'rangePicker'"
              v-model:value="innerSearchModel[field.field]"
              class="super-table__control"
              :placeholder="getRangePlaceholder(field)"
              v-bind="field.props"
            />
            <a-date-picker
              v-else-if="field.component === 'datePicker'"
              v-model:value="innerSearchModel[field.field]"
              class="super-table__control"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
            <a-input-number
              v-else-if="field.component === 'inputNumber'"
              v-model:value="innerSearchModel[field.field]"
              class="super-table__control"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
            <a-input
              v-else
              v-model:value="innerSearchModel[field.field]"
              allow-clear
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
              @press-enter="onSearch"
            />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :md="12" :xl="6">
          <div class="super-table__search-actions">
            <a-space :size="12">
              <a-button type="primary" :loading="searchLoading" @click="onSearch">
                <template #icon>
                  <SvgIcon name="solar:magnifer-outline" />
                </template>
                搜索
              </a-button>
              <a-button @click="onReset">
                <template #icon>
                  <SvgIcon name="solar:refresh-outline" />
                </template>
                重置
              </a-button>
            </a-space>
          </div>
        </a-col>
      </a-row>
    </a-form>

    <div v-if="resolvedToolbarActions.length || $slots.toolbar" class="super-table__toolbar">
      <slot name="toolbar" :selected-row-keys="selectedKeys" :selected-rows="selectedRows" />
      <a-space v-if="resolvedToolbarActions.length" :size="12" wrap>
        <a-button
          v-for="action in resolvedToolbarActions"
          :key="action.key"
          :type="action.type"
          :danger="action.danger"
          :ghost="action.ghost"
          :loading="action.loading"
          :disabled="getActionDisabled(action)"
          @click="onToolbarAction(action.key)"
        >
          <template v-if="action.icon" #icon>
            <SvgIcon :name="action.icon" />
          </template>
          {{ action.label }}
        </a-button>
      </a-space>
    </div>

    <a-table
      class="super-table__table"
      :columns="resolvedColumns"
      :data-source="resolvedDataSource"
      :loading="resolvedLoading"
      :row-key="rowKey"
      :row-selection="rowSelectionConfig"
      :pagination="paginationConfig"
      v-bind="mergedTableProps"
      @change="onTableChange"
    >
      <template v-for="slotName in forwardedTableSlotNames" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps || {}" />
      </template>

      <template #bodyCell="{ column, record, index, text }">
        <template v-if="column.key === indexColumnKey">
          {{ getIndex(index) }}
        </template>
        <template v-else-if="column.key === actionColumnKey">
          <slot name="operation" :record="record" :index="index" :actions="getVisibleRowActions(record)">
            <a-space :size="16">
              <a-button
                v-for="action in getVisibleRowActions(record)"
                :key="action.key"
                type="link"
                size="small"
                :danger="action.danger"
                :disabled="getActionDisabled(action, record)"
                @click="onRowAction(action.key, record, index)"
              >
                <template v-if="action.icon" #icon>
                  <SvgIcon :name="action.icon" />
                </template>
                {{ action.label }}
              </a-button>
            </a-space>
          </slot>
        </template>
        <template v-else>
          <slot
            v-if="$slots[`cell-${getColumnKey(column)}`]"
            :name="`cell-${getColumnKey(column)}`"
            :record="record"
            :index="index"
            :text="text"
            :column="column"
          />
          <slot
            v-else-if="$slots.bodyCell"
            name="bodyCell"
            :record="record"
            :index="index"
            :text="text"
            :column="column"
          />
          <template v-else>{{ text }}</template>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="importModalOpen"
      :title="importConfigMerged.title"
      :footer="null"
      width="520px"
      centered
      destroy-on-close
    >
      <a-upload-dragger
        class="super-table__upload"
        :accept="importConfigMerged.accept"
        :multiple="importConfigMerged.multiple"
        v-bind="importConfigMerged.uploadProps"
        @change="onUploadChange"
      >
        <div class="super-table__upload-icon">
          <SvgIcon name="solar:upload-outline" width="28px" height="28px" />
        </div>
        <p class="super-table__upload-text">{{ importConfigMerged.uploadText }}</p>
        <p class="super-table__upload-tip">
          <a-button type="link" size="small" @click.stop="onDownloadTemplate">
            {{ importConfigMerged.templateText }}
          </a-button>
          {{ importConfigMerged.tip }}
        </p>
      </a-upload-dragger>

      <div class="super-table__modal-footer">
        <a-button @click="importModalOpen = false">取消</a-button>
      </div>
    </a-modal>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, useAttrs, useSlots, watch } from 'vue'
import type { Slots } from 'vue'
import { theme } from 'ant-design-vue'
import type { TableProps } from 'ant-design-vue'
import SvgIcon from '../SvgIcon.vue'
import type {
  SuperTableAction,
  SuperTableColumn,
  SuperTableImportConfig,
  SuperTablePaginationConfig,
  SuperTableRecord,
  SuperTableRequest,
  SuperTableRequestMethod,
  SuperTableRequestParams,
  SuperTableRequestResult,
  SuperTableSearchField,
  SuperTableTransformParams,
  SuperTableTransformResponse,
} from './types'

defineOptions({
  inheritAttrs: false,
})

const indexColumnKey = '__super_table_index__'
const actionColumnKey = '__super_table_action__'
const internalSlotPrefixes = ['cell-', 'search-']
const internalSlotNames = new Set(['toolbar', 'operation', 'bodyCell'])

const props = withDefaults(
  defineProps<{
    columns: SuperTableColumn[]
    dataSource?: SuperTableRecord[]
    api?: string
    request?: SuperTableRequest
    requestMethod?: SuperTableRequestMethod
    autoRequest?: boolean
    transformParams?: SuperTableTransformParams
    transformResponse?: SuperTableTransformResponse
    searchFields?: SuperTableSearchField[]
    searchModel?: SuperTableRecord
    rowKey?: string | ((record: SuperTableRecord) => string)
    loading?: boolean
    searchLoading?: boolean
    showIndex?: boolean
    showSelection?: boolean
    searchLabelVisible?: boolean
    tableProps?: Partial<TableProps>
    pagination?: false | SuperTablePaginationConfig
    toolbarActions?: SuperTableAction[]
    rowActions?: SuperTableAction[]
    importConfig?: SuperTableImportConfig
  }>(),
  {
    dataSource: () => [],
    api: undefined,
    request: undefined,
    requestMethod: 'GET',
    autoRequest: true,
    transformParams: undefined,
    transformResponse: undefined,
    searchFields: () => [],
    searchModel: () => ({}),
    rowKey: 'id',
    loading: false,
    searchLoading: false,
    showIndex: true,
    showSelection: true,
    searchLabelVisible: false,
    tableProps: () => ({}),
    pagination: undefined,
    toolbarActions: undefined,
    rowActions: undefined,
    importConfig: () => ({}),
  },
)

const attrs = useAttrs()
const slots: Slots = useSlots()

const emit = defineEmits<{
  'update:searchModel': [value: SuperTableRecord]
  'search': [value: SuperTableRecord]
  'reset': []
  'create': []
  'import': []
  'export': []
  'batchDelete': [keys: (string | number)[], rows: SuperTableRecord[]]
  'toolbarAction': [key: string, payload: { selectedRowKeys: (string | number)[]; selectedRows: SuperTableRecord[] }]
  'rowAction': [key: string, record: SuperTableRecord, index: number]
  'edit': [record: SuperTableRecord, index: number]
  'detail': [record: SuperTableRecord, index: number]
  'delete': [record: SuperTableRecord, index: number]
  'change': Parameters<NonNullable<TableProps['onChange']>>
  'uploadChange': [info: any]
  'downloadTemplate': []
  'requestStart': [params: SuperTableRequestParams]
  'requestSuccess': [result: SuperTableRequestResult, params: SuperTableRequestParams]
  'requestError': [error: unknown, params: SuperTableRequestParams]
}>()

const { token } = theme.useToken()
const innerSearchModel = reactive<SuperTableRecord>({})
const selectedKeys = ref<(string | number)[]>([])
const selectedRows = ref<SuperTableRecord[]>([])
const importModalOpen = ref(false)
const internalDataSource = ref<SuperTableRecord[]>([])
const internalLoading = ref(false)
const internalPagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})
const latestRequestId = ref(0)
const lastSorter = ref<any>()
const lastFilters = ref<Record<string, any>>({})
let syncingSearchModelFromProps = false

const forwardedTableSlotNames = computed<string[]>((): string[] => {
  return Object.keys(slots).filter((name) => {
    return !internalSlotNames.has(name) && !internalSlotPrefixes.some((prefix) => name.startsWith(prefix))
  })
})

watch(
  () => props.searchModel,
  (value) => {
    if (isSameSearchModel(value, innerSearchModel)) return

    syncingSearchModelFromProps = true
    Object.keys(innerSearchModel).forEach((key) => {
      delete innerSearchModel[key]
    })
    Object.assign(innerSearchModel, value || {})
    queueMicrotask(() => {
      syncingSearchModelFromProps = false
    })
  },
  { immediate: true, deep: true },
)

watch(
  innerSearchModel,
  (value) => {
    if (syncingSearchModelFromProps || isSameSearchModel(value, props.searchModel)) return
    emit('update:searchModel', { ...value })
  },
  { deep: true },
)

const themeVars = computed(() => ({
  '--super-table-bg': token.value.colorBgContainer,
  '--super-table-layout-bg': token.value.colorBgLayout,
  '--super-table-text': token.value.colorText,
  '--super-table-text-secondary': token.value.colorTextSecondary,
  '--super-table-border': token.value.colorBorderSecondary,
  '--super-table-hover': token.value.colorFillTertiary,
  '--super-table-radius': `${token.value.borderRadius}px`,
  '--super-table-control-height': `${token.value.controlHeightLG}px`,
}))

const visibleSearchFields = computed<SuperTableSearchField[]>(() => props.searchFields.filter((item) => !item.hidden))

const hasDataRequest = computed(() => Boolean(props.request || props.api))

const resolvedDataSource = computed(() => {
  return hasDataRequest.value ? internalDataSource.value : props.dataSource
})

const resolvedLoading = computed(() => {
  return hasDataRequest.value ? internalLoading.value : props.loading
})

const resolvedToolbarActions = computed<SuperTableAction[]>(() => {
  const actions = props.toolbarActions ?? [
    { key: 'create', label: '新建', type: 'primary', icon: 'solar:add-circle-outline' },
    { key: 'import', label: '导入', icon: 'solar:upload-outline' },
    { key: 'export', label: '导出', icon: 'solar:download-outline' },
    { key: 'batchDelete', label: '批量删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
  ]

  return actions.filter((action) => action.visible !== false)
})

const resolvedRowActions = computed<SuperTableAction[]>(() => {
  return (
    props.rowActions ?? [
      { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
      { key: 'detail', label: '详情', icon: 'solar:file-text-outline' },
      { key: 'delete', label: '删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
    ]
  )
})

const resolvedColumns = computed(() => {
  const columns: SuperTableColumn[] = props.columns.map((column) => ({
    ellipsis: true,
    ...column,
  }))

  if (props.showIndex) {
    columns.unshift({
      key: indexColumnKey,
      title: 'No.',
      width: 72,
      align: 'center',
    })
  }

  if (resolvedRowActions.value.length) {
    columns.push({
      key: actionColumnKey,
      title: '操作',
      width: 260,
      fixed: 'right',
    })
  }

  return columns
})

const paginationConfig = computed(() => {
  if (props.pagination === false) return false

  if (hasDataRequest.value) {
    return {
      showTotal: (total: number) => `共 ${total} 条`,
      showSizeChanger: true,
      ...props.pagination,
      current: internalPagination.current,
      pageSize: internalPagination.pageSize,
      total: internalPagination.total,
    }
  }

  return {
    showTotal: (total: number) => `共 ${total} 条`,
    showSizeChanger: true,
    ...props.pagination,
  }
})

const mergedTableProps = computed(() => ({
  ...attrs,
  ...props.tableProps,
}))

const rowSelectionConfig = computed(() => {
  if (!props.showSelection) return undefined

  return {
    selectedRowKeys: selectedKeys.value,
    onChange: (keys: (string | number)[], rows: SuperTableRecord[]) => {
      selectedKeys.value = keys
      selectedRows.value = rows
    },
  }
})

const importConfigMerged = computed<Required<SuperTableImportConfig>>(() => ({
  title: '导入',
  uploadText: '上传文件',
  templateText: '下载模板',
  tip: '填写数据，上传批量生成数据',
  accept: '.xlsx,.xls,.csv',
  multiple: false,
  uploadProps: {},
  ...props.importConfig,
}))

function getPlaceholder(field: SuperTableSearchField) {
  if (Array.isArray(field.placeholder)) return field.placeholder[0]
  return field.placeholder ?? `请输入${field.label || ''}`
}

function getRangePlaceholder(field: SuperTableSearchField): [string, string] {
  if (Array.isArray(field.placeholder)) return field.placeholder
  return ['起始创建时间', '结束创建时间']
}

function isSameSearchModel(left: SuperTableRecord = {}, right: SuperTableRecord = {}) {
  const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined)
  const rightKeys = Object.keys(right).filter((key) => right[key] !== undefined)
  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key) => left[key] === right[key])
}

function getColumnKey(column: any) {
  const key = column.key ?? column.dataIndex
  return Array.isArray(key) ? key.join('-') : String(key)
}

function getIndex(index: number) {
  if (props.pagination === false) return index + 1
  const current = hasDataRequest.value ? internalPagination.current : (props.pagination?.current ?? 1)
  const pageSize = hasDataRequest.value ? internalPagination.pageSize : (props.pagination?.pageSize ?? 10)
  return (current - 1) * pageSize + index + 1
}

function getActionVisible(action: SuperTableAction, record?: SuperTableRecord) {
  return typeof action.visible === 'function' ? action.visible(record) : action.visible !== false
}

function getActionDisabled(action: SuperTableAction, record?: SuperTableRecord) {
  return typeof action.disabled === 'function' ? action.disabled(record) : action.disabled
}

function getVisibleRowActions(record: SuperTableRecord) {
  return resolvedRowActions.value.filter((action) => getActionVisible(action, record))
}

function isEmptySearchValue(value: any) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

function getSearchPayload() {
  return Object.entries(innerSearchModel).reduce<SuperTableRecord>((payload, [key, value]) => {
    if (!isEmptySearchValue(value)) {
      payload[key] = value
    }
    return payload
  }, {})
}

function buildRequestParams(page?: Partial<Pick<SuperTableRequestParams, 'current' | 'pageSize'>>) {
  const current = page?.current ?? internalPagination.current
  const pageSize = page?.pageSize ?? internalPagination.pageSize

  return {
    current,
    pageNum: current,
    pageSize,
    search: getSearchPayload(),
    sorter: lastSorter.value,
    filters: lastFilters.value,
  }
}

function normalizeRequestResult(response: any): SuperTableRequestResult {
  if (Array.isArray(response)) {
    return {
      list: response,
      total: response.length,
    }
  }

  const candidates = [response, response?.data, response?.result]
  for (const candidate of candidates) {
    if (!candidate) continue

    const list = candidate.list ?? candidate.records ?? candidate.rows ?? candidate.items
    if (Array.isArray(list)) {
      return {
        list,
        total: Number(candidate.total ?? candidate.totalCount ?? candidate.count ?? list.length),
      }
    }
  }

  return {
    list: [],
    total: 0,
  }
}

function getApiPayload(params: SuperTableRequestParams) {
  return (
    props.transformParams?.(params) ?? {
      ...params.search,
      pageNum: params.pageNum,
      current: params.current,
      pageSize: params.pageSize,
      sorter: params.sorter,
      filters: params.filters,
    }
  )
}

async function fetchByApi(params: SuperTableRequestParams) {
  if (!props.api) {
    throw new Error('SuperTable api is required')
  }

  const payload = getApiPayload(params)
  const method = props.requestMethod.toUpperCase() as SuperTableRequestMethod
  const url = new URL(props.api, window.location.origin)
  const init: RequestInit = {
    method,
    headers: {},
  }

  if (method === 'GET') {
    Object.entries(payload).forEach(([key, value]) => {
      if (isEmptySearchValue(value)) return
      url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    })
  } else {
    init.headers = {
      'Content-Type': 'application/json',
    }
    init.body = JSON.stringify(payload)
  }

  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`SuperTable request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function reload(page?: Partial<Pick<SuperTableRequestParams, 'current' | 'pageSize'>>) {
  if (!hasDataRequest.value) return

  const params = buildRequestParams(page)
  const requestId = latestRequestId.value + 1
  latestRequestId.value = requestId
  internalLoading.value = true
  emit('requestStart', params)

  try {
    const response = props.request ? await props.request(params) : await fetchByApi(params)
    const result = props.transformResponse?.(response) ?? normalizeRequestResult(response)

    if (requestId !== latestRequestId.value) return
    internalDataSource.value = result.list
    internalPagination.current = params.current
    internalPagination.pageSize = params.pageSize
    internalPagination.total = result.total
    selectedKeys.value = []
    selectedRows.value = []
    emit('requestSuccess', result, params)
  } catch (error) {
    if (requestId !== latestRequestId.value) return
    emit('requestError', error, params)
    throw error
  } finally {
    if (requestId === latestRequestId.value) {
      internalLoading.value = false
    }
  }
}

function onSearch() {
  const payload = getSearchPayload()
  emit('search', payload)
  if (hasDataRequest.value) {
    void reload({ current: 1 })
  }
}

function onReset() {
  Object.keys(innerSearchModel).forEach((key) => {
    innerSearchModel[key] = undefined
  })
  emit('reset')
  emit('search', {})
  if (hasDataRequest.value) {
    void reload({ current: 1 })
  }
}

function onToolbarAction(key: string) {
  if (key === 'create') {
    emit('create')
  } else if (key === 'import') {
    importModalOpen.value = true
    emit('import')
  } else if (key === 'export') {
    emit('export')
  } else if (key === 'batchDelete') {
    emit('batchDelete', selectedKeys.value, selectedRows.value)
  }
  emit('toolbarAction', key, {
    selectedRowKeys: selectedKeys.value,
    selectedRows: selectedRows.value,
  })
}

function onRowAction(key: string, record: SuperTableRecord, index: number) {
  if (key === 'edit') emit('edit', record, index)
  if (key === 'detail') emit('detail', record, index)
  if (key === 'delete') emit('delete', record, index)
  emit('rowAction', key, record, index)
}

function onTableChange(...args: Parameters<NonNullable<TableProps['onChange']>>) {
  emit('change', ...args)

  if (!hasDataRequest.value) return

  const [pagination, filters, sorter] = args
  lastSorter.value = sorter
  lastFilters.value = filters as Record<string, any>
  void reload({
    current: pagination.current,
    pageSize: pagination.pageSize,
  })
}

function onUploadChange(info: any) {
  emit('uploadChange', info)
}

function onDownloadTemplate() {
  emit('downloadTemplate')
}

onMounted(() => {
  if (hasDataRequest.value && props.autoRequest) {
    void reload()
  }
})

defineExpose({
  reload,
  reset: onReset,
  getSearchModel: () => ({ ...innerSearchModel }),
})
</script>

<style lang="less" scoped>
.super-table {
  min-height: 100%;
  color: var(--super-table-text);
  background: var(--super-table-layout-bg);
}

.super-table__search {
  padding: 24px 24px 18px;
  background: var(--super-table-bg);
  border-bottom: 1px solid var(--super-table-border);
}

.super-table__search-item {
  margin-bottom: 0;
}

.super-table__control {
  width: 100%;
}

.super-table__search-actions {
  display: flex;
  align-items: center;
  min-height: var(--super-table-control-height);
}

.super-table__toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 18px 24px;
  background: var(--super-table-bg);
}

.super-table__table {
  background: var(--super-table-bg);
}

.super-table__upload {
  background: var(--super-table-bg);
}

.super-table__upload-icon,
.super-table__upload-text {
  color: var(--ant-color-primary, #1677ff);
}

.super-table__upload-text {
  margin: 10px 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.super-table__upload-tip {
  margin: 0;
  color: var(--super-table-text-secondary);
}

.super-table__modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

:deep(.ant-btn .ant-btn-icon) {
  display: inline-flex;
  align-items: center;
}

:deep(.ant-form-item-control-input),
:deep(.ant-input),
:deep(.ant-select-selector),
:deep(.ant-picker),
:deep(.ant-input-number) {
  min-height: var(--super-table-control-height);
}

:deep(.ant-table-wrapper .ant-table) {
  color: var(--super-table-text);
  background: var(--super-table-bg);
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  background: var(--super-table-hover);
}

@media (max-width: 720px) {
  .super-table__search {
    padding: 16px;
  }

  .super-table__toolbar {
    justify-content: flex-start;
    padding: 16px;
  }
}
</style>
