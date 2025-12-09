import { App, Component, createApp } from 'vue'
import SvgIcon from './components/SvgIcon.vue'
import DirectivesPlugin from './directives/index'
import { setupStore } from './helper/piniaHelper'

import {
  renderWithQiankun,
  qiankunWindow,
  // @ts-ignore
} from 'vite-plugin-qiankun/dist/helper'

// @ts-ignore
import { QiankunProps } from 'vite-plugin-qiankun/es/helper'

interface RegisterQiankunOptions {
  container?: string
  plugins?: any[]
  getApp?: (app: App<Element> | null) => void
  mounted?: (props: QiankunProps) => void
}

export function registerQiankun(
  rootComponent: Component,
  options: RegisterQiankunOptions = {},
) {
  const {
    container: rootContainer = '#app',
    plugins = [],
    getApp,
    mounted,
  } = options

  let app: App<Element> | null = null
  function render(props: QiankunProps) {
    return new Promise((resolve) => {
      const { container } = props
      app = createApp(rootComponent)
      setupStore(app)
      getApp?.(app)
      app.use(DirectivesPlugin)
      app.component('SvgIcon', SvgIcon)
      plugins?.forEach((plugin) => {
        app!.use(plugin)
      })
      app.mount(container ? container.querySelector(rootContainer)! : '#app')
      resolve(true)
    })
  }

  if (qiankunWindow.__POWERED_BY_QIANKUN__) {
    renderWithQiankun({
      async bootstrap() {
        // 可加 log 或其他初始化逻辑
        return Promise.resolve()
      },
      async mount(props: QiankunProps) {
        await render(props)
        mounted?.(props)
        return Promise.resolve()
      },
      unmount() {
        app!.unmount()
        app = null
        getApp?.(app)
      },
      update() {
        // Optional
      },
    })
  } else {
    render({})
  }
}
