declare module '@vitejs/plugin-vue' {
  import { Plugin } from 'vite'
  export default function vuePlugin(): Plugin
}

declare module '@vitejs/plugin-vue-jsx' {
  import { Plugin } from 'vite'
  export default function vueJsxPlugin(): Plugin
}
