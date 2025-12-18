// @ts-ignore
import merge from 'lodash.merge'
import ViteConfigBase from '../vite.config.base'
import vueDevTools from 'vite-plugin-vue-devtools'
// @ts-ignore
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)
  baseConfig.plugins.push(vueDevTools())
  // @ts-ignore
  const plugins = baseConfig.plugins.filter((plugin) => plugin.name !== 'vite:vue')
  plugins.unshift(
    vuePlugin({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.endsWith('-color-picker'),
        },
      },
    }),
  )
  baseConfig.plugins = plugins
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
