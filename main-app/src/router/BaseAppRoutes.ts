import type { RouteRecordRaw } from 'vue-router'

export const baseAppDevEntries = [
  { path: '/base-app/icons', title: '全量图标', icon: 'solar:album-outline' },
  { path: '/base-app/theme-editor', title: '主题编辑器', icon: 'solar:palette-2-outline' },
  { path: '/base-app/super-table', title: '超级表格', icon: 'solar:bill-list-outline' },
] as const

const systemManagementRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'SystemManagement',
    component: null,
    meta: {
      title: '系统管理',
      icon: 'solar:settings-outline',
    },
    children: [
      {
        path: 'users',
        name: 'BaseAdminUsers',
        component: () => import('@/views/BaseAdminUsers.vue'),
        meta: { title: '用户管理', icon: 'solar:users-group-rounded-outline' },
      },
      {
        path: 'roles',
        name: 'BaseAdminRoles',
        component: () => import('@/views/BaseAdminRoles.vue'),
        meta: { title: '角色管理', icon: 'solar:shield-user-outline' },
      },
      {
        path: 'menus',
        name: 'BaseAdminMenus',
        component: () => import('@/views/BaseAdminMenus.vue'),
        meta: { title: '菜单管理', icon: 'solar:menu-dots-outline' },
      },
    ],
  },
]

const baseAppDevRoutes: RouteRecordRaw[] = [
  {
    path: '/base-app',
    name: 'BaseApp',
    component: null,
    meta: {
      title: '基座应用',
      icon: 'solar:dumbbell-large-minimalistic-outline',
      hideInMenu: true,
    },
    children: [
      {
        path: 'icons',
        name: 'Icons',
        component: () => import('@/views/IconsRender.vue'),
        meta: { title: '全量图标', icon: 'solar:album-outline' },
      },
      {
        path: 'theme-editor',
        name: 'ThemeEditor',
        component: () => import('@/views/ThemeEditor/ThemeEditor.vue'),
        meta: { title: '主题编辑器', icon: 'solar:album-outline' },
      },
      {
        path: 'super-table',
        name: 'SuperTableDemo',
        component: () => import('@/views/SuperTableDemo.vue'),
        meta: { title: '超级表格', icon: 'solar:bill-list-outline' },
      },
    ],
  },
]

export const asyncRoutes: RouteRecordRaw[] = [
  ...systemManagementRoutes,
  ...(import.meta.env.DEV ? baseAppDevRoutes : []),
]

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/views/exceptions/NotFound.vue'),
  },
]
