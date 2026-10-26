import { defineConfig, loadEnv, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import qiankun from 'vite-plugin-qiankun'
import path from 'path'
import routeSyncPlugin from './vite/plugins/routeSyncPlugin.ts'
import rawJSPlugin from './vite/plugins/rawJSPlugin.ts'
import svgSpritePlugin from './vite/plugins/svgSpritePlugin.ts'
import chalk from 'chalk'
import simpleHtmlPlugin from 'vite-plugin-simple-html'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcssPresetEnv from 'postcss-preset-env'
import postcssNormalize from 'postcss-normalize'
import fs from 'fs'
import vitePluginBundleObfuscator from 'vite-plugin-bundle-obfuscator'

function getPackageName() {
  const packagePath = path.resolve(process.cwd(), 'package.json')
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
    if (typeof pkg.name === 'string' && pkg.name) return pkg.name
  }

  return process.env.npm_package_name
}

// APP_DEBUG_BUNDLE=1 时输出可调试产物：不压缩、不混淆、带 sourcemap
const isDebugBundle = process.env.APP_DEBUG_BUNDLE === '1'

// 生产包的反调试开关：默认开启；需要线上排查时可 APP_ANTI_DEBUG=0 构建关闭
const antiDebug = process.env.APP_ANTI_DEBUG !== '0'

// https://vite.dev/config/
// @ts-ignore
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd())

  console.log(chalk.green('[ENV]'), env)
  console.log(chalk.green('[COMMAND]'), command)
  const appName = getPackageName()

  const plugins: PluginOption[] = [
    vue(),
    svgSpritePlugin(),
    jsx(),
    rawJSPlugin(),
    simpleHtmlPlugin({
      inject: {
        data: {
          title: `AppDock`,
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

  if (command === 'build' && !isDebugBundle) {
    plugins.push(
      vitePluginBundleObfuscator({
        apply: 'build',
        autoExcludeNodeModules: true,
        threadPool: true,
        log: true,
        options: {
          compact: true,
          identifierNamesGenerator: 'hexadecimal',
          ignoreImports: true,
          renameGlobals: false,
          renameProperties: false,
          stringArray: true,
          stringArrayEncoding: ['base64'],
          stringArrayThreshold: 0.75,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.2,
          transformObjectKeys: true,
          selfDefending: true,
          // 反调试改由 main-app/src/security/antiDebug.ts 的隐形守卫负责：
          // obfuscator 自带的 debugProtection 模式固定（Function/debugger/setInterval），
          // 静态分析一眼能认出来，这里关闭。
          debugProtection: false,
          debugProtectionInterval: 0,
          unicodeEscapeSequence: false,
        },
      }),
    )
  }

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
        path.resolve(import.meta.dirname, `main-app/src/router/modules/${appName}.ts`),
      ),
    )
  }
  return {
    base: appName === 'main-app' ? '/' : `/${appName}/`,
    define: {
      // 调试包与 APP_ANTI_DEBUG=0 时不安装反调试守卫
      __ANTI_DEBUG__: JSON.stringify(antiDebug && !isDebugBundle),
    },
    plugins,
    build: {
      outDir: isDebugBundle ? 'dist-debug' : 'dist',
      minify: isDebugBundle ? false : 'oxc',
      sourcemap: isDebugBundle,
    },
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
