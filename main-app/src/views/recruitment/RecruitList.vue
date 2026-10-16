<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <a-tabs v-model:active-key="owner" class="recruit-list__tabs">
      <a-tab-pane key="我负责的" :tab="`我负责的招募（${mineCount}）`" />
      <a-tab-pane key="公司其他" :tab="`公司其他招募（${otherCount}）`" />
    </a-tabs>

    <div class="recruit-list__filter">
      <span class="recruit-list__filter-label">处理状态</span>
      <a-tag
        v-for="option in processOptions"
        :key="option"
        class="recruit-list__chip"
        :class="{ 'is-active': processState === option }"
        @click="processState = option"
      >
        {{ option }}
      </a-tag>
      <span class="recruit-list__filter-label">招募状态</span>
      <a-tag
        v-for="option in statusOptions"
        :key="option"
        class="recruit-list__chip"
        :class="{ 'is-active': recruitState === option }"
        @click="recruitState = option"
      >
        {{ option }}
      </a-tag>
    </div>

    <div class="recruit-list__toolbar">
      <a-checkbox v-model:checked="allChecked" />
      <span class="recruit-list__toolbar-label">全选</span>
      <a-button type="text" @click="notify('筛选')">
        <SvgIcon name="solar:filter-outline" />
        筛选
      </a-button>
      <div class="recruit-list__toolbar-right">
        <a-input-search v-model:value="keyword" placeholder="搜索供应商名称 / 服务分类" style="width: 240px" />
        <a-button @click="notify('将招募共享给同事')">将招募共享给同事</a-button>
        <a-button class="recruit-list__publish" @click="notify('发布新招募')">
          <SvgIcon name="app:publish" class="recruit-list__publish-icon" />
          发布新招募
        </a-button>
      </div>
    </div>

    <div v-for="item in visibleRecruits" :key="item.id" class="recruit-list__item">
      <a-checkbox class="recruit-list__check" />
      <div class="recruit-list__main">
        <div class="recruit-list__title">
          <span class="recruit-list__name">{{ item.title }}</span>
          <a-tag v-if="item.pendingBadge" color="volcano">{{ item.pendingBadge }}</a-tag>
        </div>
        <div class="recruit-list__requirement">{{ item.requirement }}</div>
        <div class="recruit-list__footer">
          <SvgIcon name="solar:clock-circle-outline" />
          <span>{{ item.publishedAt }}发布</span>
          <a-button size="small" type="primary" ghost @click="notify('分享')">
            <SvgIcon name="solar:square-share-line-outline" />
            分享
          </a-button>
          <span class="recruit-list__handlers">
            <a-avatar
              v-for="(initial, avatarIndex) in item.handlerInitials"
              :key="avatarIndex"
              :size="20"
              class="recruit-list__avatar"
            >
              {{ initial }}
            </a-avatar>
            {{ item.handlers }}
          </span>
        </div>
      </div>
      <div class="recruit-list__stats">
        <div v-for="stat in statFields(item)" :key="stat.label" class="recruit-list__stat">
          <span class="recruit-list__stat-value">{{ stat.value }}</span>
          <span class="recruit-list__stat-label">{{ stat.label }}</span>
        </div>
      </div>
      <div class="recruit-list__actions">
        <a v-for="action in actions" :key="action" @click="notify(action)">{{ action }}</a>
      </div>
    </div>

    <div class="recruit-list__pagination">
      <a-pagination v-model:current="page" :page-size="pageSize" :total="filteredRecruits.length" size="small" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SvgIcon } from 'common'
