import type { SuperTableRecord, SuperTableRequestParams, SuperTableRequestResult } from 'common'

export interface ShelterRecord {
  id: string
  shelterName: string
  shelterCode: string
  type: string
  totalArea: number
  contact: string
  phone: string
  createdAt: string
}

export interface ShelterInput {
  shelterName: string
  shelterCode: string
  type: string
  totalArea: number
  contact: string
  phone: string
}

export interface ShelterRepository {
  list(params: SuperTableRequestParams): Promise<SuperTableRequestResult<ShelterRecord>>
  create(input: ShelterInput): Promise<ShelterRecord>
  update(id: string, input: ShelterInput): Promise<ShelterRecord>
  remove(ids: string[]): Promise<void>
  resetDemoData?: () => Promise<void>
}

export function toShelterInput(values: SuperTableRecord): ShelterInput {
  return {
    shelterName: String(values.shelterName ?? ''),
    shelterCode: String(values.shelterCode ?? ''),
    type: String(values.type ?? ''),
    totalArea: Number(values.totalArea ?? 0),
    contact: String(values.contact ?? ''),
    phone: String(values.phone ?? ''),
  }
}
