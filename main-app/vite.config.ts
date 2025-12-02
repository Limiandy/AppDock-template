// @ts-ignore
import merge from 'lodash.merge'
import ViteConfigBase from '../vite.config.base'
import vueDevTools from 'vite-plugin-vue-devtools'

import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)
  baseConfig.plugins.push(vueDevTools())
  return merge(baseConfig, {
    proxy: {
      '/community/nursing': {
        target: 'http://172.25.211.48:9210',
        // target: 'http://10.64.12.209:9210',
        changeOrigin: true,
      },
      '/publish_content': {
        target: 'http://172.25.211.48:8891',
        // target: 'http://10.64.12.209:9210',
        changeOrigin: true,
      },
    },
  })
})
