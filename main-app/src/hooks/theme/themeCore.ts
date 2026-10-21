import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { shallowRef } from 'vue'
import compactFontsAlgorithm from './compactDensityAlgorithm'
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
  // 密度用 Antd 内置 compact 算法（主题编辑器的密度开关按它判断）
  compact: compactAlgorithm,
}

/**
 * 全局默认主题：基于 managementSystem 预设（docs/design-tokens.md）。
 * 明暗切换由 applyThemeMode 整层替换中性色，编辑器的自定义 token 会被保留。
 */
export const globalThemeConfig = shallowRef<ThemeConfig>({
  // 默认全局紧凑：密度由 compact 算法决定，字号由设计 token 决定
  algorithm: [defaultAlgorithm, compactAlgorithm, compactFontsAlgorithm],
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
  const algorithms = mode.split(',').map((name) => algorithmMap[name as AlgorithmName])

  // 紧凑模式下在 Antd compact 之后再恢复字号，保证基础字号仍是 14px
  return mode.includes('compact') ? [...algorithms, compactFontsAlgorithm] : algorithms
}

/** 只要包含紧凑算法，就确保字号恢复算法排在最后 */
function normalizeAlgorithms(algorithm: ThemeConfig['algorithm']) {
  const algorithms = Array.isArray(algorithm) ? algorithm : algorithm ? [algorithm] : []

  if (algorithms.includes(compactAlgorithm) && !algorithms.includes(compactFontsAlgorithm)) {
    return [...algorithms, compactFontsAlgorithm]
  }

  return algorithm
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
    algorithm: normalizeAlgorithms(config.algorithm),
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
