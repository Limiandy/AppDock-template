import ViteConfigBase from '../../vite.config.base'
import { defineConfig } from 'vite'
import merge from 'lodash.merge'

const port = 60011

// https://vite.dev/config/
export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)
  // console.log(baseConfig)
  return merge(baseConfig, {
    server: {
      port,
    },
  })
})
