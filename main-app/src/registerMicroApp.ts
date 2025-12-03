import microApps from './micro-apps.json'
import { registerMicroApps, start, initGlobalState } from 'qiankun'
import { useEvent } from '@/hooks/useEvent.ts'

const { eventBus } = useEvent()

export function registerMicroApp() {
  const actions = initGlobalState({
    user: { name: 'admin' },
  })

  // 监听子应用修改
  actions.onGlobalStateChange((state, prev) => {
    console.log('[onGlobalStateChange - 基座]:', state, prev)
  })

  microApps.forEach((app) => {
    app.props = Object.assign({}, app.props, { actions })
  })
  registerMicroApps(microApps, {
    async beforeLoad() {
      eventBus.emit('microLoad', true)
      return Promise.resolve()
    },
    async afterMount() {
      eventBus.emit('microLoad', false)
      return Promise.resolve()
    },
  })

  start({
    prefetch: true,
    sandbox: {
      //启用沙箱样式隔离
      experimentalStyleIsolation: true,
    },
    // 指定部分特殊的动态加载的微应用资源（css/js) 不被 qiankun 劫持处理
    excludeAssetFilter: (assetUrl) => {
      const whiteList: string[] = []
      const whiteWords = ['white_js']
      if (whiteList.includes(assetUrl)) {
        return true
      }
      return whiteWords.some((w) => assetUrl.includes(w))
    },
  })
}
