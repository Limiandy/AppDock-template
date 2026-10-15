import { mockShelterRepository } from './mock'
import { supabaseShelterRepository } from './supabase'
import type { ShelterRepository } from './types'

export type DataSource = 'mock' | 'supabase'

export const dataSource: DataSource = import.meta.env.VITE_DATA_SOURCE === 'supabase' ? 'supabase' : 'mock'
export const isMockDataSource = dataSource === 'mock'
export const shelterRepository: ShelterRepository = isMockDataSource ? mockShelterRepository : supabaseShelterRepository

export type { ShelterInput, ShelterRecord, ShelterRepository } from './types'
export { toShelterInput } from './types'
