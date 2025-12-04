<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { watch } from 'vue'
import { App } from 'ant-design-vue'
import { useGlobalStore } from '@/store/modules/global.ts'
const appContext = App.useApp()

const global = useGlobalStore()

global.init(appContext)

const { token } = theme.useToken()

watch(
  token,
  () => {
    const root = document.documentElement
    const t = token.value

    for (const key in t) {
      const cssVar =
        '--ant-' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      root.style.setProperty(cssVar, (t as Record<string, any>)[key])
    }
  },
  { immediate: true },
)
</script>

<template>
  <div></div>
</template>
