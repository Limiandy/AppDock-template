import type { App } from 'vue'
import { loadingDirective } from './loading'
import './styles.less'

export default {
  install(app: App) {
    app.directive('loading', loadingDirective)
  },
}
