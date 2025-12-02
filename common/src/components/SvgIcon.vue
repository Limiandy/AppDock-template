<template>
  <svg
    aria-hidden="true"
    :style="{ width, height }"
  >
    <use
      :xlink:href="symbolId"
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  prefix?: string
  color?: string
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  prefix: 'icon',
  color: '#333',
  width: '14px',
  height: '14px',
})

const symbolId = computed(() => {
  let dir = ''
  let name = props.name

  // 解析 solar:xxx → solar / xxx
  if (props.name.includes(':')) {
    const arr = props.name.split(':')
    dir = arr[0]
    name = arr[1]
  }

  // 最终生成 plugin 格式一致的 symbolId
  // dir 允许为空
  return `#${props.prefix}-${dir ? dir + '-' : ''}${name}`
})
</script>
