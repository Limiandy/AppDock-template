<template>
  <a-drawer
    :open="open"
    :title="record?.name || '供应商详情'"
    placement="right"
    :width="520"
    :class="[scopeClass, className]"
    destroy-on-close
    @close="close"
  >
    <template v-if="record">
      <div class="supplier-detail__badges">
        <a-tag :color="record.certified ? 'cyan' : 'default'">{{ record.certified ? '已认证' : '未认证' }}</a-tag>
        <a-tag v-if="record.erpImported" color="geekblue">已导入到ERP</a-tag>
        <a-tag v-for="honor in record.honors" :key="honor" color="volcano">{{ honor }}</a-tag>
      </div>

      <a-descriptions :column="1" size="small" bordered class="supplier-detail__descriptions">
        <a-descriptions-item label="注册资本">{{ record.capital }}</a-descriptions-item>
        <a-descriptions-item label="服务地区">{{ record.areas }}</a-descriptions-item>
        <a-descriptions-item label="服务分类">
          <div class="supplier-detail__tags">
            <a-tag v-for="category in record.categories" :key="category">{{ category }}</a-tag>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="标签">
          <div class="supplier-detail__tags">
            <a-tag v-for="tag in record.tags" :key="tag">{{ tag }}</a-tag>
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="案例">{{ record.cases }}</a-descriptions-item>
        <a-descriptions-item label="考察结果">
          <a-tag
            :color="record.inspectResult === '优秀' ? 'cyan' : record.inspectResult === '不通过' ? 'default' : 'gold'"
          >
            {{ record.inspectResult }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="履约评价">{{ record.performance }}</a-descriptions-item>
      </a-descriptions>

      <div class="supplier-detail__section">跟进记录</div>
      <a-timeline class="supplier-detail__timeline">
        <a-timeline-item v-for="item in timeline" :key="item.time" :color="item.color">
          <div class="supplier-detail__timeline-title">{{ item.title }}</div>
          <div class="supplier-detail__timeline-desc">{{ item.time }} · {{ item.operator }}</div>
        </a-timeline-item>
      </a-timeline>
    </template>

    <template #footer>
      <a-space>
        <a-button type="primary" @click="notify('编辑资料')">编辑资料</a-button>
        <a-button @click="notify('发起考察')">发起考察</a-button>
        <a-button type="text" @click="close">关闭</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SupplierRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const props = defineProps<{ open: boolean; record?: SupplierRecord }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const global = useGlobalStore()

const timeline = computed(() => {
  const record = props.record
  if (!record) return []

  return [
    { title: '进入供应商库', time: '2021-06-18 10:24', operator: '系统', color: 'blue' },
    {
      title: `完成${record.inspectResult === '不通过' ? '初次考察（不通过）' : '工厂考察'}`,
      time: '2021-07-20 15:02',
      operator: '吴兴江',
      color: record.inspectResult === '不通过' ? 'red' : 'green',
    },
    { title: '更新标签与服务分类', time: '2021-07-28 09:11', operator: '尹先森', color: 'gray' },
  ]
})

function close() {
  emit('update:open', false)
}

function notify(action: string) {
  global.message.info(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('supplier-detail', (token) => ({
  '.supplier-detail__badges': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${token.marginXXS}px`,
    marginBottom: `${token.margin}px`,
  },

  '.supplier-detail__descriptions': {
    [`${(token as any).rootCls ?? '.ant'}-descriptions-item-label`]: {
      width: '96px',
      color: token.colorTextSecondary,
      background: token.colorFillAlter,
    },
  },

  '.supplier-detail__tags': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: `${token.marginXXS}px`,
  },

  '.supplier-detail__section': {
    margin: `${token.marginLG}px 0 ${token.margin}px`,
    fontSize: `${token.fontSizeLG}px`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.supplier-detail__timeline-title': {
    color: token.colorText,
  },

  '.supplier-detail__timeline-desc': {
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },
}))
</script>
