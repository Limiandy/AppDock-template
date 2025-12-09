import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import qiankun from 'vite-plugin-qiankun'
import path from 'path'
import routeSyncPlugin from './vite/plugins/routeSyncPlugin'
import rawJSPlugin from './vite/plugins/rawJSPlugin'
import tailwindcss from '@tailwindcss/vite'
import chalk from 'chalk'
import simpleHtmlPlugin from 'vite-plugin-simple-html'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())

  console.log(chalk.green('[ENV]'), env)
  console.log(chalk.green('[COMMAND]'), command)
  const appName = process.env.npm_package_name

  const plugins: PluginOption[] = [
    vue(),
    jsx(),
    rawJSPlugin(),
    tailwindcss(),
    simpleHtmlPlugin({
      inject: {
        data: {
          title: `Vue 游乐场`,
        },
        /*tags: [
          {
            tag: 'meta',
            attrs: {
              name: 'revised',
              content: `版本号:custom-nursing-app ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            },
          },
        ],*/
      },
    }),
  ]

  if (appName !== 'main-app') {
    plugins.unshift(
      // 支持 Qiankun
      qiankun(appName as string, {
        useDevMode: true, // 开发模式下启用热更新支持
      }),
    )

    plugins.push(
      routeSyncPlugin(
        path.resolve(process.cwd(), 'src/router/index.ts'),
        path.resolve(__dirname, `main-app/src/router/modules/${appName}.ts`),
      ),
    )
  }
  return {
    base: appName === 'main-app' ? '/' : `/${appName}/`,
    plugins,
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {},
          math: 'always', // 兼容 less-loader 3.x
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'), // 别名
      },
    },
  }
})
