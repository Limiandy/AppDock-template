import { computed, readonly, ref } from 'vue'

export type AccessPermission = string

const accessPermissions = ref<AccessPermission[]>([])

const normalizedPermissions = computed(() => new Set(accessPermissions.value))

function normalizePermissions(permissions: readonly AccessPermission[]) {
  return [...new Set(permissions.map((permission) => permission.trim()).filter(Boolean))]
}

function matchesPermission(granted: AccessPermission, required: AccessPermission) {
  if (granted === '*' || granted === required) return true

  if (!granted.endsWith(':*')) return false
  return required.startsWith(granted.slice(0, -1))
}

export function useAccess() {
  function setPermissions(permissions: readonly AccessPermission[] = []) {
    accessPermissions.value = normalizePermissions(permissions)
  }

  function clearPermissions() {
    accessPermissions.value = []
  }

  function can(permission: AccessPermission) {
    const required = permission.trim()
    if (!required) return false

    return [...normalizedPermissions.value].some((granted) => matchesPermission(granted, required))
  }

  function canAny(permissions: readonly AccessPermission[]) {
    return permissions.some(can)
  }

  function canAll(permissions: readonly AccessPermission[]) {
    return permissions.length > 0 && permissions.every(can)
  }

  return {
    permissions: readonly(accessPermissions),
    setPermissions,
    clearPermissions,
    can,
    canAny,
    canAll,
  }
}
