import { type TokenKey, type TokenValue, useTheme } from '@/hooks/theme/useTheme.ts'
import { computed, getCurrentInstance } from 'vue'

export default function useTokenComputed() {
  const instance = getCurrentInstance()
  if (!instance) {
    throw new Error('useTokenCache must be called in setup!')
  }

  const { setToken, getToken } = useTheme()

  function createTokenComputed<K extends TokenKey>(key: K) {
    return computed<TokenValue>({
      get() {
        return getToken(key)
      },
      set(v) {
        setToken(key, v)
      },
    })
  }

  const tokenComputedCache = new Map<string, ReturnType<typeof createTokenComputed>>()

  return function getTokenRef(key: TokenKey) {
    if (!tokenComputedCache.has(key)) {
      tokenComputedCache.set(key, createTokenComputed(key))
    }
    return tokenComputedCache.get(key)!
  }
}
