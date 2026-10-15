<template>
  <a-breadcrumb v-if="breadcrumbs.length" :class="[scopeClass, className]">
    <a-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
      <router-link v-if="item.navigable" class="basic-layout-breadcrumb__link" :to="item.path">
        {{ item.title }}
      </router-link>
      <span v-else class="basic-layout-breadcrumb__current">{{ item.title }}</span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched } from 'vue-router'
import useStyle from '@/hooks/style/useStyle.ts'

interface BreadcrumbEntry {
  path: string
  title: string
  navigable: boolean
}

const route = useRoute()
const router = useRouter()

function resolveRecordPath(record: RouteLocationMatched) {
  if (!record.name) return record.path

  try {
    return router.resolve({ name: record.name, params: route.params }).path
  } catch {
    return record.path
  }
}

const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
  const matched = route.matched.filter((record) => record.meta?.title)

  return matched.map((record, index) => ({
    path: resolveRecordPath(record),
    title: String(record.meta.title),
    navigable: index < matched.length - 1 && Boolean(record.components?.default),
  }))
})

const [className, scopeClass] = useStyle('basic-layout-breadcrumb', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'

  return {
    'flexShrink': 0,
    'padding': `${token.padding}px ${token.paddingLG}px ${token.paddingXS}px`,
    'fontSize': `${token.fontSize}px`,
    'lineHeight': `${token.lineHeight}px`,

    '.basic-layout-breadcrumb__link': {
      'color': token.colorTextSecondary,
      'transition': `color ${token.motionDurationMid}`,
      '&:hover': {
        color: token.colorPrimary,
      },
    },

    '.basic-layout-breadcrumb__current': {
      color: token.colorText,
    },

    [`${rootCls}-breadcrumb-separator`]: {
      color: token.colorTextQuaternary,
    },
  }
})
</script>
