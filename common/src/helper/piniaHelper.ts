// pinia
import { createPinia } from 'pinia'
// 持久化存储
import { createPersistedState } from 'pinia-plugin-persistedstate'
import type { App } from 'vue'

const store = createPinia()

store.use(
  createPersistedState({
    auto: false, // 启用所有 Store 默认持久化
  }),
)

export function setupStore(app: App<Element>) {
  app.use(store)
}

export { store }
