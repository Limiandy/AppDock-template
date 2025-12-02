<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { watch } from 'vue'

const { token } = theme.useToken()

watch(
  token,
  () => {
    console.log('========token=======')
    const root = document.documentElement
    const t = token.value

    for (const key in t) {
      const cssVar =
        '--ant-' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      root.style.setProperty(cssVar, t[key])
    }
  },
  { immediate: true },
)
</script>

<template>
  <div></div>
</template>
