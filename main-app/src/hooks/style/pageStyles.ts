import type { AliasToken } from 'ant-design-vue/es/theme/interface'

/**
 * 原型页面共用的 token 样式片段，保证跨页面视觉一致（全局 UI 风格统一）。
 */

/** 页面级卡片：统一外边距与大圆角 */
export function pageInsetStyles(token: AliasToken) {
  return {
    margin: `${token.margin}px`,
    borderRadius: `${token.borderRadiusLG}px`,
  }
}

/** 筛选行容器 */
export function filterRowStyles(token: AliasToken) {
  return {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: `${token.marginXS}px`,
    paddingBlock: `${token.paddingXS}px`,
  }
}

/** 筛选标签（chip）：默认透明，选中态为主色浅底 + 主色文字 */
export function filterChipStyles(token: AliasToken) {
  return {
    'cursor': 'pointer',
    'marginInlineEnd': 0,
    'paddingInline': `${token.paddingSM}px`,
    'borderColor': 'transparent',
    'background': 'transparent',
    'color': token.colorTextSecondary,

    '&:hover': {
      color: token.colorPrimary,
    },

    '&.is-active': {
      color: token.colorPrimary,
      borderColor: token.colorPrimaryBorder,
      background: token.colorPrimaryBg,
    },
  }
}

/** 列表行通用样式：白底、边框、圆角、hover 阴影 */
export function listRowStyles(token: AliasToken) {
  return {
    'background': token.colorBgContainer,
    'border': `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    'borderRadius': `${token.borderRadiusLG}px`,
    'transition': `box-shadow ${token.motionDurationMid}`,

    '&:hover': {
      boxShadow: token.boxShadowTertiary,
    },
  }
}

/** 行内元信息字段：左标签 + 右内容 */
export function metaFieldStyles(token: AliasToken) {
  return {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginTop: `${token.marginXS}px`,
    fontSize: `${token.fontSizeSM}px`,
  }
}
