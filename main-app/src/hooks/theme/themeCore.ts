import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { shallowRef } from 'vue'

const { defaultAlgorithm, darkAlgorithm, compactAlgorithm } = theme

export type AlgorithmName = 'light' | 'dark' | 'compact'
export type ThemeMode = 'light' | 'dark' | 'light,compact' | 'dark,compact'

export const algorithmMap = {
  light: defaultAlgorithm,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
}

export const globalThemeConfig = shallowRef<ThemeConfig>({
  algorithm: [defaultAlgorithm],
  token: {},
  components: {
    Button: {},
  },
})

export const globalThemeMode = shallowRef<ThemeMode>('light')

export function getAlgorithmsByMode(mode: ThemeMode) {
  return mode.split(',').map((name) => algorithmMap[name as AlgorithmName])
}

export function getModeByThemeConfig(config: ThemeConfig = {}): ThemeMode {
  const algorithms = Array.isArray(config.algorithm) ? config.algorithm : config.algorithm ? [config.algorithm] : []
  const hasDark = algorithms.includes(algorithmMap.dark)
  const hasCompact = algorithms.includes(algorithmMap.compact)

  if (hasDark && hasCompact) return 'dark,compact'
  if (hasDark) return 'dark'
  if (hasCompact) return 'light,compact'
  return 'light'
}

export function setGlobalThemeConfig(
  config: ThemeConfig,
  options: { replaceToken?: boolean; replaceComponents?: boolean } = {},
) {
  globalThemeConfig.value = {
    ...globalThemeConfig.value,
    ...config,
    token: {
      ...(options.replaceToken ? {} : globalThemeConfig.value.token),
      ...config.token,
    },
    components: {
      ...(options.replaceComponents ? {} : globalThemeConfig.value.components),
      ...config.components,
    },
  }
  globalThemeMode.value = getModeByThemeConfig(globalThemeConfig.value)
}
