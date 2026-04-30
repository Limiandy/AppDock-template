import App from './App.vue'
import { registerQiankun } from 'common'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from '@/router'

registerQiankun(App, {
  container: '#app',
  plugins: [Antd, router],
})