import { recruits, type RecruitRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import { filterChipStyles, filterRowStyles, pageInsetStyles } from '@/hooks/style/pageStyles'

const global = useGlobalStore()

const owner = ref<'我负责的' | '公司其他'>('我负责的')
const processState = ref('全部')
const recruitState = ref('全部')
const keyword = ref('')
const allChecked = ref(false)
const page = ref(1)
const pageSize = 5
const actions = ['编辑', '查看', '截止']

const processOptions = ['全部', `待处理（${recruits.filter((item) => item.pendingBadge).length}）`, '已处理']
const statusOptions = [
  '全部',
  `报名中（${recruits.filter((item) => item.status === '报名中').length}）`,
  `报名截止（${recruits.filter((item) => item.status === '报名截止').length}）`,
]

const mineCount = computed(() => recruits.filter((item) => item.owner === '我负责的').length)
const otherCount = computed(() => recruits.filter((item) => item.owner === '公司其他').length)

const filteredRecruits = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return recruits.filter((item) => {
    if (item.owner !== owner.value) return false
    if (processState.value.startsWith('待处理') && !item.pendingBadge) return false
    if (processState.value === '已处理' && item.pendingBadge) return false
    if (recruitState.value.startsWith('报名中') && item.status !== '报名中') return false
    if (recruitState.value.startsWith('报名截止') && item.status !== '报名截止') return false
    if (text && !item.title.toLowerCase().includes(text)) return false
    return true
  })
})

const visibleRecruits = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRecruits.value.slice(start, start + pageSize)
})

function statFields(item: RecruitRecord) {
  return [
    { label: '已报名', value: item.applied },
    { label: '未查看', value: item.unviewed },
    { label: '已入库', value: item.stored },
  ]
}

function notify(action: string) {
  global.message.info(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('recruit-list', (token) => ({
  ...pageInsetStyles(token),

  '.recruit-list__tabs': {
    [`${(token as any).rootCls ?? '.ant'}-tabs-nav`]: { marginBottom: 0 },
  },

  '.recruit-list__filter': filterRowStyles(token),

  '.recruit-list__filter-label': {
    color: token.colorTextSecondary,
    marginInlineEnd: `${token.marginXS}px`,
  },

  '.recruit-list__chip': filterChipStyles(token),

  '.recruit-list__toolbar': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
    paddingBlock: `${token.paddingSM}px`,
    borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
  },

  '.recruit-list__toolbar-label': {
    color: token.colorTextSecondary,
  },

  '.recruit-list__toolbar-right': {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginInlineStart: 'auto',
  },

  '.recruit-list__publish': {
    'color': token.colorWarning,
    'borderColor': token.colorWarningBorder,

    '&:hover': {
      color: token.colorWarningHover,
      borderColor: token.colorWarningBorderHover,
    },
  },

  '.recruit-list__publish-icon': {
    marginInlineEnd: `${token.marginXXS}px`,
  },

  '.recruit-list__item': {
    'position': 'relative',
    'display': 'flex',
    'gap': `${token.marginXS}px`,
    'padding': `${token.padding}px`,
    'border': `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    'borderRadius': `${token.borderRadiusLG}px`,
    'marginBottom': `${token.marginXS}px`,
    'background': token.colorBgContainer,

    '&:hover': {
      boxShadow: token.boxShadowTertiary,
    },
  },

  '.recruit-list__check': {
    marginTop: `${token.marginXS}px`,
  },

  '.recruit-list__main': {
    flex: 1,
    minWidth: 0,
  },

  '.recruit-list__title': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
  },

  '.recruit-list__name': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.recruit-list__requirement': {
    marginTop: `${token.marginXS}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.recruit-list__footer': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
    marginTop: `${token.marginSM}px`,
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.recruit-list__handlers': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${token.marginXXS}px`,
    color: token.colorTextTertiary,
  },

  '.recruit-list__avatar': {
    background: token.colorFillSecondary,
    color: token.colorTextSecondary,
    fontSize: '10px',
  },

  '.recruit-list__stats': {
    display: 'flex',
    gap: `${token.marginLG}px`,
    paddingInline: `${token.padding}px`,
  },

  '.recruit-list__stat': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },

  '.recruit-list__stat-value': {
    color: token.colorText,
    fontSize: `${token.fontSizeLG}px`,
    fontWeight: token.fontWeightStrong,
  },

  '.recruit-list__stat-label': {
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.recruit-list__actions': {
    display: 'flex',
    gap: `${token.margin}px`,
    alignItems: 'flex-end',
    color: token.colorTextSecondary,
  },

  '.recruit-list__pagination': {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: `${token.paddingSM}px`,
  },
}))
</script>
