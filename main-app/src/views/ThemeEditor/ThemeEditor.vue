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
  setGlobalThemeConfig(toRaw(nextTheme.config), { replaceToken: true, replaceComponents: true })

  // 广播「应用后的配置」：包含随密度同步的基础字号等归一化结果，
  // 避免下游 replaceToken 时把密度同步的字号覆盖回去。
  const appliedConfig = toRaw(globalThemeConfig.value)
  editorTheme.value = { ...nextTheme, config: appliedConfig }
  eventBus.emit('themeChange', appliedConfig, {
    mode: getModeByThemeConfig(appliedConfig),
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
      token: { ...toRaw(globalThemeConfig.value.token ?? {}), ...toRaw(themeConfig.token ?? {}) },
      components: { ...toRaw(globalThemeConfig.value.components ?? {}), ...toRaw(themeConfig.components ?? {}) },
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
  height: 100%;
  overflow: auto;
}

:deep(.antd-theme-editor) {
  height: 100%;
}
</style>
