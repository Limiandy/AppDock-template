import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import { setupRouter } from '@/router'
import { setupStore } from '@/store'

import 'ant-design-vue/dist/reset.css'
import '@/styles/reset.less'
import { SvgIcon, DirectivesPlugin } from 'common'

import { initializeAccess } from './access.ts'
import { registerMicroApp } from './registerMicroApp.ts'

// TEMP DEBUG
const __errs: unknown[] = []
;(window as any).__errs = __errs
window.addEventListener('error', (event) => __errs.push(`window: ${event.message} @ ${event.filename}:${event.lineno}`))
window.addEventListener('unhandledrejection', (event) =>
  __errs.push(`rejection: ${(event.reason as Error)?.stack ?? String(event.reason)}`),
)

async function bootstrap() {
  const app = createApp(App)
  app.config.errorHandler = (err) => __errs.push(`vue: ${(err as Error)?.stack ?? String(err)}`)

  initializeAccess()
  setupStore(app)
  setupRouter(app)
  app.component('SvgIcon', SvgIcon)
  app.use(DirectivesPlugin)
  app.use(Antd).mount('#main-app')

  return Promise.resolve()
}

bootstrap().then(() => {
  registerMicroApp()
})
