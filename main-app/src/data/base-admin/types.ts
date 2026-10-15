import type { SuperTableRecord, SuperTableRequestParams, SuperTableRequestResult } from 'common'

export interface BaseAdminRecord {
  id: string
  createdAt: string
  status: boolean
}

export interface UserRecord extends BaseAdminRecord {
  account: string
  name: string
  mobile: string
  department: string
  role: string
}

export interface UserInput {
  account: string
  name: string
  mobile: string
  department: string
  role: string
  status: boolean
}

export interface RoleRecord extends BaseAdminRecord {
  code: string
  name: string
  description: string
  userCount: number
  permissions: string[]
}

export interface RoleInput {
  code: string
  name: string
  description: string
  status: boolean
  permissions: string[]
}

export interface MenuRecord extends BaseAdminRecord {
  parentName: string
  name: string
  code: string
  path: string
  type: '目录' | '菜单' | '按钮'
  sort: number
}

export interface MenuInput {
  parentName: string
  name: string
  code: string
  path: string
  type: '目录' | '菜单' | '按钮'
  sort: number
  status: boolean
}

export interface BaseAdminRepository<Record extends BaseAdminRecord, Input> {
  list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<Record>>
  create(input: Input): Promise<Record>
  update(id: string, input: Input): Promise<Record>
  remove(ids: string[]): Promise<void>
}

export function toUserInput(values: SuperTableRecord): UserInput {
  return {
    account: String(values.account ?? ''),
    name: String(values.name ?? ''),
    mobile: String(values.mobile ?? ''),
    department: String(values.department ?? ''),
    role: String(values.role ?? ''),
    status: Boolean(values.status),
  }
}

export function toRoleInput(values: SuperTableRecord): RoleInput {
  return {
    code: String(values.code ?? ''),
    name: String(values.name ?? ''),
    description: String(values.description ?? ''),
    status: Boolean(values.status),
    permissions: Array.isArray(values.permissions) ? values.permissions.map(String) : [],
  }
}

export function toMenuInput(values: SuperTableRecord): MenuInput {
  return {
    parentName: String(values.parentName ?? '根目录'),
    name: String(values.name ?? ''),
    code: String(values.code ?? ''),
    path: String(values.path ?? ''),
    type: (values.type || '菜单') as MenuInput['type'],
    sort: Number(values.sort ?? 0),
    status: Boolean(values.status),
  }
}
