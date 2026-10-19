import { theme } from 'ant-design-vue'

const { defaultAlgorithm, compactAlgorithm } = theme

/** 与 Antd 官方算法同签名（DerivativeFunc<SeedToken, MapToken>） */
type ThemeAlgorithm = typeof compactAlgorithm

/** 字号/行高类 token：这些必须由设计 token（seed）决定，不能被紧凑算法改写 */
const fontTokenKeys = [
  'fontSize',
  'fontSizeSM',
  'fontSizeLG',
  'fontSizeXL',
  'fontSizeHeading1',
  'fontSizeHeading2',
  'fontSizeHeading3',
  'fontSizeHeading4',
  'fontSizeHeading5',
  'lineHeight',
  'lineHeightSM',
  'lineHeightLG',
  'lineHeightHeading1',
  'lineHeightHeading2',
  'lineHeightHeading3',
  'lineHeightHeading4',
  'lineHeightHeading5',
] as const

/**
 * 紧凑算法（只负责密度）：
 * Antd 自带的 compactAlgorithm 会以 fontSizeSM 为基准重算整条字号阶，
 * 导致主题里的 fontSize 配置不生效（字号被“锁死”）。
 * 这里在 compact 结果之上恢复由 seed 派生的字号/行高，做到：
 * - 控件高度、内外边距等按紧凑缩放；
 * - 字号仍响应主题的 fontSize / fontSizeSM / fontSizeLG 配置。
 */
export const compactDensityAlgorithm: ThemeAlgorithm = (seed, mapToken) => {
  const compactMap = compactAlgorithm(seed, mapToken)
  const baseMap = defaultAlgorithm(seed) as unknown as Record<string, unknown>

  const fontTokens: Record<string, unknown> = {}
  for (const key of fontTokenKeys) {
    fontTokens[key] = baseMap[key]
  }

  return { ...compactMap, ...fontTokens } as ReturnType<ThemeAlgorithm>
}

export default compactDensityAlgorithm
