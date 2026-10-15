import type { SuperTableRecord, SuperTableRequestParams, SuperTableRequestResult } from 'common'
import type {
  BaseAdminRecord,
  BaseAdminRepository,
  MenuInput,
  MenuRecord,
  RoleInput,
  RoleRecord,
  UserInput,
  UserRecord,
} from './types'

const databaseName = 'app-dock-base-admin-mock'
const databaseVersion = 1
const metadataStore = 'metadata'
const seedVersionKey = 'seed-version'
const seedVersion = '1'
const storeNames = ['users', 'roles', 'menus'] as const

const seedUsers: UserRecord[] = [
  {
    id: 'mock-user-001',
    account: 'admin',
    name: '系统管理员',
    mobile: '13800000001',
    department: '平台管理部',
    role: '系统管理员',
    status: true,
    createdAt: '2026-01-08T08:00:00.000Z',
  },
  {
    id: 'mock-user-002',
    account: 'zhangsan',
    name: '张三',
    mobile: '13800000002',
    department: '应急保障部',
    role: '业务录入员',
    status: true,
    createdAt: '2026-01-07T08:00:00.000Z',
  },
  {
    id: 'mock-user-003',
    account: 'lisi',
    name: '李四',
    mobile: '13800000003',
    department: '审计监督部',
    role: '只读审计员',
    status: true,
    createdAt: '2026-01-06T08:00:00.000Z',
  },
]

const seedRoles: RoleRecord[] = [
  {
    id: 'mock-role-001',
    code: 'ADMIN',
    name: '系统管理员',
    description: '拥有系统全部管理权限。',
    userCount: 1,
    permissions: ['system', 'system:user', 'system:user:create', 'system:role', 'system:menu'],
    status: true,
    createdAt: '2026-01-08T08:00:00.000Z',
  },
  {
    id: 'mock-role-002',
    code: 'OPERATOR',
    name: '业务录入员',
    description: '可维护业务数据并导出数据。',
    userCount: 1,
    permissions: ['system:user', 'system:user:create'],
    status: true,
    createdAt: '2026-01-07T08:00:00.000Z',
  },
  {
    id: 'mock-role-003',
    code: 'AUDITOR',
    name: '只读审计员',
    description: '仅可查看和导出业务数据。',
    userCount: 1,
    permissions: ['system:user'],
    status: true,
    createdAt: '2026-01-06T08:00:00.000Z',
  },
]

const seedMenus: MenuRecord[] = [
  {
    id: 'mock-menu-001',
    parentName: '根目录',
    name: '系统管理',
    code: 'system',
    path: '/system',
    type: '目录',
    sort: 1,
    status: true,
    createdAt: '2026-01-08T08:00:00.000Z',
  },
  {
    id: 'mock-menu-002',
    parentName: '系统管理',
    name: '用户管理',
    code: 'system:user',
    path: '/system/users',
    type: '菜单',
    sort: 1,
    status: true,
    createdAt: '2026-01-07T08:00:00.000Z',
  },
  {
    id: 'mock-menu-003',
    parentName: '系统管理',
    name: '角色管理',
    code: 'system:role',
    path: '/system/roles',
    type: '菜单',
    sort: 2,
    status: true,
    createdAt: '2026-01-06T08:00:00.000Z',
  },
  {
    id: 'mock-menu-004',
    parentName: '系统管理',
    name: '菜单管理',
    code: 'system:menu',
    path: '/system/menus',
    type: '菜单',
    sort: 3,
    status: true,
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'mock-menu-005',
    parentName: '用户管理',
    name: '新增用户',
    code: 'system:user:create',
    path: '',
    type: '按钮',
    sort: 1,
    status: true,
    createdAt: '2026-01-04T08:00:00.000Z',
  },
]

let databasePromise: Promise<IDBDatabase> | undefined
let initializationPromise: Promise<void> | undefined

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 请求失败'))
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB 事务已中止'))
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB 事务失败'))
  })
}

function openDatabase() {
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)

    request.onupgradeneeded = () => {
      const database = request.result
      storeNames.forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
      if (!database.objectStoreNames.contains(metadataStore)) {
        database.createObjectStore(metadataStore, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开 IndexedDB'))
  })

  return databasePromise
}

