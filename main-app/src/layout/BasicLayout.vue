<template>
  <a-layout v-loading="loading" :class="[scopeClass, className]">
    <!-- Sider：整高，顶部 Logo + 菜单，跟随参考稿 -->
    <a-layout-sider
      v-if="hasMenus"
      class="basic-layout-sider"
      :collapsed="collapsed"
      collapsible
      :trigger="null"
      :width="siderWidth"
      :collapsed-width="collapsedWidth"
      breakpoint="lg"
      @breakpoint="onBreakpoint"
      @collapse="onCollapse"
    >
      <div class="basic-layout-sider__logo" :class="{ 'is-collapsed': collapsed }">
        <SvgIcon name="app:logo" width="24px" height="24px" />
        <span v-if="!collapsed" class="basic-layout-sider__logo-text">AppDock</span>
      </div>
      <a-menu
        class="basic-layout-sider__menu"
        mode="inline"
        :inline-indent="16"
        :open-keys="openKeys"
        :selected-keys="selectedKeys"
        :items="menus"
        @click="onSideMenuClick"
      />
    </a-layout-sider>

    <a-layout class="basic-layout-body">
      <!-- Header：折叠按钮 + 当前位置 + 右侧控件 -->
      <a-layout-header class="basic-layout-header">
        <button
          v-if="hasMenus"
          type="button"
          class="basic-layout-header__collapse"
          :aria-label="collapsed ? '展开菜单' : '折叠菜单'"
          :title="collapsed ? '展开菜单' : '折叠菜单'"
          @click="toggleCollapsed"
        >
          <SvgIcon
            :name="collapsed ? 'solar:hamburger-menu-outline' : 'solar:sidebar-minimalistic-outline'"
            width="18px"
            height="18px"
          />
        </button>

        <BasicLayoutBreadcrumb />

        <div class="basic-layout-header__controls">
          <a-tooltip v-for="action in headerActions" :key="action.key" :title="action.title">
            <a-badge :dot="action.key === 'message'" :offset="[-2, 2]">
              <button
                type="button"
                class="basic-layout-header__action"
                :aria-label="action.title"
                @click="onHeaderAction(action)"
              >
                <SvgIcon :name="action.icon" width="18px" height="18px" />
              </button>
            </a-badge>
          </a-tooltip>
          <a-tooltip :title="isDark ? '切换为亮色' : '切换为暗色'">
            <a-switch
              :checked="isDark"
              class="basic-layout-header__theme"
              size="small"
              :aria-label="isDark ? '切换为亮色' : '切换为暗色'"
              @change="onThemeSwitch"
            >
              <template #checkedChildren><SvgIcon name="solar:moon-outline" /></template>
              <template #unCheckedChildren><SvgIcon name="solar:sun-outline" /></template>
            </a-switch>
          </a-tooltip>

          <a-dropdown placement="bottomRight" :trigger="['click']">
            <div class="basic-layout-header__user" role="button" tabindex="0">
              <a-avatar :size="24" :style="{ backgroundColor: '#546FFD' }">{{ userName.slice(0, 1) }}</a-avatar>
              <span>{{ userName }}</span>
            </div>
            <template #overlay>
              <a-menu :selected-keys="userMenuSelectedKeys" @click="onUserMenuClick">
                <a-menu-item v-if="mockAccess.enabled" key="mock-title" disabled>切换模拟身份</a-menu-item>
                <a-menu-item v-for="profile in mockAccess.profiles" :key="`profile:${profile.id}`">
                  {{ profile.name }} · {{ profile.role }}
                </a-menu-item>
                <a-menu-divider v-if="mockAccess.enabled" />
                <a-menu-item key="profile">个人设置</a-menu-item>
                <a-menu-item key="logout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- Content：独立滚动，基座页面与 qiankun 容器二选一 -->
      <a-layout-content class="basic-layout-content">
        <router-view v-if="isBaseRoutePath" />
        <div v-else id="qiankun-container" />
      </a-layout-content>
    </a-layout>

    <a-float-button-group
      v-if="isDevelopment"
      trigger="click"
      type="primary"
      :style="{ insetInlineEnd: '24px', bottom: '24px' }"
    >
      <template #icon>
        <SvgIcon name="solar:dumbbell-large-minimalistic-outline" />
      </template>
      <a-float-button
        v-for="entry in baseAppDevEntries"
        :key="entry.path"
        :tooltip="entry.title"
        @click="onBaseAppEntryClick(entry.path)"
      >
        <template #icon>
          <SvgIcon :name="entry.icon" />
        </template>
      </a-float-button>
    </a-float-button-group>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, h, ref, toRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ItemType, type MenuProps } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { SvgIcon } from 'common'
