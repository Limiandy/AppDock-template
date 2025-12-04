import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { type App } from 'vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/custom-comp-app',
    name: 'CustomCompApp',
    component: null,
    meta: { title: '自定义组件', icon: 'solar:align-left-outline' },
    redirect: '/custom-comp-app/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', icon: 'solar:home-outline' },
      },
      {
        path: 'slam',
        name: 'Slam',
        // @ts-ignore
        component: () => import('@/views/Slam/Slam.vue'),
        meta: { title: 'SLAM 地图', icon: 'solar:bacteria-outline' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App<Element>) {
  app.use(router)
}

export default router
