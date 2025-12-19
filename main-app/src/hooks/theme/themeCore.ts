import { computed, reactive, ref, watch } from 'vue'
import type { AliasToken, MapToken, SeedToken } from 'ant-design-vue/es/theme/interface'
import formatToken from 'ant-design-vue/es/theme/util/alias'
import { type DerivativeFunc, theme } from 'ant-design-vue'
import tinycolor from 'tinycolor2'
import type { TokenKey } from './useTheme.ts'
import { useConfigContextInject } from 'ant-design-vue/es/config-provider/context'

const { defaultSeed, defaultAlgorithm, darkAlgorithm, compactAlgorithm } = theme

// 1. 算法集合
export type AlgorithmName = 'light' | 'dark' | 'compact'

export const algorithmMap = {
  light: defaultAlgorithm,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
}

function isSameColor(a: string, b: string): boolean {
  const c1 = tinycolor(a).toRgb()
  const c2 = tinycolor(b).toRgb()

  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a
}

function isColor(value: any): boolean {
  return typeof value === 'string' && tinycolor(value).isValid()
}

type ThemeConfig = {
  token: Partial<SeedToken>
  components: Record<string, AliasToken>
  algorithm: DerivativeFunc<SeedToken, MapToken> | DerivativeFunc<SeedToken, MapToken>[]
}

function getDesignToken(config: ThemeConfig = {} as ThemeConfig): AliasToken {
  const seedToken = { ...defaultSeed, ...config.token }
  const mapFn = config.algorithm ?? theme.defaultAlgorithm
  const mapToken = Array.isArray(mapFn)
    ? mapFn.reduce<MapToken>((result, fn) => fn(seedToken, result), undefined as any)
    : mapFn(seedToken)
  const mergedMapToken = {
    ...mapToken,
    ...config.components,
    override: config.token ?? {},
  }
  return formatToken(mergedMapToken)
}

export function createThemeCore() {
  const parentContext = useConfigContextInject()

  const modifiedSeed = reactive<Record<string, any>>({})

  const currentAlgorithm = ref<AlgorithmName[]>()

  watch(
    () => parentContext.theme?.value,
    (parentTheme) => {
      if (!parentTheme) {
        currentAlgorithm.value = ['light']
        return
      }
      if (Array.isArray(parentTheme.algorithm)) {
        currentAlgorithm.value = parentTheme.algorithm.map((fn) => {
          if (fn.name === 'derivative2') return 'dark'
          if (fn.name === 'derivative3') return 'compact'
          return 'light'
        })
        return
      }
      const fn = parentTheme.algorithm
      if (fn?.name === 'derivative2') {
        currentAlgorithm.value = ['dark']
        return
      }
      if (fn?.name === 'derivative3') {
        currentAlgorithm.value = ['compact']
        return
      }
      currentAlgorithm.value = ['light']
    },
    { deep: true, immediate: true },
  )

  function normalizeAlgorithms(list: AlgorithmName[]): AlgorithmName[] {
    const allAlgorithms = Object.keys(algorithmMap)

    const targetNames = list.filter((name) => allAlgorithms.includes(name))
    if (!targetNames.length) return ['light']
    const lightIndex = targetNames.indexOf('light')
    const darkIndex = targetNames.indexOf('dark')

    if (lightIndex > -1 && darkIndex > -1) {
      targetNames.splice(Math.max(lightIndex, darkIndex), 1)
    }

    return targetNames
  }

  function setAlgorithms(list: AlgorithmName[]) {
    currentAlgorithm.value = normalizeAlgorithms(Array.from(new Set(list)))
  }

  // 接收来自顶级组件修改后的样式
  const injectAliasToken = computed<AliasToken>(() => {
    const parentTheme = parentContext.theme?.value
    if (!parentTheme) return {} as AliasToken

    return getDesignToken(parentTheme as ThemeConfig)
  })

  // 最新的 AliasToken
  const aliasToken = computed<AliasToken>(() => {
    if (!currentAlgorithm.value?.length) return {} as AliasToken

    const algorithm = currentAlgorithm.value.map((name) => algorithmMap[name])

    const config: ThemeConfig = {
      token: { ...parentContext.theme?.value?.token, ...modifiedSeed },
      components: {},
      algorithm,
    }

    return getDesignToken(config)
  })

  function getToken(key: keyof AliasToken) {
    return aliasToken.value[key]
  }

  function setToken(key: keyof AliasToken, value: any) {
    const defaultValue = injectAliasToken.value[key]

    if (isColor(value) && isSameColor(value, defaultValue as string)) {
      // 如果恢复成默认值，从 diff 中删掉
      delete modifiedSeed[key as string]
    } else if (value === defaultValue) {
      delete modifiedSeed[key as string]
    } else {
      modifiedSeed[key as string] = value
    }
  }

  function isModified(key: keyof AliasToken) {
    return key in modifiedSeed
  }

  // 重置指定 key 为初始值
  function resetSeedToken(key: TokenKey) {
    if (key in injectAliasToken.value) {
      delete modifiedSeed[key as string]
    }
  }

  return {
    injectAliasToken,
    currentAlgorithm,
    aliasToken,
    getToken,
    setToken,
    isModified,
    setAlgorithms,
    resetSeedToken,
    isSameColor,
    isColor,
  }
}