import { useMockAccess } from '@/access.ts'
import BasicLayoutBreadcrumb from '@/layout/BasicLayoutBreadcrumb.vue'
import { useGlobalStore } from '@/store/modules/global.ts'
import { baseAppDevEntries, constantRoutes, asyncRoutes } from '@/router/BaseAppRoutes.ts'
import { useEvent } from '@/hooks/useEvent.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import { applyThemeMode, getModeByThemeConfig, globalThemeMode, type ThemeMode } from '@/hooks/theme/themeCore.ts'

const { eventBus } = useEvent()
const isDevelopment = import.meta.env.DEV
const mockAccess = useMockAccess()
const global = useGlobalStore()

const headerActions = [
  { key: 'home', title: '回到首页', icon: 'app:home', path: '/workbench' },
  { key: 'mobile', title: '移动端', icon: 'app:mobile' },
  { key: 'help', title: '帮助', icon: 'app:help' },
  { key: 'message', title: '消息', icon: 'app:message', path: '/message' },
]

function onHeaderAction(action: (typeof headerActions)[number]) {
  if (action.path) {
    router.push(action.path)
    return
  }
  global.message.info(`原型演示：${action.title}`)
}

const selectedMockAccessProfileId = computed({
  get: () => mockAccess.currentProfile.value?.id,
  set: (profileId: string) => mockAccess.selectProfile(profileId),
})

const userName = computed(() => (mockAccess.enabled ? (mockAccess.currentProfile.value?.name ?? '未登录') : '未登录'))

const isDark = computed(() => currentTheme.value.includes('dark'))

const userMenuSelectedKeys = computed(() =>
  selectedMockAccessProfileId.value ? [`profile:${selectedMockAccessProfileId.value}`] : [],
)

function onThemeSwitch(checked: boolean | string | number) {
  const compact = currentTheme.value.includes('compact')
  const dark = Boolean(checked)
  currentTheme.value = dark ? (compact ? 'dark,compact' : 'dark') : compact ? 'light,compact' : 'light'
}

function onUserMenuClick({ key }: { key: string | number }) {
  const menuKey = String(key)

  if (menuKey.startsWith('profile:')) {
    mockAccess.selectProfile(menuKey.slice('profile:'.length))
    return
  }

  if (menuKey === 'profile') {
    router.push('/profile')
    return
  }

  if (menuKey === 'logout') {
    global.message.info('原型演示：退出登录')
  }
}

function normalizePath(parent: string, path: string): string {
  if (!parent) return path.startsWith('/') ? path : '/' + path
  if (path.startsWith('/')) return path
  return `${parent.replace(/\/$/, '')}/${path}`
}

function getBaseAppRoutePaths(routes: any[], parentPath = ''): string[] {
  const paths: string[] = []

  routes.forEach((r) => {
    if (r.path === '/' || r.path === '/:catchAll(.*)') return

    const fullPath = normalizePath(parentPath, r.path)

    // 先把父路径加入
    paths.push(fullPath)

    // 再递归处理子路由
    if (r.children && r.children.length > 0) {
      paths.push(...getBaseAppRoutePaths(r.children, fullPath))
    }
  })

  return paths
}

/**
 * 主题切换
 */
const currentTheme = ref<ThemeMode>(globalThemeMode.value)
watch(currentTheme, (theme) => {
  const themeConfig = applyThemeMode(theme)
  eventBus.emit('themeChange', toRaw(themeConfig), { mode: theme, source: 'layout-theme-select' })
})

eventBus.on('themeChange', (themeConfig: ThemeConfig, info?: { mode?: ThemeMode; source?: string }) => {
  const nextMode = info?.mode ?? getModeByThemeConfig(themeConfig)
  if (currentTheme.value !== nextMode) {
    currentTheme.value = nextMode
  }
})

/**
 * 将路由数组转换为 menus 数组
 */
function routesToMenu(routes: any[], parentPath = ''): MenuProps['items'] {
  return routes
    .filter((r) => r.path !== '/' && r.path !== '/:catchAll(.*)') // 可过滤根路由和 404
    .filter((r) => !r.meta?.hideInMenu)
    .filter((r) => r.path.split('/').filter(Boolean).length === 1)
    .map((r) => {
      const fullPath = normalizePath(parentPath, r.path)
      const item: ItemType = {
        key: fullPath,
        title: r.meta?.title || '',
        label: r.meta?.title || '',
        icon: r.meta?.icon ? h(SvgIcon, { name: r.meta.icon }) : undefined,
      }

      if (r.children && r.children.length > 0) {
        ;(item as any)!.children = routesToMenu(r.children, fullPath)
      }

      return item
    })
}

