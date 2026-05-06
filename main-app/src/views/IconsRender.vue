<template>
  <div class="icons-render">
    <section v-for="(value, key) in iconGroup" :key="key">
      <h3>{{ key }}</h3>
      <div class="icons-container">
        <div
          v-for="(item, index) in value"
          :key="index"
          class="icons-item"
          @click="handleClick(item.fullName, key, index)"
        >
          <svg-icon :name="item.fullName" width="24px" height="24px" />
          <p>{{ item.name }}</p>

          <div v-if="copiedIndex === index && copiedDir === key" class="is-mask">复制成功!</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { getIconsGrouped } from 'common/icons'
import { ref } from 'vue'
import { useGlobalStore } from '@/store/modules/global.ts'

const global = useGlobalStore()

const iconGroup = getIconsGrouped()
const copiedIndex = ref<number | undefined>(undefined)
const copiedDir = ref<string | undefined>(undefined)
let timer: any = null

function showCopied(index: number, dir: string, fullName: string) {
  copiedIndex.value = index
  copiedDir.value = dir
  global.message.success(`已将 ${fullName} 复制到剪切板！`)
  // 清除旧的计时器
  if (timer) {
    clearTimeout(timer)
  }

  // 300ms 后隐藏
  timer = setTimeout(() => {
    copiedIndex.value = undefined
    copiedDir.value = undefined
    timer = null
  }, 600)
}

let handleClick = (fullName: string, dir: string, index: number) => {
  if (navigator.clipboard && window.isSecureContext) {
    // 现代安全上下文，直接调用 clipboard API4
    handleClick = (fullName, dir, index) => {
      navigator.clipboard
        .writeText(fullName)
        .then(() => {
          showCopied(index, dir, fullName)
          console.log('复制成功:', fullName)
        })
        .catch((err) => {
          console.error('复制失败:', err)
        })
    }
  } else {
    // 回退方案，老浏览器
    handleClick = (fullName, dir, index) => {
      const textarea = document.createElement('textarea')
      textarea.value = fullName
      textarea.style.position = 'fixed' // 避免滚动到页面底部
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        const successful = document.execCommand('copy')
        successful && showCopied(index, dir, fullName)
        console.log(successful ? '复制成功' : '复制失败')
      } catch (err) {
        console.error('复制失败:', err)
      }
      document.body.removeChild(textarea)
    }
  }
  handleClick(fullName, dir, index)
}
</script>

<style lang="less" scoped>
.icons-render {
  margin: 24px;
  padding: 16px;
  border-radius: 16px;
  background-color: #fff;
}

.icons-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.icons-item {
  display: flex;
  flex-flow: column;
  justify-content: center;
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
