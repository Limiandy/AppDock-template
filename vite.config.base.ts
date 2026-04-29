import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import qiankun from 'vite-plugin-qiankun'
import path from 'path'
import routeSyncPlugin from './vite/plugins/routeSyncPlugin'
import rawJSPlugin from './vite/plugins/rawJSPlugin'
import chalk from 'chalk'
import simpleHtmlPlugin from 'vite-plugin-simple-html'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcssPresetEnv from 'postcss-preset-env'
import postcssNormalize from 'postcss-normalize'
import fs from 'fs'

function getPackageName() {
  const packagePath = path.resolve(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    if (typeof pkg.name === 'string' && pkg.name) return pkg.name
  }

  return process.env.npm_package_name
}

// https://vite.dev/config/
// @ts-ignore
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())

  console.log(chalk.green('[ENV]'), env)
  console.log(chalk.green('[COMMAND]'), command)
  const appName = getPackageName()

  const plugins: PluginOption[] = [
    vue(),
    jsx(),
    rawJSPlugin(),
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
      postcss: {
        plugins: [
          autoprefixer(),
          cssnano({ preset: 'default' }),
          postcssNormalize({
            forceImport: true,
          }),
          postcssPresetEnv({
            stage: 3,
            autoprefixer: { grid: true },
            features: {
              'nesting-rules': true,
            },
          }),
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'), // 别名
      },
    },
  }
})
