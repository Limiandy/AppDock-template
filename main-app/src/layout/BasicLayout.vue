<template>
  <a-layout v-loading="loading" :class="[scopeClass, className]">
    <!-- Header -->
    <a-layout-header class="basic-layout-header" :class="{ 'is-fixed': fixedHeader }">
      <!-- Logo -->
      <div class="basic-layout-header__logo">LOGO</div>

      <!-- Top Menu -->
      <div v-if="mode !== 'SideMenu'" class="basic-layout-header__menu">
        <a-menu :selected-keys="activeTopKeys" mode="horizontal" :items="topMenus" @click="onTopMenuClick" />
      </div>

      <!-- Dropdown -->
      <div class="basic-layout-header__dropdown">
        <a-select v-model:value="currentTheme" :dropdown-style="{ zIndex: 9999 }" style="width: 120px">
          <a-select-option value="light">亮色</a-select-option>
          <a-select-option value="dark">暗色</a-select-option>
          <a-select-option value="light,compact">亮色+紧凑</a-select-option>
          <a-select-option value="dark,compact">暗色+紧凑</a-select-option>
        </a-select>
      </div>
    </a-layout-header>

    <a-layout v-if="mode !== 'TopMenu'" class="basic-layout-body" :class="{ 'is-fixed-header': fixedHeader }">
      <!-- Sider -->
      <a-layout-sider
        v-if="sideMenusComputed?.length"
        class="basic-layout-sider"
        :class="{ 'is-fixed': fixedSider }"
        :collapsed="collapsed"
        collapsible
        :trigger="null"
        breakpoint="lg"
        @breakpoint="onBreakpoint"
        @collapse="onCollapse"
      >
        <a-menu
          class="basic-layout-sider__menu"
          mode="inline"
          :open-keys="openKeys"
          :selected-keys="selectedKeys"
          :items="sideMenusComputed"
          @click="onSideMenuClick"
        ></a-menu>
        <button
          type="button"
          class="basic-layout-sider__trigger"
          :aria-label="collapsed ? '展开侧边栏' : '折叠侧边栏'"
          :title="collapsed ? '展开侧边栏' : '折叠侧边栏'"
          @click="toggleCollapsed"
        >
          <SvgIcon :name="collapsed ? 'solar:alt-arrow-right-outline' : 'solar:alt-arrow-left-outline'" />
        </button>
      </a-layout-sider>
      <div v-if="fixedSider && sideMenusComputed?.length" style="height: 100%" :style="fixedSiderStyle"></div>

      <!-- Content -->
      <a-layout-content class="basic-layout-content">
        <router-view v-if="isBaseRoutePath" />
        <div v-else id="qiankun-container" />
      </a-layout-content>
    </a-layout>

    <!--    TopMenu   -->
    <a-layout-content
      v-if="mode === 'TopMenu'"
      class="basic-layout-content"
      :class="{ 'is-fixed-header': fixedHeader }"
    >
      <router-view v-if="isBaseRoutePath" />
      <div v-else id="qiankun-container" />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ItemType, type MenuProps } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { SvgIcon } from 'common'
import { constantRoutes, asyncRoutes } from '@/router/BaseAppRoutes.ts'
import { useEvent } from '@/hooks/useEvent.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import {
  getAlgorithmsByMode,
  getModeByThemeConfig,
  globalThemeMode,
  setGlobalThemeConfig,
  type ThemeMode,
} from '@/hooks/theme/themeCore.ts'

const { eventBus } = useEvent()

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
  const themeConfig = {
    algorithm: getAlgorithmsByMode(theme),
  }
  setGlobalThemeConfig(themeConfig)
  eventBus.emit('themeChange', themeConfig, { mode: theme, source: 'layout-theme-select' })
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

const mode = ref<'TopMenu' | 'SideMenu' | 'Mixed'>('Mixed')
const menus = ref<MenuProps['items']>([])
const fixedHeader = ref<boolean>(true)
const fixedSider = ref<boolean>(true)
const siderWidth = ref<number>(200)
const collapsedWidth = ref<number>(80)
const loading = ref<boolean>(false)

const baseAppRoutePaths = getBaseAppRoutePaths(asyncRoutes.concat(constantRoutes))
const isBaseRoutePath = computed(() => {
  return baseAppRoutePaths.includes(route.fullPath)
})

eventBus.on('microLoad', (val: boolean) => {
  loading.value = val
})

