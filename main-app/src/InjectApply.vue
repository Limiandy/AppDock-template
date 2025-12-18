<script setup lang="ts">
import { App, theme } from 'ant-design-vue'
import { useGlobalStore } from '@/store/modules/global.ts'
import { watch } from 'vue'
const appContext = App.useApp()

const global = useGlobalStore()

global.init(appContext)

const { token } = theme.useToken()
watch(
  token,
  (newToken) => {
    const root = document.documentElement
    root.style.setProperty('color', newToken.colorText)
    root.style.setProperty('font-size', `${newToken.fontSize}px`)
    root.style.setProperty('background-color', newToken.colorBgLayout)
  },
  { deep: true, immediate: true, flush: 'pre' },
)
</script>

<template>
  <div v-if="false"></div>
</template>
