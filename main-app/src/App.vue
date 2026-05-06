<template>
  <a-config-provider :locale="zhCN" :theme="currentTheme">
    <a-app
      :message="antdAppFeedbackConfig.message"
      :notification="antdAppFeedbackConfig.notification"
      style="width: 100%; height: 100%"
    >
      <inject-apply />
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { toRaw } from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import InjectApply from '@/InjectApply.vue'
import { useEvent } from '@/hooks/useEvent.ts'
import { globalThemeConfig, setGlobalThemeConfig } from '@/hooks/theme/themeCore.ts'
import { antdAppFeedbackConfig } from '@/store/modules/global.ts'

const currentTheme = globalThemeConfig
const { eventBus } = useEvent()
eventBus.on('themeChange', (themeConfig) => {
  setGlobalThemeConfig(toRaw(themeConfig), { replaceToken: true, replaceComponents: true })
})
</script>