/** 布局尺寸随主题密度变化：紧凑模式用 152/64/36，常规模式放大到 200/80/48 */
const isCompactMode = computed(() => globalThemeMode.value.includes('compact'))

const layoutMetrics = computed(() =>
  isCompactMode.value ? { header: 36, sider: 152, collapsed: 64 } : { header: 48, sider: 200, collapsed: 80 },
)

const headerHeight = computed(() => layoutMetrics.value.header)
const siderWidth = computed(() => layoutMetrics.value.sider)
const collapsedWidth = computed(() => layoutMetrics.value.collapsed)

const menus = ref<MenuProps['items']>([])
const loading = ref<boolean>(false)
const hasMenus = computed(() => Boolean(menus.value?.length))

const baseAppRoutePaths = getBaseAppRoutePaths(asyncRoutes.concat(constantRoutes))
const isBaseRoutePath = computed(() => {
  return baseAppRoutePaths.includes(route.fullPath)
})

eventBus.on('microLoad', (val: boolean) => {
  loading.value = val
})

const route = useRoute()
const router = useRouter()

menus.value = routesToMenu(router.getRoutes()) ?? ([] as MenuProps['items'])

/* ------------------------
   折叠状态 + 持久化
------------------------- */
const collapsed = ref(localStorage.getItem('layout-collapsed') === '1')
watch(collapsed, (v) => {
  localStorage.setItem('layout-collapsed', v ? '1' : '0')
})

function onCollapse(v: boolean) {
  collapsed.value = v
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value
}

function onBreakpoint(v: boolean) {
  collapsed.value = v
}

function onBaseAppEntryClick(path: string) {
  router.push(path)
}

/* ------------------------
   菜单选中 / 展开状态
------------------------- */
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

function onSideMenuClick({ key }: any) {
  router.push(key)
}

watch(
  () => route.fullPath,
  () => syncMenuByRoute(),
  { immediate: true },
)

function getMenuKeys(path: string) {
  const segments = path.split('/').filter(Boolean) // 去掉空段
  const openKeys: string[] = []

  // 如果只有一段（/second-app），也要把第一段作为 openKey
  const maxIndex = Math.max(1, segments.length - 1)

  for (let i = 0; i < maxIndex; i++) {
    const full = '/' + segments.slice(0, i + 1).join('/')
    openKeys.push(full)
  }

  const selectKeys = [path]
  return { openKeys, selectKeys }
}

function syncMenuByRoute() {
  const { openKeys: opKeys, selectKeys: stKeys } = getMenuKeys(route.path)
  openKeys.value = opKeys
  selectedKeys.value = stKeys
}