const fixedSiderStyle = computed(() => {
  const width = collapsed.value ? collapsedWidth.value : siderWidth.value
  return {
    'flex': `0 0 ${width}px`,
    'max-width': `${width}px`,
    'min-width': `${width}px`,
    'width': `${width}px`,
  }
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

/* ------------------------
   顶部菜单（一级）
   区分是纯 TopMenu 还是 混合模式
------------------------- */
const topMenus = computed(() => {
  if (mode.value === 'Mixed') {
    return menus.value?.map((m: any) => ({
      key: m!.key,
      label: m!.label,
      title: m!.title,
      icon: m!.icon,
    }))
  }

  if (mode.value === 'TopMenu') {
    return menus.value
  }
  return []
})

const activeTopKeys = ref<string[]>(['index'] as string[])

function onTopMenuClick({ key }: any) {
  router.push(key)
}

/* ------------------------
   侧边菜单
------------------------- */
const sideMenusComputed = computed(() => {
  if (mode.value === 'SideMenu') return menus.value

  if (mode.value === 'Mixed') {
    const top = menus.value!.find((m) => m!.key === activeTopKeys.value[0]) as any
    return top?.children || []
  }

  return []
})

/* ------------------------
   选中 / 展开状态
------------------------- */
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

function onSideMenuClick({ key }: any) {
  router.push(key)
}

/* ------------------------
   自动联动路由
------------------------- */
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
  const path = route.path
  const currentMode = mode.value
  if (currentMode === 'TopMenu') {
    activeTopKeys.value = [path]
  }
  if (currentMode === 'SideMenu') {
    const { openKeys: opKeys, selectKeys: stKeys } = getMenuKeys(path)
    openKeys.value = opKeys
    selectedKeys.value = stKeys
  }
  if (currentMode === 'Mixed') {
    const { openKeys: opKeys, selectKeys: stKeys } = getMenuKeys(path)
    activeTopKeys.value = opKeys.splice(0, 1)
    openKeys.value = opKeys
    selectedKeys.value = stKeys
  }
}

/* ------------------------
   样式管理
------------------------- */
const [className, scopeClass] = useStyle('basic-layout', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'
  const siderPadding = token.paddingXS
  const triggerSize = token.controlHeightLG

  return {
    'width': '100%',
    'height': '100%',
    'overflow': 'auto',

    '.basic-layout-header': {
      background: token.colorBgContainer,
      border: 'none',
      boxShadow: `inset 0 -1px 0 0 ${token.colorSplit}`,
    },

    '.basic-layout-body': {
      '&.is-fixed-header': {
        paddingTop: `${48 + token.size}px`,
      },
    },

    '.basic-layout-sider': {
      'background': token.colorBgContainer,
      'borderInlineEnd': `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
      'boxShadow': token.boxShadowTertiary,
      'transition': `background-color ${token.motionDurationMid}, border-color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,

      '&.is-fixed': {
        top: `${48 + token.size}px`,
        bottom: 0,
        height: `calc(100vh - ${48 + token.size}px)`,
      },

      [`${rootCls}-layout-sider-children`]: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        padding: `${siderPadding}px`,
        overflow: 'hidden',
        borderRadius: `${token.borderRadiusLG}px`,
      },

      '.basic-layout-sider__menu': {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
      },

      [`${rootCls}-menu`]: {
        background: 'transparent',
        borderInlineEnd: 0,
        paddingBlock: `${token.paddingXS}px`,

        [`${rootCls}-menu-item`]: {
          height: `${token.controlHeightLG}px`,
          lineHeight: `${token.controlHeightLG}px`,
          marginInline: 0,
          marginBlock: `${token.marginXXS}px`,
          borderRadius: `${token.borderRadius}px`,
          transition: `background-color ${token.motionDurationMid}, color ${token.motionDurationMid}`,
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

      [`${rootCls}-layout-sider-trigger`]: {
        display: 'none',
      },

      '.basic-layout-sider__trigger': {
        'display': 'inline-flex',
        'flexShrink': 0,
        'alignItems': 'center',
        'justifyContent': 'center',
        'width': '100%',
        'height': `${triggerSize}px`,
        'marginTop': `${token.marginXS}px`,
        'lineHeight': `${triggerSize}px`,
        'color': token.colorIcon,
        'background': token.colorFillAlter,
        'border': `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        'borderRadius': `${token.borderRadiusLG}px`,
        'boxShadow': token.boxShadowTertiary,
        'cursor': 'pointer',
        'transition': `color ${token.motionDurationMid}, background-color ${token.motionDurationMid}, border-color ${token.motionDurationMid}, box-shadow ${token.motionDurationMid}`,

        '&:hover': {
          color: token.colorPrimary,
          background: token.colorPrimaryBg,
          borderColor: token.colorPrimaryBorder,
          boxShadow: token.boxShadowSecondary,
        },

        '&:focus-visible': {
          outline: `${token.lineWidth}px ${token.lineType} ${token.colorPrimary}`,
          outlineOffset: `${token.marginXXS}px`,
        },
      },
    },
  }
})
</script>

<style lang="less" scoped>
/* header */
.basic-layout-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-inline: 20px;
  z-index: 100;

  &.is-fixed {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
  }
}

.basic-layout-header__logo {
  width: 200px;
  flex-shrink: 0;
}

.basic-layout-header__menu {
  flex: 1;
}

.basic-layout-header__dropdown {
  flex-shrink: 0;
  margin-left: auto;
}

/* body layout */
.basic-layout-body {
  display: flex;
}

/* sider */
.basic-layout-sider {
  height: 100%;

  &.is-fixed {
    position: fixed;
    left: 0;
    bottom: 0;
  }
}

/* content */
.basic-layout-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

#qiankun-container {
  width: 100%;
  height: 100%;
}
</style>
