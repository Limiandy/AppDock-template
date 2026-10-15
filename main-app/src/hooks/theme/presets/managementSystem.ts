import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'

/**
 * 管理系统设计语言（参考《明源云采购开发商后台管理系统》提炼）。
 *
 * 提取方法、证据与完整 token 表见 docs/design-tokens.md。
 * 注意：当前 Ant Design Vue 4.2 中 Table / Card / Tabs / Segmented / Tag 没有组件级 token，
 * 这些组件的视觉由下面的全局 token（colorFillAlter、colorBorderSecondary、controlItemBgHover 等）派生。
 */
export const managementSystemTokens: ThemeConfig['token'] = {
  // 品牌与功能色
  colorPrimary: '#546FFD',
  colorInfo: '#546FFD',
  colorLink: '#546FFD',
  colorSuccess: '#55C5CD',
  colorWarning: '#FCAF07',
  colorError: '#E5484D',

  // 主色派生（浅底 / 描边 / 交互态）
  colorPrimaryBg: '#EEF1FF',
  colorPrimaryBgHover: '#E4E9FF',
  colorPrimaryBorder: '#D6DDFF',
  colorPrimaryHover: '#6E84FE',
  colorPrimaryActive: '#4761E0',
  colorLinkHover: '#6E84FE',
  colorLinkActive: '#4761E0',

  // 中性色
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

  // 描边与分割
  colorBorder: '#D6DDFF',
  colorBorderSecondary: '#E2E6F5',
  colorSplit: '#E2E6F5',

  // 排版
  fontFamily: `'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif`,
  fontSize: 14,
  fontSizeSM: 12,
  fontSizeLG: 16,
  lineHeight: 1.57,

  // 圆角与控件尺寸
  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 12,
  borderRadiusXS: 4,
  controlHeight: 40,
  controlHeightSM: 32,
  controlHeightLG: 48,

  // 阴影：轻层次，避免重投影
  boxShadow: '0 4px 16px rgba(32, 41, 74, 0.06)',
  boxShadowSecondary: '0 8px 24px rgba(32, 41, 74, 0.12)',
  boxShadowTertiary: '0 2px 8px rgba(32, 41, 74, 0.04)',

  wireframe: false,
}

export const managementSystemComponents: ThemeConfig['components'] = {
  Layout: {
    colorBgHeader: '#FFFFFF',
    colorBgBody: '#F2F5FF',
    colorBgTrigger: '#F2F5FF',
  },
  Menu: {
    itemMarginInline: 8,
    radiusItem: 8,
    radiusSubMenuItem: 8,
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
    colorActiveBarWidth: 3,
    colorActiveBarHeight: 16,
    colorActiveBarBorderSize: 0,
  },
}

export const managementSystemTheme: ThemeConfig = {
  token: managementSystemTokens,
  components: managementSystemComponents,
}

export default managementSystemTheme
