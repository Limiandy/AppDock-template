import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { type App } from 'vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/test-app',
    name: 'TestApp',
    component: null,
    meta: { title: 'test-app', icon: 'solar:widget-outline' },
    redirect: '/test-app/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', icon: 'solar:home-outline' },
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
