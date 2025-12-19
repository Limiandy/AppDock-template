import type { AliasToken } from 'ant-design-vue/es/theme/interface'

import { createThemeCore } from './themeCore'

export type TokenKey = keyof AliasToken
export type TokenValue = string | number | boolean | AliasToken
export type { AlgorithmName } from './themeCore'

let themeCore: ReturnType<typeof createThemeCore>
export function useTheme() {
  if (!themeCore) themeCore = createThemeCore()

  return themeCore
}
