import registeredMicroApps from './micro-apps.json'
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

  // micro-apps.json 只记录子应用名称、开发端口和挂载约定；入口按运行模式推导，
  // 保证入库的生成文件不会在 dev/build 之间来回变化。
  const microApps = registeredMicroApps.map((app) => ({
    ...app,
    entry: import.meta.env.DEV ? `//localhost:${app.port}` : `/${app.name}/`,
  }))

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
