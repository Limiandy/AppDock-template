<template>
  <div style="display: flex; align-items: center">
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
defineProps<{
  title: string
  token: string
  count: any
}>()
</script>

<style scoped lang="less">
.token-panel-pro-token-collapse-map-collapse-token {
  color: rgba(0, 0, 0, 0.65);
  margin-inline-start: 4px;
  margin-inline-end: 8px;
}

.token-panel-pro-token-collapse-map-collapse-count {
  color: rgba(0, 0, 0, 0.65);
  font-size: 12px;
  line-height: 16px;
  padding: 0 6px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 999px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
