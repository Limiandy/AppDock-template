import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import { asyncRoutes, constantRoutes } from '@/router/BaseAppRoutes.ts'
import BasicLayout from '@/layout/BasicLayout.vue'

export type RouteWithoutChildren = Omit<RouteRecordRaw, 'children'> & {
  children?: RouteWithoutChildren[]
  meta?: Record<string, any>
}

const modules = import.meta.glob<{ default: RouteRecordRaw[] }>(
  './modules/*.ts',
  {
    eager: true,
  },
)

const microAppRoutes: RouteRecordRaw[] = Object.values(modules).flatMap(
  (mod) => mod.default,
)

export const routes: RouteWithoutChildren[] = [
  {
    path: '/',
    name: 'ROOT',
    component: BasicLayout,
    meta: {},
    children: [...asyncRoutes, ...microAppRoutes],
  },
  ...constantRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes as RouteRecordRaw[],
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App<Element>) {
  app.use(router)
}

export default router
