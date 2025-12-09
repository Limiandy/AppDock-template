// @ts-ignore
import { registerQiankun } from './qiankunLifeCycle'
import 'virtual:svg-icons-register'
import SvgIcon from './components/SvgIcon.vue'
import DirectivesPlugin from './directives/index'
import EventEmitter from './helper/EventEmitter'
import { store } from './helper/piniaHelper'
import { WorkerPool } from './helper/WorkerPool'

export {
  registerQiankun,
  SvgIcon,
  DirectivesPlugin,
  EventEmitter,
  store,
  WorkerPool,
}

export * from './icons/index'

export * from './hooks/index'
