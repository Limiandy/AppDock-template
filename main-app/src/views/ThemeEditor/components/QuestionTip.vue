<template>
  <a-tooltip>
    <template #title>{{ title }}</template>
    <svg-icon name="solar:question-circle-outline" style="font-size: 14px; margin-left: 4px" />
  </a-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
