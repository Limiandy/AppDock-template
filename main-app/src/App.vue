<template>
  <a-config-provider :theme="currentTheme">
    <a-app style="width: 100%; height: 100%">
      <inject-apply />
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { toRaw } from 'vue'
import InjectApply from '@/InjectApply.vue'
import { useEvent } from '@/hooks/useEvent.ts'
import { globalThemeConfig, setGlobalThemeConfig } from '@/hooks/theme/themeCore.ts'

const currentTheme = globalThemeConfig
const { eventBus } = useEvent()
eventBus.on('themeChange', (themeConfig) => {
  setGlobalThemeConfig(toRaw(themeConfig), { replaceToken: true, replaceComponents: true })
})
</script>
