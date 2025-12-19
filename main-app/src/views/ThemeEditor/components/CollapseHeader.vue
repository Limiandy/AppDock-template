<template>
  <div :class="classNames" style="display: flex; align-items: center">
    <div style="flex: 1 1 0%; white-space: nowrap; width: 0px; overflow: hidden; display: flex; align-items: center">
      <span style="font-weight: 500; flex: 0 0 auto">{{ title }}</span>
      <span class="token-panel-pro-token-collapse-map-collapse-token" style="flex: 0 0 auto">
        {{ token }}
      </span>
      <span class="token-panel-pro-token-collapse-map-collapse-count">
        {{ count }}
      </span>
    </div>
    <slot name="preview"></slot>
    <div style="flex: 0 0 auto; margin: 4px">
      <svg-icon name="solar:balls-outline" />
    </div>
  </div>
</template>

<script setup lang="ts">
import useStyle from '@/hooks/style/useStyle.ts'

defineProps<{
  title: string
  token: string
  count: any
}>()

const classNames = useStyle((token) => {
  return {
    '.token-panel-pro-token-collapse-map-collapse-token': {
      color: token.colorTextSecondary,
      marginInlineStart: `${token.marginXXS}px`,
      marginInlineEnd: `${token.marginXS}px`,
    },

    '.token-panel-pro-token-collapse-map-collapse-count': {
      color: token.colorTextSecondary,
      fontSize: `${token.fontSizeSM}px`,
      lineHeight: `16px`,
      padding: `0 6px`,
      backgroundColor: token.colorFillQuaternary,
      borderRadius: `999px`,
      overflow: `hidden`,
      textOverflow: `ellipsis`,
    },
  }
})
</script>
