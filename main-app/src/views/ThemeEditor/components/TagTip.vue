<template>
  <a-tooltip :open="open" placement="topLeft">
    <template #title>{{ fullText }}</template>
    <div
      ref="containerRef"
      :class="classNames"
      class="token-panel-pro-token-collapse-map-collapse-token-usage-tag-container"
      @mouseenter="handleShowTip"
      @mouseleave="open = false"
    >
      <span
        v-for="(item, index) in texts"
        :key="index"
        class="token-panel-pro-token-collapse-map-collapse-token-usage-tag"
      >
        {{ item }}
      </span>
    </div>
  </a-tooltip>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import useStyle from '@/hooks/style/useStyle.ts'

// props: 接收文字数组
const props = defineProps<{ texts: string[] }>()

// 合并成一个字符串
const fullText = computed(() => props.texts.join(',\t'))

const open = ref(false)
const isShowTip = ref(false)
const container = useTemplateRef('containerRef')

function handleShowTip() {
  if (isShowTip.value) {
    open.value = true
  }
}

function checkOverflow() {
  if (!container.value) return
  const el = container.value
  // scrollWidth > clientWidth 代表发生了文本溢出
  isShowTip.value = el.scrollWidth > el.clientWidth
}

onMounted(async () => {
  await nextTick()
  checkOverflow()
})

// 当文本变化时重新判断
watch(fullText, async () => {
  await nextTick()
  checkOverflow()
})

const classNames = useStyle((token) => ({
  '&.token-panel-pro-token-collapse-map-collapse-token-usage-tag-container': {
    'color': token.colorTextSecondary,

    '.token-panel-pro-token-collapse-map-collapse-token-usage-tag': {
      backgroundColor: token.colorFillQuaternary,
    },
  },
}))
</script>

<style scoped lang="less">
.token-panel-pro-token-collapse-map-collapse-token-usage-tag-container {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.token-panel-pro-token-collapse-map-collapse-token-usage-tag {
  display: inline-block;
  margin-inline-end: 8px;
  border-radius: 4px;
  height: 20px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 20px;
}
</style>