async function withStores<T>(
  names: string[],
  mode: IDBTransactionMode,
  callback: (stores: Record<string, IDBObjectStore>) => Promise<T> | T,
) {
  const database = await openDatabase()
  const transaction = database.transaction(names, mode)
  const stores = Object.fromEntries(names.map((name) => [name, transaction.objectStore(name)]))
  const result = await callback(stores)
  await transactionDone(transaction)
  return result
}

async function writeSeedData() {
  await withStores([...storeNames, metadataStore], 'readwrite', (stores) => {
    const seedData = {
      users: seedUsers,
      roles: seedRoles,
      menus: seedMenus,
    }

    storeNames.forEach((storeName) => {
      stores[storeName].clear()
      seedData[storeName].forEach((record) => stores[storeName].put(record))
    })
    stores[metadataStore].put({ key: seedVersionKey, value: seedVersion })
  })
}

function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const seedMeta = await withStores([metadataStore], 'readonly', (stores) =>
        requestResult<{ key: string; value: string } | undefined>(stores[metadataStore].get(seedVersionKey)),
      )
      if (seedMeta?.value !== seedVersion) {
        await writeSeedData()
      }
    })()
  }

  return initializationPromise
}

function stringIncludes(value: unknown, query: unknown) {
  if (query === undefined || query === null || query === '') return true
  return String(value).toLocaleLowerCase().includes(String(query).trim().toLocaleLowerCase())
}

function matchesStatus(status: boolean, query: unknown) {
  if (query === undefined || query === null || query === '') return true
  return status === query
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createRepository<Record extends BaseAdminRecord, Input extends object>(
  storeName: (typeof storeNames)[number],
  matchesSearch: (record: Record, search: SuperTableRecord) => boolean,
  createRecord: (input: Input) => Record,
): BaseAdminRepository<Record, Input> {
  return {
    async list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<Record>> {
      await ensureInitialized()
      const records = await withStores([storeName], 'readonly', (stores) =>
        requestResult<Record[]>(stores[storeName].getAll()),
      )
      const filtered = records
        .filter((record) => matchesSearch(record, params.search))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      const from = (params.current - 1) * params.pageSize

      return {
        list: filtered.slice(from, from + params.pageSize),
        total: filtered.length,
      }
    },
    async create(input: Input) {
      await ensureInitialized()
      const record = createRecord(input)
      await withStores([storeName], 'readwrite', (stores) => requestResult(stores[storeName].add(record)))
      return record
    },
    async update(id: string, input: Input) {
      await ensureInitialized()
      return withStores([storeName], 'readwrite', async (stores) => {
        const current = await requestResult<Record | undefined>(stores[storeName].get(id))
        if (!current) throw new Error('记录不存在或已被删除')

        const next = { ...current, ...input }
        await requestResult(stores[storeName].put(next))
        return next
      })
    },
    async remove(ids: string[]) {
      await ensureInitialized()
      await withStores([storeName], 'readwrite', (stores) => {
        ids.forEach((id) => stores[storeName].delete(id))
      })
    },
  }
}

export const userRepository = createRepository<UserRecord, UserInput>(
  'users',
  (record, search) => {
    return (
      stringIncludes(record.account, search.account) &&
      stringIncludes(record.name, search.name) &&
      stringIncludes(record.role, search.role) &&
      matchesStatus(record.status, search.status)
    )
  },
  (input) => ({ ...input, id: createId(), createdAt: new Date().toISOString() }),
)

export const roleRepository = createRepository<RoleRecord, RoleInput>(
  'roles',
  (record, search) => {
    return (
      stringIncludes(record.code, search.code) &&
      stringIncludes(record.name, search.name) &&
      matchesStatus(record.status, search.status)
    )
  },
  (input) => ({ ...input, userCount: 0, id: createId(), createdAt: new Date().toISOString() }),
)

export const menuRepository = createRepository<MenuRecord, MenuInput>(
  'menus',
  (record, search) => {
    return (
      stringIncludes(record.name, search.name) &&
      stringIncludes(record.code, search.code) &&
      stringIncludes(record.type, search.type) &&
      matchesStatus(record.status, search.status)
    )
  },
  (input) => ({ ...input, id: createId(), createdAt: new Date().toISOString() }),
)
