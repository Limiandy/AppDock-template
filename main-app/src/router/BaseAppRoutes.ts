import type { RouteRecordRaw } from 'vue-router'

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/base-app',
    name: 'BaseApp',
    component: null,
    meta: {
      title: '基座应用',
      icon: 'solar:dumbbell-large-minimalistic-outline',
    },
    children: [
      {
        path: 'icons',
        name: 'Icons',
        component: () => import('@/views/IconsRender.vue'),
        meta: { title: '全量图标', icon: 'solar:album-outline' },
      },
    ],
  },
]

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/views/exceptions/NotFound.vue'),
  },
]
