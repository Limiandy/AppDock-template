// useTheme.ts
import { theme } from 'ant-design-vue'
import { createThemeCore } from './themeCore'

const { useToken } = theme

const themeCore = createThemeCore()

export type TokenKey = keyof typeof themeCore.aliasToken.value
export type TokenValue = (typeof themeCore.aliasToken.value)[TokenKey]
export type { AlgorithmName } from './themeCore'

export function useTheme() {
  /**
   * 是否受控，如果受控正常传递，否则删除，则内部使用最初的默认值计算
   */
  const { token, theme } = useToken()
  themeCore.injectAliasToken.value = token.value
  // @ts-ignore
  themeCore.injectDerivatives.value = theme.value.derivatives

  return themeCore
}
