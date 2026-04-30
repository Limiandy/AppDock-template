import ViteConfigBase from '../../vite.config.base'
import { defineConfig } from 'vite'
import merge from 'lodash.merge'

const port = 60013

export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)

  return merge(baseConfig, {
    server: {
      port,
    },
  })
})
