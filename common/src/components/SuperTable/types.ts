import type { TableColumnType, TablePaginationConfig } from 'ant-design-vue'

export type SuperTableRecord = Record<string, any>
export type SuperTableRequestMethod = 'GET' | 'POST'

export type SuperTableSearchComponent = 'input' | 'select' | 'rangePicker' | 'datePicker' | 'inputNumber' | 'slot'

export interface SuperTableOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
}

export interface SuperTableSearchField {
  field: string
  label?: string
  component?: SuperTableSearchComponent
  placeholder?: string | [string, string]
  options?: SuperTableOption[]
  props?: Record<string, any>
  span?: number
  hidden?: boolean
  slot?: string
}

export interface SuperTableAction<RecordType = SuperTableRecord> {
  key: string
  label: string
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  danger?: boolean
  ghost?: boolean
  icon?: string
  disabled?: boolean | ((record?: RecordType) => boolean)
  loading?: boolean
  visible?: boolean | ((record?: RecordType) => boolean)
}

export type SuperTableColumn<RecordType = SuperTableRecord> = TableColumnType<RecordType> & {
  key: string
}

export interface SuperTableImportConfig {
  title?: string
  uploadText?: string
  tip?: string
  templateText?: string
  accept?: string
  multiple?: boolean
  uploadProps?: Record<string, any>
}

export interface SuperTablePaginationConfig extends TablePaginationConfig {
  current?: number
  pageSize?: number
}

export interface SuperTableRequestParams {
  current: number
  pageNum: number
  pageSize: number
  search: SuperTableRecord
  sorter?: any
  filters?: Record<string, any>
}

export interface SuperTableRequestResult<RecordType = SuperTableRecord> {
  list: RecordType[]
  total: number
}

export type SuperTableRequest<RecordType = SuperTableRecord> = (
  params: SuperTableRequestParams,
) => Promise<SuperTableRequestResult<RecordType>>

export type SuperTableTransformParams = (params: SuperTableRequestParams) => Record<string, any>

export type SuperTableTransformResponse<RecordType = SuperTableRecord> = (
  response: any,
) => SuperTableRequestResult<RecordType>
