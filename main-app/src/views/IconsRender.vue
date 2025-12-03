<template>
  <div>
    <section
      v-for="(value, key) in iconGroup"
      :key="key"
    >
      <div>{{ key === '.' ? '无目录' : key }}</div>
      <div>
        <span
          v-for="(item, index) in value"
          :key="index"
          style="display: inline-block; margin: 16px; cursor: pointer"
          @click="handleClick(item.fullName)"
        >
          <svg-icon
            :name="item.fullName"
            width="24px"
            height="24px"
          />
        </span>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { getIconsGrouped } from 'common/icons'

const iconGroup = getIconsGrouped()

let handleClick = (fullName: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    // 现代安全上下文，直接调用 clipboard API4
    handleClick = (fullName) => {
      navigator.clipboard
        .writeText(fullName)
        .then(() => {
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