/* ------------------------
   样式管理
------------------------- */
const [className, scopeClass] = useStyle('basic-layout', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'
  const siderPadding = token.paddingXS

  return {
    'width': '100%',
    'height': '100%',
    'overflow': 'hidden',

    '.basic-layout-header': {
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      gap: `${token.marginSM}px`,
      height: `${headerHeight.value}px`,
      lineHeight: `${headerHeight.value}px`,
      paddingInline: `${token.padding}px`,
      background: token.colorBgContainer,
      border: 'none',
      boxShadow: `inset 0 -1px 0 0 ${token.colorSplit}`,
    },

    '.basic-layout-header__controls': {
      display: 'flex',
      flexShrink: 0,
      alignItems: 'center',
      gap: `${token.marginSM}px`,
      marginInlineStart: 'auto',
    },

    '.basic-layout-header__collapse': {
      'display': 'inline-flex',
      'flexShrink': 0,
      'alignItems': 'center',
      'justifyContent': 'center',
      'width': `${token.controlHeightSM}px`,
      'height': `${token.controlHeightSM}px`,
      'color': token.colorIcon,
      'background': 'transparent',
      'border': 'none',
      'borderRadius': `${token.borderRadius}px`,
      'cursor': 'pointer',
      'transition': `color ${token.motionDurationMid}, background-color ${token.motionDurationMid}`,

      '&:hover': {
        color: token.colorPrimary,
        background: token.colorFillTertiary,
      },

      '&:focus-visible': {
        outline: `${token.lineWidth}px ${token.lineType} ${token.colorPrimary}`,
        outlineOffset: `${token.marginXXS}px`,
      },
    },

    '.basic-layout-header__action': {
      'display': 'inline-flex',
      'alignItems': 'center',
      'justifyContent': 'center',
      'width': `${token.controlHeightSM}px`,
      'height': `${token.controlHeightSM}px`,
      'padding': 0,
      'color': token.colorIcon,
      'background': 'transparent',
      'border': 'none',
      'borderRadius': `${token.borderRadius}px`,
      'cursor': 'pointer',
      'transition': `color ${token.motionDurationMid}, background-color ${token.motionDurationMid}`,

      '&:hover': {
        color: token.colorPrimary,
        background: token.colorFillTertiary,
      },
    },

    '.basic-layout-header__user': {
      'display': 'inline-flex',
      'alignItems': 'center',
      'gap': `${token.marginXS}px`,
      'paddingInline': `${token.paddingXS}px`,
      'height': `${token.controlHeightSM}px`,
      'color': token.colorTextSecondary,
      'fontSize': `${token.fontSizeSM}px`,
      'borderRadius': `${token.borderRadius}px`,
      'cursor': 'pointer',
      'transition': `background-color ${token.motionDurationMid}, color ${token.motionDurationMid}`,

      '&:hover': {
        color: token.colorPrimary,
        background: token.colorFillTertiary,
      },
    },

    '.basic-layout-header__theme': {
      margin: 0,
    },

    '.basic-layout-content': {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      overflow: 'auto',
    },

    '#qiankun-container': {
      width: '100%',
      height: '100%',
    },

    '.basic-layout-sider__logo.is-collapsed': {
      justifyContent: 'center',
      paddingInline: 0,
    },

    '.basic-layout-sider': {
      'height': '100%',
      'background': token.colorBgContainer,
      'borderInlineEnd': `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,

      [`${rootCls}-layout-sider-children`]: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
      },

      '.basic-layout-sider__logo': {
        display: 'flex',
        flexShrink: 0,
        alignItems: 'center',
        gap: `${token.marginXS}px`,
        height: `${headerHeight.value}px`,
        // 与一级菜单图标左对齐（菜单容器 8px + 菜单项 16px）
        paddingInline: `${token.paddingLG}px`,
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        color: token.colorText,
        fontSize: `${token.fontSizeLG}px`,
        fontWeight: token.fontWeightStrong,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      },

      '.basic-layout-sider__logo-text': {
        'fontSize': `${token.fontSizeLG + 1}px`,
        'fontWeight': 800,
        'fontStyle': 'italic',
        'letterSpacing': '-0.3px',
        'paddingInlineEnd': '2px',
        'background': 'linear-gradient(92deg, #546FFD 0%, #6C5EE7 46%, #F85300 100%)',
        'backgroundClip': 'text',
        '-webkit-background-clip': 'text',
        'color': 'transparent',
        'transform': 'skewX(-6deg)',
        'transformOrigin': 'left center',
      },

      '.basic-layout-sider__menu': {
        flex: 1,
        minHeight: 0,
        padding: `${siderPadding}px`,
        overflowY: 'auto',
      },

      [`${rootCls}-menu`]: {
        background: 'transparent',
        borderInlineEnd: 0,
        paddingBlock: `${token.paddingXS}px`,
        // 与面包屑/正文同字号（随密度变化：紧凑 14 / 常规 16）
        fontSize: `${token.fontSize}px`,

        [`${rootCls}-menu-item`]: {
          // 行高 = 控件高 + 内距，随主题密度缩放，避免写死数值
          height: `${token.controlHeight + token.padding}px`,
          lineHeight: `${token.controlHeight + token.padding}px`,
          marginInline: 0,
          marginBlock: `${token.marginXXS}px`,
          // 参考稿侧栏仅 152px：压缩右内边距，保证中文菜单不截断
          paddingInlineEnd: `${token.paddingSM}px`,
          borderRadius: `${token.borderRadius}px`,
          transition: `background-color ${token.motionDurationMid}, color ${token.motionDurationMid}`,
        },

        [`${rootCls}-menu-title-content`]: {
          // antd 默认图标后间距 18px，窄侧栏下调小
          marginInlineStart: `${token.marginXS}px`,
        },

        [`${rootCls}-menu-submenu-title`]: {
          // 与普通菜单项保持同一左轴：Antd 默认给子菜单标题 4px 横向 margin，这里清零
          marginInline: 0,
          paddingInlineEnd: `${token.paddingSM}px`,
        },

        [`${rootCls}-menu-item-selected`]: {
          fontWeight: token.fontWeightStrong,
          backgroundColor: token.colorPrimaryBg,
          color: token.colorPrimary,
        },

        [`${rootCls}-menu-item:not(${rootCls}-menu-item-selected):hover`]: {
          backgroundColor: token.colorFillTertiary,
        },

        [`${rootCls}-menu-item-icon`]: {
          color: 'inherit',
        },
      },
    },
  }
})
</script>
