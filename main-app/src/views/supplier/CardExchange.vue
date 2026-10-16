<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <div class="card-exchange__head">
      <h2 class="card-exchange__title">名片交换</h2>
    </div>

    <a-tabs v-model:active-key="category" class="card-exchange__tabs">
      <a-tab-pane v-for="item in categories" :key="item.key" :tab="`${item.label}（${item.count}）`" />
    </a-tabs>

    <div class="card-exchange__filter">
      <span class="card-exchange__filter-label">对象</span>
      <a-segmented v-model:value="target" :options="targetOptions" />
      <a-input v-model:value="keyword" class="card-exchange__search" placeholder="搜索姓名 / 公司 / 职位" allow-clear>
        <template #prefix>
          <SvgIcon name="solar:magnifer-outline" />
        </template>
      </a-input>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col v-for="item in visibleCards" :key="item.id" :xs="24" :sm="12" :xl="8">
        <div class="card-exchange__card">
          <span class="card-exchange__accent"></span>
          <div class="card-exchange__top">
            <span class="card-exchange__avatar">{{ item.name.slice(0, 1) }}</span>
            <div class="card-exchange__identity">
              <span class="card-exchange__name">{{ item.name }}</span>
              <span class="card-exchange__role">/ {{ item.role }}</span>
            </div>
            <span class="card-exchange__logo" :style="{ color: item.logoColor }">{{ item.logoText }}</span>
          </div>
          <div class="card-exchange__company">{{ item.company }}</div>
          <a-button
            class="card-exchange__action"
            :type="item.status === '可交换' ? 'primary' : 'default'"
            :disabled="item.status === '已申请'"
            block
            @click="onExchange(item)"
          >
            <SvgIcon name="solar:card-outline" class="card-exchange__action-icon" />
            {{ item.status === '已申请' ? '已申请' : item.status === '可交换' ? '交换名片' : '申请交换名片' }}
          </a-button>
        </div>
      </a-col>
    </a-row>

    <a-empty v-if="!visibleCards.length" description="当前分类下暂无人脉" />
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SvgIcon } from 'common'
import { cards, type CardRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const global = useGlobalStore()
const category = ref<CardRecord['category']>('人脉广场')
const target = ref<CardRecord['target']>('供应商')
const keyword = ref('')

const categories = computed(() => {
  const list: { key: CardRecord['category']; label: string }[] = [
    { key: '人脉广场', label: '人脉广场' },
    { key: '人脉处理', label: '人脉处理' },
    { key: '人脉申请', label: '人脉申请' },
  ]

  return list.map((item) => ({
    ...item,
    count: cards.filter((card) => card.category === item.key).length,
  }))
})

const targetOptions = [
  { label: '供应商', value: '供应商' },
  { label: '开发商', value: '开发商' },
]

const visibleCards = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return cards.filter((card) => {
    if (card.category !== category.value) return false
    if (card.target !== target.value) return false
    if (!text) return true
    return [card.name, card.company, card.role].some((value) => value.toLowerCase().includes(text))
  })
})

function onExchange(record: CardRecord) {
  global.message.success(`原型演示：向「${record.name}」${record.status === '可交换' ? '交换名片' : '申请交换名片'}`)
}

const [className, scopeClass] = useStyle('card-exchange', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'

  return {
    'margin': `${token.margin}px`,
    'borderRadius': `${token.borderRadiusLG}px`,

    '.card-exchange__head': {
      marginBottom: `${token.marginXS}px`,
    },

    '.card-exchange__title': {
      margin: 0,
      fontSize: `${token.fontSizeHeading4}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.card-exchange__tabs': {
      [`${rootCls}-tabs-nav`]: {
        marginBottom: 0,
      },
    },

    '.card-exchange__filter': {
      display: 'flex',
      alignItems: 'center',
      gap: `${token.marginSM}px`,
      padding: `${token.padding}px 0`,
    },

    '.card-exchange__filter-label': {
      color: token.colorTextSecondary,
    },

    '.card-exchange__search': {
      width: '260px',
      marginInlineStart: 'auto',
    },

    '.card-exchange__card': {
      'position': 'relative',
      'padding': `${token.padding}px ${token.paddingLG}px ${token.paddingLG}px`,
      'border': `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
      'borderRadius': `${token.borderRadiusLG}px`,
      'background': token.colorBgContainer,
      'overflow': 'hidden',
      'transition': `box-shadow ${token.motionDurationMid}`,

      '&:hover': {
        boxShadow: token.boxShadowSecondary,
      },
    },

    '.card-exchange__accent': {
      position: 'absolute',
      top: 0,
      insetInlineStart: 0,
      width: '4px',
      height: '56px',
      borderRadius: `0 ${token.borderRadiusSM}px ${token.borderRadiusSM}px 0`,
      background: `linear-gradient(180deg, #546FFD 0%, #7A8FFF 100%)`,
    },

    '.card-exchange__top': {
      display: 'flex',
      alignItems: 'center',
      gap: `${token.marginXS}px`,
    },

    '.card-exchange__avatar': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: `${token.controlHeightSM}px`,
      height: `${token.controlHeightSM}px`,
      borderRadius: '50%',
      background: token.colorFillSecondary,
      color: token.colorTextSecondary,
      fontWeight: token.fontWeightStrong,
    },

    '.card-exchange__identity': {
      display: 'flex',
      alignItems: 'baseline',
      gap: `${token.marginXXS}px`,
      minWidth: 0,
    },

    '.card-exchange__name': {
      fontSize: `${token.fontSizeLG}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.card-exchange__role': {
      color: token.colorTextSecondary,
      fontSize: `${token.fontSizeSM}px`,
    },

    '.card-exchange__logo': {
      marginInlineStart: 'auto',
      fontSize: `${token.fontSizeSM}px`,
      fontWeight: token.fontWeightStrong,
      whiteSpace: 'nowrap',
    },

    '.card-exchange__company': {
      marginTop: `${token.margin}px`,
      marginBottom: `${token.marginLG}px`,
      color: token.colorTextSecondary,
      minHeight: `${token.controlHeightSM}px`,
    },

    '.card-exchange__action': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: `${token.marginXXS}px`,
    },

    '.card-exchange__action-icon': {
      marginInlineEnd: `${token.marginXXS}px`,
    },
  }
})
</script>
