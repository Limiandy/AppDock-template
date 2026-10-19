import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { shallowRef } from 'vue'
import {
  managementSystemDarkComponents,
  managementSystemDarkTokens,
  managementSystemLightComponents,
  managementSystemLightTokens,
  managementSystemSeedComponents,
  managementSystemSeedTokens,
} from './presets/managementSystem'

const { defaultAlgorithm, darkAlgorithm, compactAlgorithm } = theme

export type AlgorithmName = 'light' | 'dark' | 'compact'
export type ThemeMode = 'light' | 'dark' | 'light,compact' | 'dark,compact'

export const algorithmMap = {
  light: defaultAlgorithm,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
}

/**
 * 全局默认主题：基于 managementSystem 预设（docs/design-tokens.md）。
 * 明暗切换由 applyThemeMode 整层替换中性色，编辑器的自定义 token 会被保留。
 */
export const globalThemeConfig = shallowRef<ThemeConfig>({
  // 默认全局紧凑：尺寸/间距/行高由 Antd 算法派生（不写死数值）
  algorithm: [defaultAlgorithm, compactAlgorithm],
  token: {
    ...managementSystemSeedTokens,
    ...managementSystemLightTokens,
  },
  components: {
    ...managementSystemSeedComponents,
    ...managementSystemLightComponents,
  },
})

export const globalThemeMode = shallowRef<ThemeMode>('light,compact')

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

const modeOwnedTokenKeys = new Set([
  ...Object.keys(managementSystemLightTokens ?? {}),
  ...Object.keys(managementSystemDarkTokens ?? {}),
])

function collectModeOwnedComponentKeys() {
  const owned = new Map<string, Set<string>>()

  for (const layer of [managementSystemLightComponents, managementSystemDarkComponents]) {
    for (const [name, tokens] of Object.entries(layer ?? {})) {
      const keys = owned.get(name) ?? new Set<string>()
      Object.keys(tokens as Record<string, unknown>).forEach((key) => keys.add(key))
      owned.set(name, keys)
    }
  }

  return owned
}

const modeOwnedComponentKeys = collectModeOwnedComponentKeys()

/**
 * 切换明暗模式：整层替换预设的中性色 token（light / dark），
 * 品牌种子 token 与主题编辑器添加的其他 token 保持不变。
 */
export function applyThemeMode(mode: ThemeMode) {
  const dark = mode.includes('dark')
  const current = globalThemeConfig.value

  const token: Record<string, unknown> = { ...(current.token ?? {}) }
  for (const key of modeOwnedTokenKeys) {
    delete token[key]
  }
  Object.assign(token, dark ? managementSystemDarkTokens : managementSystemLightTokens)

  const components: Record<string, Record<string, unknown>> = {}
  for (const [name, value] of Object.entries(current.components ?? {})) {
    components[name] = { ...(value as Record<string, unknown>) }
  }
  for (const [name, owned] of modeOwnedComponentKeys) {
    components[name] ??= {}
    for (const key of owned) {
      delete components[name][key]
    }
  }
  const modeComponents = dark ? managementSystemDarkComponents : managementSystemLightComponents
  for (const [name, value] of Object.entries(modeComponents ?? {})) {
    components[name] = { ...components[name], ...(value as Record<string, unknown>) }
  }

  setGlobalThemeConfig({
    algorithm: getAlgorithmsByMode(mode),
    token,
    components: components as ThemeConfig['components'],
  })

  return globalThemeConfig.value
}
