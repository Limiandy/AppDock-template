import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

/**
 * 管理系统设计语言（参考《明源云采购开发商后台管理系统》提炼）。
 *
 * 提取方法与证据见 docs/design-tokens.md。token 分三层：
 * - seed：与明暗无关的品牌色、排版、几何、控件尺寸
 * - light / dark：中性层，由 applyThemeMode 在切换明暗时整层替换
 * - components：组件 token，同样区分通用层与明暗层
 *
 * 注意：当前 Ant Design Vue 4.2 中 Table / Card / Tabs / Segmented / Tag 没有组件级 token，
 * 这些组件的视觉由全局 token（colorFillAlter、colorBorderSecondary、controlItemBgHover 等）派生。
 */

/** 与明暗无关：品牌与功能色、排版、圆角、控件尺寸 */
export const managementSystemSeedTokens: ThemeConfig['token'] = {
  // 品牌与功能色
  colorPrimary: '#546FFD',
  colorInfo: '#546FFD',
  colorLink: '#546FFD',
  colorSuccess: '#55C5CD',
  colorWarning: '#FCAF07',
  colorError: '#E5484D',
  colorPrimaryHover: '#6E84FE',
  colorPrimaryActive: '#4761E0',
  colorLinkHover: '#6E84FE',
  colorLinkActive: '#4761E0',

  // 排版：字体栈与字号阶来自设计稿（docs/design-tokens.md），保留为 token；
  // 控件高度/内外边距不写死，交给 Antd 算法（含 compact）派生。
  fontFamily: `'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif`,
  fontSize: 14,
  // 说明：compact 算法会以 fontSizeSM 为基准重算基础字号（compact 下基础字号 = 12），
  // 这里保持 12，避免出现「辅助文字比正文还大」的倒挂；字号阶仍来自设计稿。
  fontSizeSM: 12,
  fontSizeLG: 16,
  lineHeight: 1.57,

  // 圆角属于设计语言，保留显式取值
  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 12,
  borderRadiusXS: 4,

  wireframe: false,
}

/** 浅色中性层（设计稿原始色板） */
export const managementSystemLightTokens: ThemeConfig['token'] = {
  colorTextBase: '#20294A',
  colorText: '#18191E',
  colorTextSecondary: '#596078',
  colorTextTertiary: '#A6ADC4',
  colorTextQuaternary: '#C3C8D9',
  colorBgBase: '#FFFFFF',
  colorBgLayout: '#F2F5FF',
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#FFFFFF',
  colorFillAlter: '#F7F8FC',
  colorFillTertiary: '#F5F7FF',
  controlItemBgHover: '#F5F7FF',
  controlItemBgActive: '#EEF1FF',
  colorBorder: '#D6DDFF',
  colorBorderSecondary: '#E2E6F5',
  colorSplit: '#E2E6F5',
  colorPrimaryBg: '#EEF1FF',
  colorPrimaryBgHover: '#E4E9FF',
  colorPrimaryBorder: '#D6DDFF',
  boxShadow: '0 4px 16px rgba(32, 41, 74, 0.06)',
  boxShadowSecondary: '0 8px 24px rgba(32, 41, 74, 0.12)',
  boxShadowTertiary: '0 2px 8px rgba(32, 41, 74, 0.04)',
}

/** 深色中性层：参考作品未覆盖暗色，按同色相蓝灰阶扩展（docs/design-tokens.md §8） */
export const managementSystemDarkTokens: ThemeConfig['token'] = {
  colorTextBase: '#E9ECF8',
  colorText: '#E9ECF8',
  colorTextSecondary: '#A6ADC4',
  colorTextTertiary: '#7B84A3',
  colorTextQuaternary: '#596078',
  colorBgBase: '#0B0F1C',
  colorBgLayout: '#0E1322',
  colorBgContainer: '#151A2E',
  colorBgElevated: '#1A2140',
  colorFillAlter: '#1A2140',
  colorFillTertiary: '#1E2544',
  controlItemBgHover: '#1E2544',
  controlItemBgActive: '#25305C',
  colorBorder: '#2C3556',
  colorBorderSecondary: '#232C4A',
  colorSplit: '#232C4A',
  colorPrimaryBg: '#1C2750',
  colorPrimaryBgHover: '#243162',
  colorPrimaryBorder: '#3848A0',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.45)',
  boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.55)',
  boxShadowTertiary: '0 2px 8px rgba(0, 0, 0, 0.35)',
}

/** 与明暗无关的组件 token */
export const managementSystemSeedComponents: ThemeConfig['components'] = {
  Menu: {
    itemMarginInline: 8,
    radiusItem: 8,
    radiusSubMenuItem: 8,
    colorActiveBarWidth: 3,
    colorActiveBarHeight: 16,
    colorActiveBarBorderSize: 0,
  },
}

/** 浅色组件 token */
export const managementSystemLightComponents: ThemeConfig['components'] = {
  Layout: {
    colorBgHeader: '#FFFFFF',
    colorBgBody: '#F2F5FF',
    colorBgTrigger: '#F2F5FF',
  },
  Menu: {
    colorGroupTitle: '#A6ADC4',
    colorItemBg: 'transparent',
    colorItemBgHover: '#F5F7FF',
    colorSubItemBg: 'transparent',
    colorItemBgSelected: '#EEF1FF',
    colorItemBgSelectedHorizontal: 'transparent',
    colorItemText: '#20294A',
    colorItemTextHover: '#546FFD',
    colorItemTextHoverHorizontal: '#546FFD',
    colorItemTextSelected: '#546FFD',
    colorItemTextSelectedHorizontal: '#546FFD',
  },
}

/** 深色组件 token（Layout 交给 darkAlgorithm 派生） */
export const managementSystemDarkComponents: ThemeConfig['components'] = {
  Menu: {
    colorGroupTitle: '#7B84A3',
    colorItemBg: 'transparent',
    colorItemBgHover: '#1E2544',
    colorSubItemBg: 'transparent',
    colorItemBgSelected: '#25305C',
    colorItemBgSelectedHorizontal: 'transparent',
    colorItemText: '#E9ECF8',
    colorItemTextHover: '#8FA2FF',
    colorItemTextHoverHorizontal: '#8FA2FF',
    colorItemTextSelected: '#8FA2FF',
    colorItemTextSelectedHorizontal: '#8FA2FF',
  },
}

/** 组装完整主题配置（默认浅色；暗色仅替换中性层与组件层） */
export function getManagementSystemTheme(options: { dark?: boolean } = {}): ThemeConfig {
  const dark = options.dark ?? false

  return {
    token: {
      ...managementSystemSeedTokens,
      ...(dark ? managementSystemDarkTokens : managementSystemLightTokens),
    },
    components: {
      ...managementSystemSeedComponents,
      ...(dark ? managementSystemDarkComponents : managementSystemLightComponents),
    },
  }
}

/** 默认（浅色）主题配置 */
export const managementSystemTheme: ThemeConfig = getManagementSystemTheme()

export default managementSystemTheme
