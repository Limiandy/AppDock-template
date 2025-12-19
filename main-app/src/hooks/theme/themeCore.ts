// themeCore.ts
import { reactive, ref, computed, watch, shallowRef } from 'vue'
import type { SeedToken, MapToken, AliasToken } from 'ant-design-vue/es/theme/interface'
import formatToken from 'ant-design-vue/es/theme/util/alias'
import { type DerivativeFunc, theme } from 'ant-design-vue'
import tinycolor from 'tinycolor2'
import type { TokenKey } from './useTheme.ts'
import merge from 'lodash.merge'

const { defaultSeed, defaultAlgorithm, darkAlgorithm, compactAlgorithm } = theme

// 1. 算法集合
export type AlgorithmName = 'light' | 'dark' | 'compact'

const algorithmMap = {
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

function extractDiffSeedToken(source: SeedToken, aliasToken: Record<string, any>): Partial<SeedToken> {
  const diff: Partial<SeedToken> = {}

  for (const key in source) {
    const defaultValue = source[key as keyof SeedToken]
    const currentValue = aliasToken[key]
    if (!defaultValue) continue
    // aliasToken 里没有这个字段，直接跳过
    if (currentValue === undefined) continue

    // 颜色类型，走颜色等价判断
    if (
      typeof defaultValue === 'string' &&
      typeof currentValue === 'string' &&
      tinycolor(defaultValue).isValid() &&
      tinycolor(currentValue).isValid()
    ) {
      if (!isSameColor(defaultValue, currentValue)) {
        ;(diff as any)[key] = currentValue
      }
      // continue
    }

    // 普通值，直接 !==
    /*if (defaultValue !== currentValue) {
      diff[key as keyof SeedToken] = currentValue
    }*/
  }

  return diff
}

function extractDiffAliasToken(source: AliasToken, aliasToken: Record<string, any>): Partial<SeedToken> {
  const diff: Partial<AliasToken> = {}

  for (const key in aliasToken) {
    if (key === '_hashId' || key === '_tokenKey') continue
    const defaultValue = source[key as keyof SeedToken]
    const currentValue = aliasToken[key]

    if (defaultValue === undefined) {
      ;(diff as any)[key] = currentValue
      continue
    }

    // 颜色类型，走颜色等价判断
    if (
      typeof defaultValue === 'string' &&
      typeof currentValue === 'string' &&
      tinycolor(defaultValue).isValid() &&
      tinycolor(currentValue).isValid()
    ) {
      if (!isSameColor(defaultValue, currentValue)) {
        ;(diff as any)[key] = currentValue
      }
      continue
    }

    // 普通值，直接 !==
    if (defaultValue !== currentValue) {
      diff[key as keyof SeedToken] = currentValue
    }
  }

  return diff
}

export function createThemeCore() {
  const modifiedSeed = reactive<Record<string, any>>({})
  const currentAlgorithm = shallowRef<AlgorithmName[] | null>(null)

  function applyAlgorithms(diffSeedToken: Partial<SeedToken>, algorithms: AlgorithmName[]): MapToken {
    const mergedSeed: SeedToken = {
      ...defaultSeed,
      ...diffSeedToken,
    }

    // 1. 基线：永远只跑一次
    let mapToken = theme.defaultAlgorithm(mergedSeed)

    // 2. 是否暗色
    if (algorithms.includes('dark')) {
      mapToken = theme.darkAlgorithm(mergedSeed, mapToken)
    }

    // 3. 是否紧凑
    if (algorithms.includes('compact')) {
      mapToken = theme.compactAlgorithm(mergedSeed, mapToken)
    }

    return mapToken
  }

  function normalizeAlgorithms(list: AlgorithmName[]): AlgorithmName[] | null {
    const allAlgorithms = Object.keys(algorithmMap)

    const targetNames = list.filter((name) => allAlgorithms.includes(name))
    if (!targetNames.length) return currentAlgorithm.value
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
  const injectAliasToken = ref<AliasToken>({} as AliasToken)
  // 接收来自顶级组件修改后的算法
  const injectDerivatives = ref<DerivativeFunc<any, any>[] | null>(null)

  // 初始化：1. 初始化算法；2.初始化MapToken
  watch(
    injectDerivatives,
    (derivatives) => {
      // 先复制当前算法数组
      const fns: AlgorithmName[] = []

      derivatives!.forEach((fn) => {
        switch (fn.name) {
          case 'derivative':
            fns.push('light')
            break
          case 'derivative2':
            fns.push('dark')
            break
          case 'derivative3':
            fns.push('compact')
            break
          default:
            fns.push('light')
        }
      })

      setAlgorithms(fns)
    },
    { deep: true },
  )

  const cacheDiffSeedToken = computed(() => extractDiffSeedToken(defaultSeed, injectAliasToken.value))

  const cacheDiffAliasToken = computed(() => {
    if (!injectDerivatives.value?.length) return {}
    /**
     * 用被顶层修改过的 seedToken 重新派生 aliasToken，与顶层派生的 aliasToken 进行对比，找出非原始派生的也就是被手动修改存起来
     */
    const mergedSeed: SeedToken = {
      ...defaultSeed,
      ...cacheDiffSeedToken.value,
    }

    let mapToken: MapToken
    for (const fn of injectDerivatives.value) {
      mapToken = fn(mergedSeed)
    }

    return extractDiffAliasToken(formatToken({ ...mapToken!, override: {} }), injectAliasToken.value)
  })

  // 最新的 AliasToken
  const aliasToken = computed<AliasToken>(() => {
    if (!currentAlgorithm.value?.length) return {} as AliasToken
    // 强制读取 modifiedSeed 的每一个 key
    const diffSeedToken: Record<string, any> = {}
    const override: Record<string, any> = {}

    for (const key in modifiedSeed) {
      if (key in defaultSeed) {
        diffSeedToken[key] = modifiedSeed[key]
      } else {
        override[key] = modifiedSeed[key]
      }
    }
    console.log(cacheDiffAliasToken.value)

    const current = applyAlgorithms({ ...cacheDiffSeedToken.value, ...diffSeedToken }, currentAlgorithm.value)
    // 保持顶层非算法派生的值（手动修改的）不变
    return formatToken({ ...current, override: merge(cacheDiffAliasToken.value, override) })
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
    injectDerivatives,
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
