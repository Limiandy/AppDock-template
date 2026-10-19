import { theme } from 'ant-design-vue'

const { defaultAlgorithm, compactAlgorithm } = theme

/** 与 Antd 官方算法同签名（DerivativeFunc<SeedToken, MapToken>） */
type ThemeAlgorithm = typeof compactAlgorithm

/** 紧凑模式的基础字号（设计稿基准）：紧凑只调密度，字号基准为 14px */
const COMPACT_BASE_FONT_SIZE = 14

/** 字号/行高类 token：由基础字号派生，不被紧凑算法改写 */
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
 * 导致紧凑模式下基础字号被压成 12px、且主题里的 fontSize 配置不生效。
 *
 * 这里在 compact 结果之上按「基础字号 14px」重新派生字号/行高，做到：
 * - 控件高度、内外边距等按紧凑缩放（密度）；
 * - 紧凑模式下基础字号为 14px（fontSizeSM 12 / fontSizeLG 16 等自动派生）；
 * - 主题显式配置了 fontSize 时以其为准，主题编辑器里调整字号会整条跟随。
 */
export const compactDensityAlgorithm: ThemeAlgorithm = (seed, mapToken) => {
  const compactMap = compactAlgorithm(seed, mapToken)

  const baseFontSize = typeof seed.fontSize === 'number' && seed.fontSize > 0 ? seed.fontSize : COMPACT_BASE_FONT_SIZE
  const baseMap = defaultAlgorithm({ ...seed, fontSize: baseFontSize }) as unknown as Record<string, unknown>

  const fontTokens: Record<string, unknown> = {}
  for (const key of fontTokenKeys) {
    fontTokens[key] = baseMap[key]
  }

  return { ...compactMap, ...fontTokens } as ReturnType<ThemeAlgorithm>
}

export default compactDensityAlgorithm
