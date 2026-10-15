import type { SuperTableRequestParams, SuperTableRequestResult } from 'common'
import type { ShelterInput, ShelterRecord, ShelterRepository } from './types'

const databaseName = 'app-dock-static-mock'
const databaseVersion = 1
const shelterStore = 'shelters'
const metaStore = 'meta'
const seedVersionKey = 'shelter-seed-version'
const seedVersion = '1'

const seedShelters: ShelterRecord[] = [
  {
    id: 'mock-shelter-001',
    shelterName: '中心城区应急避难所',
    shelterCode: 'YJBN-001',
    type: '室外',
    totalArea: 12000,
    contact: '李四',
    phone: '13800000001',
    createdAt: '2026-01-08T08:00:00.000Z',
  },
  {
    id: 'mock-shelter-002',
    shelterName: '地下空间临时安置点',
    shelterCode: 'YJBN-002',
    type: '室内',
    totalArea: 6800,
    contact: '王五',
    phone: '13800000002',
    createdAt: '2026-01-07T08:00:00.000Z',
  },
  {
    id: 'mock-shelter-003',
    shelterName: '滨江体育公园避难区',
    shelterCode: 'YJBN-003',
    type: '室外',
    totalArea: 15600,
    contact: '赵敏',
    phone: '13800000003',
    createdAt: '2026-01-06T08:00:00.000Z',
  },
  {
    id: 'mock-shelter-004',
    shelterName: '东城综合防灾中心',
    shelterCode: 'YJBN-004',
    type: '综合',
    totalArea: 9200,
    contact: '陈晨',
    phone: '13800000004',
    createdAt: '2026-01-05T08:00:00.000Z',
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

      if (!database.objectStoreNames.contains(shelterStore)) {
        const shelters = database.createObjectStore(shelterStore, { keyPath: 'id' })
        shelters.createIndex('shelterCode', 'shelterCode', { unique: true })
        shelters.createIndex('createdAt', 'createdAt')
      }

      if (!database.objectStoreNames.contains(metaStore)) {
        database.createObjectStore(metaStore, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开 IndexedDB'))
  })

  return databasePromise
}

async function withStores<T>(
  storeNames: string[],
  mode: IDBTransactionMode,
  callback: (stores: Record<string, IDBObjectStore>) => Promise<T> | T,
) {
  const database = await openDatabase()
  const transaction = database.transaction(storeNames, mode)
  const stores = Object.fromEntries(storeNames.map((name) => [name, transaction.objectStore(name)]))
  const result = await callback(stores)
  await transactionDone(transaction)
  return result
}

async function writeSeedData() {
  await withStores([shelterStore, metaStore], 'readwrite', (stores) => {
    stores[shelterStore].clear()
    seedShelters.forEach((shelter) => stores[shelterStore].put(shelter))
    stores[metaStore].put({ key: seedVersionKey, value: seedVersion })
  })
}

function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const seedMeta = await withStores([metaStore], 'readonly', (stores) =>
        requestResult<{ key: string; value: string } | undefined>(stores[metaStore].get(seedVersionKey)),
      )

      if (seedMeta?.value !== seedVersion) {
        await writeSeedData()
      }
    })()
  }

  return initializationPromise
}

function stringIncludes(value: unknown, query: unknown) {
  if (!query) return true
  return String(value).toLocaleLowerCase().includes(String(query).trim().toLocaleLowerCase())
}

function toTimestamp(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'object' && 'toISOString' in value && typeof value.toISOString === 'function') {
    return Date.parse(value.toISOString())
  }
  const timestamp = Date.parse(String(value))
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function isWithinCreatedAtRange(record: ShelterRecord, value: unknown) {
  if (!Array.isArray(value)) return true

  const [start, end] = value.map(toTimestamp)
  const createdAt = Date.parse(record.createdAt)

  return (!start || createdAt >= start) && (!end || createdAt <= end)
}

function matchesSearch(record: ShelterRecord, search: Record<string, unknown>) {
  return (
    stringIncludes(record.shelterName, search.shelterName) &&
    stringIncludes(record.shelterCode, search.shelterCode) &&
    stringIncludes(record.type, search.type) &&
    stringIncludes(record.contact, search.contact) &&
    stringIncludes(record.phone, search.phone) &&
    isWithinCreatedAtRange(record, search.createdAt)
  )
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function assertUniqueShelterCode(input: ShelterInput, excludedId?: string) {
  const shelters = await withStores([shelterStore], 'readonly', (stores) =>
    requestResult<ShelterRecord[]>(stores[shelterStore].getAll()),
  )

  if (shelters.some((shelter) => shelter.id !== excludedId && shelter.shelterCode === input.shelterCode)) {
    throw new Error(`避难所编号已存在：${input.shelterCode}`)
  }
}

async function list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<ShelterRecord>> {
  await ensureInitialized()
  const shelters = await withStores([shelterStore], 'readonly', (stores) =>
    requestResult<ShelterRecord[]>(stores[shelterStore].getAll()),
  )
  const filtered = shelters
    .filter((shelter) => matchesSearch(shelter, params.search))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const from = (params.current - 1) * params.pageSize

  return {
    list: filtered.slice(from, from + params.pageSize),
    total: filtered.length,
  }
}

async function create(input: ShelterInput) {
  await ensureInitialized()
  await assertUniqueShelterCode(input)

  const shelter: ShelterRecord = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  }

  await withStores([shelterStore], 'readwrite', (stores) => requestResult(stores[shelterStore].add(shelter)))
  return shelter
}

async function update(id: string, input: ShelterInput) {
  await ensureInitialized()
  await assertUniqueShelterCode(input, id)

  return withStores([shelterStore], 'readwrite', async (stores) => {
    const current = await requestResult<ShelterRecord | undefined>(stores[shelterStore].get(id))
    if (!current) throw new Error('记录不存在或已被删除')

    const next = { ...current, ...input }
    await requestResult(stores[shelterStore].put(next))
    return next
  })
}

async function remove(ids: string[]) {
  await ensureInitialized()
  await withStores([shelterStore], 'readwrite', (stores) => {
    ids.forEach((id) => stores[shelterStore].delete(id))
  })
}

export const mockShelterRepository: ShelterRepository = {
  list,
  create,
  update,
  remove,
  async resetDemoData() {
    await writeSeedData()
  },
}
