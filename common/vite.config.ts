import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
// @ts-ignore
import path from 'path'
// @ts-ignore
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import jsx from '@vitejs/plugin-vue-jsx'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  plugins: [
    vue(),
    jsx(),
    libInjectCss(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
    createSvgIconsPlugin({
      // 指定需要缓存的图标文件夹
      iconDirs: [path.resolve(process.cwd(), 'src/icons')],
      // 指定symbolId格式
      symbolId: 'icon-[dir]-[name]',
      /**
       * 自定义插入位置
       * @default: body-last
       */
      inject: 'body-last',

      /**
       * custom dom id
       * @default: __svg__icons__dom__
       */
      customDomId: '__svg__icons__dom__',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Common',
      formats: ['es', 'cjs'],
      fileName: (format) => `[name].${format}.js`,
    },
    outDir: 'dist',
    rollupOptions: {
      /**
       * 由于（Tree-shaking）会对没有被入口使用或者执行阶段没有副作用的文件生效，并删除不属于入口起点的未使用文件的导出。
       * 调整输入文件，将需要按目录暴露的入口文件单独打包在自己的目录中。例如：import { xxx } from 'common/utils'
       */
      input: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/components/index.ts'),
        resolve(__dirname, 'src/helper/index.ts'),
        resolve(__dirname, 'src/hooks/index.ts'),
        resolve(__dirname, 'src/icons/index.ts'),
      ],
      external: (id) =>
        id === 'vue' || id.startsWith('vue/') || id === 'ant-design-vue' || id.startsWith('ant-design-vue/'),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
