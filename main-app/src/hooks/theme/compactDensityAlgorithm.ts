import { theme } from 'ant-design-vue'

const { defaultAlgorithm } = theme

/** 与 Antd 官方算法同签名（DerivativeFunc<SeedToken, MapToken>） */
type ThemeAlgorithm = typeof theme.compactAlgorithm

/** 字号/行高类 token：紧凑模式下必须回到设计 token 的取值 */
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
 * 紧凑模式的「字号恢复」算法（必须放在 Antd compactAlgorithm 之后执行）。
 *
 * 背景：Antd 自带的 compactAlgorithm 会以 fontSizeSM 为基准重算整条字号阶，
 * 导致紧凑模式下基础字号被压到 12px、主题里的 fontSize 配置不生效。
 *
 * 该算法只做一件事：把字号/行高 token 恢复为 seed 派生值，
 * 密度（控件高度、内外边距）仍由 Antd compactAlgorithm 决定，因此：
 * - 紧凑模式下基础字号保持在设计稿的 14px（fontSizeSM 12 / fontSizeLG 16 自动派生）；
 * - 主题显式配置 fontSize 时整条字号阶跟随；
 * - 编辑器按内置 compactAlgorithm 判断密度开关，显示与实际一致。
 */
export const compactFontsAlgorithm: ThemeAlgorithm = (seed, mapToken) => {
  const mergedMap = (mapToken ?? defaultAlgorithm(seed)) as unknown as Record<string, unknown>
  const baseMap = defaultAlgorithm(seed) as unknown as Record<string, unknown>

  const fontTokens: Record<string, unknown> = {}
  for (const key of fontTokenKeys) {
    fontTokens[key] = baseMap[key]
  }

  return { ...mergedMap, ...fontTokens } as unknown as ReturnType<ThemeAlgorithm>
}

export default compactFontsAlgorithm
