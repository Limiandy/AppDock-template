import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { type App } from 'vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/first-app',
    name: 'FirstApp',
    component: null,
    meta: {},
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {},
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
