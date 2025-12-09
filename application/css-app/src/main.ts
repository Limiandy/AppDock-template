import App from './App.vue'
import { registerQiankun } from 'common'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import router from '@/router'
import HelloWorld from '@/components/HelloWorld.vue'

registerQiankun(App, {
  container: '#app',
  plugins: [Antd, router],
  mounted: (props) => {
    console.log(props)
  },
  getApp: (app) => {
    console.log(app?._version)
    app?.component('HelloWorld', HelloWorld)
  },
})
