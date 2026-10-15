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

async function bootstrap() {
  const app = createApp(App)

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
