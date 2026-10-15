import { computed, ref } from 'vue'
import { type AccessPermission, useAccess } from 'common'

export interface MockAccessProfile {
  id: string
  name: string
  role: string
  permissions: AccessPermission[]
}

const mockAccessStorageKey = 'app-dock-mock-access-profile'
const mockAccessEnabled = import.meta.env.VITE_DATA_SOURCE !== 'supabase'

export const mockAccessProfiles: MockAccessProfile[] = [
  {
    id: 'admin',
    name: '模拟管理员',
    role: '系统管理员',
    permissions: ['*'],
  },
  {
    id: 'operator',
    name: '模拟录入员',
    role: '业务录入员',
    permissions: ['shelter:read', 'shelter:create', 'shelter:update', 'shelter:export'],
  },
  {
    id: 'auditor',
    name: '模拟审计员',
    role: '只读审计员',
    permissions: ['shelter:read', 'shelter:export'],
  },
]

const currentMockAccessProfileId = ref<string>()

const currentMockAccessProfile = computed(() => {
  return mockAccessProfiles.find((profile) => profile.id === currentMockAccessProfileId.value)
})

function getConfiguredPermissions() {
  return (import.meta.env.VITE_ACCESS_PERMISSIONS || '').split(',')
}

function getStoredMockAccessProfileId() {
  if (typeof window === 'undefined') return undefined
  return window.localStorage.getItem(mockAccessStorageKey) || undefined
}

function selectMockAccessProfile(profileId: string) {
  const profile = mockAccessProfiles.find((item) => item.id === profileId)
  if (!profile) return

  currentMockAccessProfileId.value = profile.id
  useAccess().setPermissions(profile.permissions)
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(mockAccessStorageKey, profile.id)
  }
}

export function initializeAccess() {
  if (mockAccessEnabled) {
    selectMockAccessProfile(getStoredMockAccessProfileId() || import.meta.env.VITE_MOCK_ACCESS_PROFILE || 'admin')
    return
  }

  useAccess().setPermissions(getConfiguredPermissions())
}

export function useMockAccess() {
  return {
    enabled: mockAccessEnabled,
    profiles: mockAccessProfiles,
    currentProfile: currentMockAccessProfile,
    selectProfile: selectMockAccessProfile,
  }
}
