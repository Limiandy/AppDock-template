<template>
  <div class="theme-render">
    <div
      v-for="(value, key) in colorMap"
      :key="key"
      class="theme-item"
      @click="handleClick(key)"
    >
      <div class="theme-item-label">{{ key }}: {{ value }}</div>
      <p
        :style="{ background: value }"
        class="theme-item-input"
      ></p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { theme } from 'ant-design-vue'
import { ref, watch } from 'vue'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()
const { token } = theme.useToken()

const colorMap = ref<Record<string, string>>({})

watch(
  token,
  () => {
    const t = token.value

    for (const key in t) {
      const cssVar =
        '--ant-' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      const value = (t as Record<string, any>)[key]
      if (
        !cssVar.includes('box-shadow') &&
        (String(value).includes('#') ||
          String(value).includes('rgb') ||
          String(value).includes('rgba'))
      ) {
        colorMap.value[cssVar] = value
      }
    }
  },
  { immediate: true },
)

const copiedDir = ref<string | undefined>(undefined)
let timer: any = null

function showCopied(fullName: string) {
  copiedDir.value = fullName
  global.message.success(`已将 ${fullName} 复制到剪切板！`)
  // 清除旧的计时器
  if (timer) {
    clearTimeout(timer)
  }

  // 300ms 后隐藏
  timer = setTimeout(() => {
    copiedDir.value = undefined
    timer = null
  }, 600)
}

let handleClick = (fullName: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    // 现代安全上下文，直接调用 clipboard API4
    handleClick = (fullName) => {
      navigator.clipboard
        .writeText(fullName)
        .then(() => {
          showCopied(fullName)
          console.log('复制成功:', fullName)
        })
        .catch((err) => {
          console.error('复制失败:', err)
        })
    }
  } else {
    // 回退方案，老浏览器
    handleClick = (fullName) => {
      const textarea = document.createElement('textarea')
      textarea.value = fullName
      textarea.style.position = 'fixed' // 避免滚动到页面底部
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        const successful = document.execCommand('copy')
        successful && showCopied(fullName)
        console.log(successful ? '复制成功' : '复制失败')
      } catch (err) {
        console.error('复制失败:', err)
      }
      document.body.removeChild(textarea)
    }
  }
  handleClick(fullName)
}
</script>

<style lang="less" scoped>
.theme-render {
  margin: 24px;
  padding: 16px;
  border-radius: 16px;
  background-color: #808080;

  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.theme-item {
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s linear;
  overflow: hidden;
  position: relative;

  &:hover {
    background-color: var(--ant-color-primary-bg-hover);
    border-radius: 6px;
  }

  .theme-item-label {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  .theme-item-input {
    height: 36px;
    width: 100%;
    border-radius: 4px;
  }

  .is-mask {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    color: var(--ant-color-primary-text);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
