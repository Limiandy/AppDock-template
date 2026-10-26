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
import { installAntiDebug } from './security/antiDebug.ts'

// 生产构建才安装反调试守卫；调试包与 dev 不注入
if (__ANTI_DEBUG__) {
  installAntiDebug()
}

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
