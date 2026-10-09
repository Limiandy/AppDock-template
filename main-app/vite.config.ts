// @ts-ignore
import merge from 'lodash.merge'
import ViteConfigBase from '../vite.config.base.ts'
import vueDevTools from 'vite-plugin-vue-devtools'
// @ts-ignore
import vuePlugin from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

function readLocalSupabaseEnv() {
  const envPath = path.resolve(process.cwd(), '../docker/supabase/.env.local')
  if (!fs.existsSync(envPath)) return {}

  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(/=(.*)/s).filter(Boolean))
      .map(([key, value]) => [key, value]),
  )
}

// https://vite.dev/config/
export default defineConfig((config) => {
  const baseConfig = ViteConfigBase(config)
  const supabaseEnv = readLocalSupabaseEnv()
  const supabaseUrl = supabaseEnv.SUPABASE_PUBLIC_URL || 'http://localhost:54321'
  const supabaseAnonKey = supabaseEnv.ANON_KEY
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
    server: {
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
        '/supabase/rest': {
          target: supabaseUrl,
          changeOrigin: true,
          rewrite: (url: string) => url.replace(/^\/supabase\/rest/, '/rest/v1'),
          configure: (proxy: any) => {
            proxy.on('proxyReq', (proxyReq: any) => {
              if (!supabaseAnonKey) return
              proxyReq.setHeader('apikey', supabaseAnonKey)
              proxyReq.setHeader('Authorization', `Bearer ${supabaseAnonKey}`)
            })
          },
        },
      },
    },
  })
})
