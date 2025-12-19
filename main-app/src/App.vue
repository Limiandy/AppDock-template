<template>
  <a-config-provider :theme="currentTheme">
    <a-app style="width: 100%; height: 100%">
      <inject-apply />
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { shallowRef, toRaw } from 'vue'
import InjectApply from '@/InjectApply.vue'
import { useEvent } from '@/hooks/useEvent.ts'
import { theme } from 'ant-design-vue'

const currentTheme = shallowRef({
  algorithm: [theme.defaultAlgorithm],
  token: {},
  components: {
    Button: {},
  },
})
const { eventBus } = useEvent()
eventBus.on('themeChange', (themeConfig) => {
  currentTheme.value = { ...currentTheme.value, ...toRaw(themeConfig) }
})
</script>
