import type { SuperTableRequestParams, SuperTableRequestResult } from 'common'
import type { ShelterInput, ShelterRecord, ShelterRepository } from './types'

const restBaseUrl = (import.meta.env.VITE_SUPABASE_REST_URL || '/supabase/rest').replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function toShelterRecord(record: Record<string, unknown>): ShelterRecord {
  return {
    id: String(record.id),
    shelterName: String(record.shelter_name ?? ''),
    shelterCode: String(record.shelter_code ?? ''),
    type: String(record.type ?? ''),
    totalArea: Number(record.total_area ?? 0),
    contact: String(record.contact ?? ''),
    phone: String(record.phone ?? ''),
    createdAt: String(record.created_at ?? ''),
  }
}

function toApiInput(input: ShelterInput) {
  return {
    shelter_name: input.shelterName,
    shelter_code: input.shelterCode,
    type: input.type,
    total_area: input.totalArea,
    contact: input.contact,
    phone: input.phone,
  }
}

function getDateValue(value: unknown) {
  if (!value) return ''
  if (typeof value === 'object' && 'toISOString' in value && typeof value.toISOString === 'function') {
    return value.toISOString()
  }
  return String(value)
}

function appendLikeFilter(searchParams: URLSearchParams, field: string, value: unknown) {
  if (!value) return
  searchParams.set(field, `ilike.*${String(value)}*`)
}

function appendDateRangeFilter(searchParams: URLSearchParams, field: string, value: unknown) {
  if (!Array.isArray(value)) return
  const [start, end] = value
  if (start) searchParams.append(field, `gte.${getDateValue(start)}`)
  if (end) searchParams.append(field, `lte.${getDateValue(end)}`)
}

function withAuthHeaders(headers: HeadersInit = {}) {
  if (!anonKey) return headers

  return {
    ...headers,
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${restBaseUrl}${path}`, {
    ...init,
    headers: withAuthHeaders(init.headers),
  })

  if (!response.ok) {
    throw new Error(`Supabase 请求失败：${response.status} ${await response.text()}`)
  }

  return response
}

async function list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<ShelterRecord>> {
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

  const response = await request(`/shelters?${searchParams.toString()}`, {
    headers: {
      Prefer: 'count=exact',
      Range: `${from}-${to}`,
    },
  })
  const rows = (await response.json()) as Record<string, unknown>[]

  return {
    list: rows.map(toShelterRecord),
    total: Number(response.headers.get('content-range')?.split('/')?.[1] || rows.length),
  }
}

async function create(input: ShelterInput) {
  const response = await request('/shelters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(toApiInput(input)),
  })
  const [row] = (await response.json()) as Record<string, unknown>[]
  return toShelterRecord(row)
}

async function update(id: string, input: ShelterInput) {
  const response = await request(`/shelters?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(toApiInput(input)),
  })
  const [row] = (await response.json()) as Record<string, unknown>[]
  return toShelterRecord(row)
}

async function remove(ids: string[]) {
  if (!ids.length) return
  await request(`/shelters?id=in.(${ids.map(encodeURIComponent).join(',')})`, { method: 'DELETE' })
}

export const supabaseShelterRepository: ShelterRepository = {
  list,
  create,
  update,
  remove,
}
