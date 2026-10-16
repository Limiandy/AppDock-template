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
        <SvgIcon name="solar:widget-2-outline" />
        <span v-if="!collapsed" class="basic-layout-sider__logo-text">LOGO</span>
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
          <SvgIcon :name="collapsed ? 'solar:hamburger-menu-outline' : 'solar:sidebar-minimalistic-outline'" />
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
                <SvgIcon :name="action.icon" />
              </button>
            </a-badge>
          </a-tooltip>
          <a-select
            v-if="mockAccess.enabled"
            v-model:value="selectedMockAccessProfileId"
            aria-label="模拟权限身份"
            size="small"
            :dropdown-style="{ zIndex: 9999 }"
            style="width: 190px"
          >
            <a-select-option v-for="profile in mockAccess.profiles" :key="profile.id" :value="profile.id">
              {{ profile.name }} · {{ profile.role }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="currentTheme" size="small" :dropdown-style="{ zIndex: 9999 }" style="width: 120px">
            <a-select-option value="light">亮色</a-select-option>
            <a-select-option value="dark">暗色</a-select-option>
            <a-select-option value="light,compact">亮色+紧凑</a-select-option>
            <a-select-option value="dark,compact">暗色+紧凑</a-select-option>
          </a-select>
          <div class="basic-layout-header__user">
            <a-avatar :size="24" :style="{ backgroundColor: '#546FFD' }">{{ userName.slice(0, 1) }}</a-avatar>
            <span>{{ userName }}</span>
          </div>
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
  { key: 'message', title: '消息', icon: 'app:message' },
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

/** 顶栏高度：Antd 默认由 controlHeight * 2 推导，这里按设计固定为 36px */
const headerHeight = 36

const menus = ref<MenuProps['items']>([])
const siderWidth = 152
const collapsedWidth = 64
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
      background: token.colorBgContainer,
      border: 'none',
      boxShadow: `inset 0 -1px 0 0 ${token.colorSplit}`,
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
      display: 'inline-flex',
      alignItems: 'center',
      gap: `${token.marginXS}px`,
      color: token.colorTextSecondary,
      fontSize: `${token.fontSizeSM}px`,
    },

    '.basic-layout-sider': {
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
        height: `${headerHeight}px`,
        paddingInline: `${token.padding}px`,
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
        color: token.colorText,
        fontSize: `${token.fontSizeLG}px`,
        fontWeight: token.fontWeightStrong,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
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

        [`${rootCls}-menu-item`]: {
          height: `${token.controlHeightLG}px`,
          lineHeight: `${token.controlHeightLG}px`,
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

<style lang="less" scoped>
/* sider */
.basic-layout-sider {
  height: 100%;
}

.basic-layout-sider__logo.is-collapsed {
  justify-content: center;
  padding-inline: 0;
}

/* header */
.basic-layout-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  height: 36px;
  line-height: 36px;
  padding-inline: 16px;
}

.basic-layout-header__controls {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  margin-left: auto;
}

/* content：独立滚动区域 */
.basic-layout-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
}

#qiankun-container {
  width: 100%;
  height: 100%;
}
</style>
