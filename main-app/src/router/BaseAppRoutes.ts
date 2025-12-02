import type { RouteRecordRaw } from 'vue-router'

export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/base-app',
    name: 'BaseApp',
    component: null,
    meta: { title: '基座应用', icon: 'solar:dumbbell-large-bold-duotone' },
    children: [
      {
        path: 'icons',
        name: 'Icons',
        component: () => import('@/views/IconsRender.vue'),
        meta: { title: '全量图标', icon: 'solar:dumbbell-large-bold-duotone' },
      },
    ],
  },
]

export const constantRoutes: RouteRecordRaw[] = []
