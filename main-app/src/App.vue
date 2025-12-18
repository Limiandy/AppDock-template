<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: 'red',
      },
      components: {
        Button: {},
      },
    }"
  >
    <a-app style="width: 100%; height: 100%">
      <ThemeApply />
      <router-view />
    </a-app>
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue'
import { computed, ref } from 'vue'
import ThemeApply from '@/ThemeApply.vue'

type ThemeAlgorithm = typeof theme.defaultAlgorithm
type ThemeMap = Record<'light' | 'dark', ThemeAlgorithm>

const systemTheme = ref<'light' | 'dark'>('light')

const themeMap: ThemeMap = {
  light: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
}

const currentTheme = computed(() => {
  return themeMap[systemTheme.value]
})
</script>
