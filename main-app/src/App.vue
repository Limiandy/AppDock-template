<template>
  <a-config-provider
    :theme="{
      algorithm: [currentTheme],
      token: {},
      components: {
        Button: {},
      },
    }"
  >
    <a-app style="width: 100%; height: 100%">
      <inject-apply />
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { computed, ref } from 'vue'
import InjectApply from '@/InjectApply.vue'

type ThemeAlgorithm = typeof theme.defaultAlgorithm
type ThemeMap = Record<'light' | 'dark', ThemeAlgorithm>

const systemTheme = ref<'light' | 'dark'>('dark')

const themeMap: ThemeMap = {
  light: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
}

const currentTheme = computed(() => {
  return themeMap[systemTheme.value]
})
</script>
