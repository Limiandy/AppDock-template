<template>
  <div class="theme-editor-page">
    <theme-editor :theme="editorTheme" :on-theme-change="handleThemeChange" />
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, shallowRef, toRaw } from 'vue'
import { theme } from 'ant-design-vue'
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context'
import { ThemeEditor, type MutableTheme } from '@/components/antdv-token-previewer'
import { useEvent } from '@/hooks/useEvent.ts'
import {
  getModeByThemeConfig,
  globalThemeConfig,
  setGlobalThemeConfig,
  type ThemeMode,
} from '@/hooks/theme/themeCore.ts'

const { eventBus } = useEvent()

const editorTheme = shallowRef<MutableTheme>({
  name: '默认主题',
  key: 'default',
  config: {
    algorithm: [theme.defaultAlgorithm],
    token: {},
    ...globalThemeConfig.value,
  },
})

function handleThemeChange(nextTheme: MutableTheme) {
  editorTheme.value = nextTheme
  setGlobalThemeConfig(toRaw(nextTheme.config), { replaceToken: true, replaceComponents: true })
  eventBus.emit('themeChange', toRaw(nextTheme.config), {
    mode: getModeByThemeConfig(nextTheme.config),
    source: 'theme-editor',
  })
}

function handleGlobalThemeChange(themeConfig: ThemeConfig, info?: { mode?: ThemeMode; source?: string }) {
  if (info?.source === 'theme-editor') return
  setGlobalThemeConfig(toRaw(themeConfig), { replaceToken: true, replaceComponents: true })

  editorTheme.value = {
    ...editorTheme.value,
    config: {
      ...editorTheme.value.config,
      ...toRaw(themeConfig),
      token: toRaw(themeConfig.token ?? {}),
      components: toRaw(themeConfig.components ?? {}),
    },
  }
}

eventBus.on('themeChange', handleGlobalThemeChange)

onBeforeUnmount(() => {
  eventBus.off('themeChange', handleGlobalThemeChange)
})
</script>

<style lang="less" scoped>
.theme-editor-page {
  height: calc(100vh - 64px);
  overflow: auto;
}

:deep(.antd-theme-editor) {
  height: 100%;
}
</style>
