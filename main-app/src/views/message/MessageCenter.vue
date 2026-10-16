<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <div class="message-center__head">
      <h2 class="message-center__title">消息中心</h2>
      <div class="message-center__head-right">
        <span class="message-center__unread">未读 {{ unreadCount }} 条</span>
        <a-button type="text" @click="markAllRead">全部已读</a-button>
      </div>
    </div>

    <a-tabs v-model:active-key="category" class="message-center__tabs">
      <a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="`${tab.label}（${tab.count}）`" />
    </a-tabs>

    <ul class="message-center__list">
      <li
        v-for="item in visibleMessages"
        :key="item.id"
        class="message-center__item"
        :class="{ 'is-unread': !item.read }"
      >
        <span class="message-center__dot"></span>
        <div class="message-center__body">
          <div class="message-center__item-title">
            <span class="message-center__tag">【{{ item.tag }}】</span>
            {{ item.title }}
          </div>
          <div class="message-center__item-desc">{{ item.desc }}</div>
        </div>
        <span class="message-center__date">{{ item.date }}</span>
        <div class="message-center__actions">
          <a @click="onDetail(item)">查看详情</a>
          <a v-if="!item.read" @click="markRead(item)">标记已读</a>
        </div>
      </li>
    </ul>

    <a-empty v-if="!visibleMessages.length" description="暂无消息" />

    <div class="message-center__pagination">
      <a-pagination v-model:current="page" :page-size="pageSize" :total="filteredMessages.length" size="small" />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { messageCenter, type MessageRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import { pageInsetStyles } from '@/hooks/style/pageStyles'

const global = useGlobalStore()
const records = ref<MessageRecord[]>(messageCenter.map((item) => ({ ...item })))
const category = ref<MessageRecord['category']>('我的消息')
const page = ref(1)
const pageSize = 5

const categories: MessageRecord['category'][] = ['我的消息', '平台公告', '系统通知']

const tabs = computed(() =>
  categories.map((key) => ({
    key,
    label: key,
    count: records.value.filter((item) => item.category === key).length,
  })),
)

const unreadCount = computed(() => records.value.filter((item) => !item.read).length)

const filteredMessages = computed(() => records.value.filter((item) => item.category === category.value))

const visibleMessages = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredMessages.value.slice(start, start + pageSize)
})

function markRead(record: MessageRecord) {
  record.read = true
  global.message.success('原型演示：已标记为已读')
}

function markAllRead() {
  records.value.forEach((item) => (item.read = true))
  global.message.success('原型演示：全部消息已读')
}

function onDetail(record: MessageRecord) {
  global.message.info(`原型演示：打开「${record.title}」详情`)
}

const [className, scopeClass] = useStyle('message-center', (token) => ({
  ...pageInsetStyles(token),

  '.message-center__head': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: `${token.marginXS}px`,
  },

  '.message-center__title': {
    margin: 0,
    fontSize: `${token.fontSizeHeading4}px`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.message-center__head-right': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
  },

  '.message-center__unread': {
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.message-center__tabs': {
    [`${(token as any).rootCls ?? '.ant'}-tabs-nav`]: {
      marginBottom: 0,
    },
  },

  '.message-center__list': {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  '.message-center__item': {
    'position': 'relative',
    'display': 'flex',
    'alignItems': 'flex-start',
    'gap': `${token.marginSM}px`,
    'padding': `${token.padding}px 0`,
    'borderBottom': `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,

    '&:hover': {
      background: token.colorFillQuaternary,
    },

    '&.is-unread .message-center__dot': {
      background: token.colorError,
    },
  },

  '.message-center__dot': {
    flexShrink: 0,
    width: '6px',
    height: '6px',
    marginTop: `${token.marginXS}px`,
    borderRadius: '50%',
    background: 'transparent',
  },

  '.message-center__body': {
    flex: 1,
    minWidth: 0,
  },

  '.message-center__item-title': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.message-center__tag': {
    color: token.colorError,
  },

  '.message-center__item-desc': {
    marginTop: `${token.marginXXS}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.message-center__date': {
    flexShrink: 0,
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.message-center__actions': {
    display: 'flex',
    flexShrink: 0,
    gap: `${token.margin}px`,
    color: token.colorTextSecondary,
  },

  '.message-center__pagination': {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: `${token.padding}px`,
  },
}))
</script>
