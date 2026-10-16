<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <p class="supplier-list__desc">{{ config.description }}</p>

    <div v-for="group in filterGroups" :key="group.key" class="supplier-list__filter">
      <span class="supplier-list__filter-label">{{ group.label }}</span>
      <a-tag
        class="supplier-list__chip"
        :class="{ 'is-active': group.model.value === undefined }"
        @click="group.model.value = undefined"
      >
        不限
      </a-tag>
      <a-tag
        v-for="option in group.options"
        :key="option"
        class="supplier-list__chip"
        :class="{ 'is-active': group.model.value === option }"
        @click="group.model.value = option"
      >
        {{ option }}
      </a-tag>
      <a v-if="group.more" class="supplier-list__more">
        更多
        <SvgIcon name="solar:alt-arrow-down-outline" />
      </a>
      <div v-if="group.key === 'category'" class="supplier-list__filter-right">
        <a v-for="action in config.toolbar" :key="action.key" class="supplier-list__link" @click="notify(action.label)">
          {{ action.label }}
        </a>
      </div>
    </div>

    <div class="supplier-list__filter">
      <span class="supplier-list__filter-label">注册资本</span>
      <a-input-number v-model:value="capitalMin" class="supplier-list__number" placeholder="最低" :min="0" />
      <span class="supplier-list__dash">-</span>
      <a-input-number v-model:value="capitalMax" class="supplier-list__number" placeholder="最高" :min="0" />
      <span class="supplier-list__unit">万</span>
    </div>

    <div class="supplier-list__toolbar">
      <a-checkbox v-model:checked="allChecked" />
      <span class="supplier-list__toolbar-title">公司名称</span>
      <span class="supplier-list__toolbar-count">共 {{ filteredSuppliers.length }} 家企业</span>
      <div class="supplier-list__toolbar-right">
        <a-select
          v-model:value="qualification"
          class="supplier-list__select"
          placeholder="请选择服务资质"
          allow-clear
          :options="qualificationOptions"
        />
        <a-input-search v-model:value="keyword" class="supplier-list__search" placeholder="搜索供应商名称 / 服务分类" />
        <a-button @click="notify('导出到Excel')">
          导出到Excel
          <SvgIcon name="solar:alt-arrow-down-outline" class="supplier-list__icon" />
        </a-button>
      </div>
    </div>

    <div v-for="item in visibleSuppliers" :key="item.id" class="supplier-list__item">
      <a-checkbox class="supplier-list__check" />
      <div class="supplier-list__body">
        <div class="supplier-list__title">
          <a class="supplier-list__name" @click="openDetail(item)">{{ item.name }}</a>
          <a-tag v-if="!item.certified">未认证</a-tag>
          <a-tag v-if="item.erpImported" color="geekblue">已导入到ERP</a-tag>
          <a-tag v-for="honor in item.honors" :key="honor" color="volcano">{{ honor }}</a-tag>
          <SvgIcon name="solar:info-circle-outline" class="supplier-list__info" />
        </div>

        <div v-for="field in metaFields" :key="field.key" class="supplier-list__field">
          <span class="supplier-list__field-label">{{ field.label }}</span>
          <div class="supplier-list__field-value">
            <template v-if="field.key === 'tags'">
              <a-tag v-for="tagText in item.tags" :key="tagText">{{ tagText }}</a-tag>
              <SvgIcon name="solar:pen-new-square-outline" class="supplier-list__edit" />
            </template>
            <template v-else-if="field.key === 'categories'">
              <span v-for="(categoryText, index) in visibleCategories(item.categories)" :key="categoryText">
                <span v-if="index" class="supplier-list__divider">|</span>
                {{ categoryText }}
              </span>
              <a v-if="item.categories.length > 3" class="supplier-list__link">
                展开
                <SvgIcon name="solar:alt-arrow-down-outline" />
              </a>
            </template>
            <template v-else>
              {{ item[field.key as keyof typeof item] }}
              <a v-if="field.link" class="supplier-list__link" @click="notify(`${field.label}详情`)">查看详情</a>
            </template>
          </div>
        </div>
      </div>

      <div class="supplier-list__actions">
        <template v-for="action in config.rowActions" :key="action.key">
          <a
            class="supplier-list__action"
            :class="{ 'is-danger': action.danger }"
            @click="onRowAction(action.label, item)"
          >
            {{ action.label }}
          </a>
        </template>
      </div>
    </div>

    <a-empty v-if="!visibleSuppliers.length" description="暂无符合条件的供应商" />

    <div class="supplier-list__pagination">
      <a-pagination
        v-model:current="page"
        :page-size="pageSize"
        :total="filteredSuppliers.length"
        size="small"
        show-less-items
      />
    </div>

    <SupplierDetailDrawer v-model:open="detailOpen" :record="detailRecord" />
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SvgIcon } from 'common'
import { suppliers, type SupplierRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import SupplierDetailDrawer from '@/views/supplier/SupplierDetailDrawer.vue'
import useStyle from '@/hooks/style/useStyle.ts'
import { filterChipStyles, filterRowStyles, pageInsetStyles } from '@/hooks/style/pageStyles'

type SupplierStage = SupplierRecord['stage']

interface StageAction {
  key: string
  label: string
  danger?: boolean
}

interface StageConfig {
  description: string
  toolbar: StageAction[]
  rowActions: StageAction[]
}

const stageConfig: Record<SupplierStage, StageConfig> = {
  screening: {
    description: '招募报名后待初筛的供应商',
    toolbar: [
      { key: 'import', label: '批量导入供应商' },
      { key: 'importRecord', label: '导入记录' },
    ],
    rowActions: [
      { key: 'detail', label: '详情' },
      { key: 'store', label: '入库' },
      { key: 'reject', label: '标记不合格' },
    ],
  },
  reserve: {
    description: '已入库的储备供应商',
    toolbar: [
      { key: 'import', label: '批量导入供应商' },
      { key: 'importRecord', label: '导入记录' },
    ],
    rowActions: [
      { key: 'detail', label: '详情' },
      { key: 'favorite', label: '收藏' },
      { key: 'remove', label: '移除' },
    ],
  },
  favorite: {
    description: '收藏的重点供应商',
    toolbar: [{ key: 'export', label: '导出到Excel' }],
    rowActions: [
      { key: 'detail', label: '详情' },
      { key: 'unfavorite', label: '取消收藏' },
    ],
  },
  recycle: {
    description: '被移除的供应商，可恢复或彻底删除',
    toolbar: [
      { key: 'restore', label: '批量恢复' },
      { key: 'purge', label: '彻底删除', danger: true },
    ],
    rowActions: [
      { key: 'restore', label: '恢复' },
      { key: 'purge', label: '彻底删除', danger: true },
    ],
  },
  supplement: {
    description: '待补充资质与联系资料的供应商',
    toolbar: [{ key: 'notify', label: '批量通知补充' }],
    rowActions: [
      { key: 'notify', label: '通知补充' },
      { key: 'detail', label: '详情' },
    ],
  },
  rejected: {
    description: '初筛或考察判定不合格的供应商',
    toolbar: [{ key: 'export', label: '导出到Excel' }],
    rowActions: [
      { key: 'detail', label: '详情' },
      { key: 'moveRecycle', label: '移入回收站' },
    ],
  },
}

const props = defineProps<{ stage: SupplierStage }>()

const global = useGlobalStore()
const config = computed(() => stageConfig[props.stage])

const category = ref<string>()
const tag = ref<string>()
const source = ref<string>()
const imported = ref<string>()
const capitalMin = ref<number>()
const capitalMax = ref<number>()
const qualification = ref<string>()
const keyword = ref('')
const allChecked = ref(false)
const page = ref(1)
const pageSize = 5
const detailOpen = ref(false)
const detailRecord = ref<SupplierRecord>()

const categoryOptions = ['照明专业设计', '方案设计', '招标代理', '造价咨询', '超前钻探', '规划设计', '电线电缆', '其他']
const tagOptions = ['第五批联合采购单位', '第六批联合采购单位', '第七批联合采购单位', '第八批联合采购单位']
const sourceOptions = ['直接入库', '招募招标报名', '线下导入', '主动入库', 'ERP邀请', '对接会']
const importedOptions = ['已导入到ERP']
const qualificationOptions = ['工程咨询单位-电子系统工程甲级', '特种设备安装改造维修单位A', '电梯安装维护改造A级']

const filterGroups = [
  { key: 'category', label: '服务分类', options: categoryOptions, model: category, more: true },
  { key: 'tag', label: '标签', options: tagOptions, model: tag },
  { key: 'source', label: '来源', options: sourceOptions, model: source },
  { key: 'imported', label: '已导入', options: importedOptions, model: imported },
]

const metaFields = [
  { key: 'tags', label: '标签' },
  { key: 'categories', label: '服务分类' },
  { key: 'capital', label: '注册资本' },
  { key: 'areas', label: '服务地区' },
  { key: 'cases', label: '案例' },
  { key: 'inspectResult', label: '考察结果', link: true },
  { key: 'performance', label: '履约评价', link: true },
]

const stageSuppliers = computed(() => suppliers.filter((item) => item.stage === props.stage))

const filteredSuppliers = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return stageSuppliers.value.filter((item) => {
    if (category.value && !item.categories.some((entry) => entry.includes(category.value as string))) return false
    if (tag.value && !item.tags.includes(tag.value)) return false
    if (capitalMin.value !== undefined && item.capitalValue < capitalMin.value) return false
    if (capitalMax.value !== undefined && item.capitalValue > capitalMax.value) return false
    if (qualification.value && !item.categories.includes(qualification.value)) return false
    if (text && !`${item.name}${item.categories.join('')}`.toLowerCase().includes(text)) return false
    return true
  })
})

const visibleSuppliers = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredSuppliers.value.slice(start, start + pageSize)
})

function visibleCategories(list: string[]) {
  return list.slice(0, 3)
}

function notify(action: string) {
  global.message.info(`原型演示：${action}`)
}

function onRowAction(label: string, record: SupplierRecord) {
  if (label === '详情') {
    openDetail(record)
    return
  }

  global.message.info(`原型演示：${record.name} · ${label}`)
}

function openDetail(record: SupplierRecord) {
  detailRecord.value = record
  detailOpen.value = true
}

const [className, scopeClass] = useStyle('supplier-list', (token) => ({
  ...pageInsetStyles(token),

  '.supplier-list__desc': {
    margin: `0 0 ${token.marginSM}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSize}px`,
  },

  '.supplier-list__filter': filterRowStyles(token),

  '.supplier-list__filter-label': {
    width: '64px',
    color: token.colorTextSecondary,
  },

  '.supplier-list__chip': filterChipStyles(token),

  '.supplier-list__more': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    color: token.colorTextSecondary,
  },

  '.supplier-list__filter-right': {
    display: 'flex',
    gap: `${token.margin}px`,
    marginInlineStart: 'auto',
  },

  '.supplier-list__link': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    color: token.colorPrimary,
  },

  '.supplier-list__number': {
    width: '110px',
  },

  '.supplier-list__dash': {
    color: token.colorTextTertiary,
  },

  '.supplier-list__unit': {
    color: token.colorTextSecondary,
  },

  '.supplier-list__toolbar': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
    paddingBlock: `${token.paddingSM}px`,
    borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
    marginTop: `${token.marginXS}px`,
  },

  '.supplier-list__toolbar-title': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.supplier-list__toolbar-count': {
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.supplier-list__toolbar-right': {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginInlineStart: 'auto',
  },

  '.supplier-list__select': {
    width: '200px',
  },

  '.supplier-list__search': {
    width: '260px',
  },

  '.supplier-list__icon': {
    marginInlineStart: `${token.marginXXS}px`,
  },

  '.supplier-list__item': {
    'position': 'relative',
    'display': 'flex',
    'gap': `${token.marginXS}px`,
    'padding': `${token.padding}px 0`,
    'borderTop': `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },

  '.supplier-list__check': {
    marginTop: `${token.marginXS}px`,
  },

  '.supplier-list__body': {
    flex: 1,
    minWidth: 0,
  },

  '.supplier-list__title': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXXS}px`,
    flexWrap: 'wrap',
  },

  '.supplier-list__name': {
    'color': token.colorText,
    'fontWeight': token.fontWeightStrong,

    '&:hover': {
      color: token.colorPrimary,
    },
  },

  '.supplier-list__info': {
    color: token.colorTextTertiary,
  },

  '.supplier-list__field': {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginTop: `${token.marginXS}px`,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.supplier-list__field-label': {
    flexShrink: 0,
    width: '64px',
    color: token.colorTextTertiary,
  },

  '.supplier-list__field-value': {
    color: token.colorTextSecondary,
    minWidth: 0,
  },

  '.supplier-list__divider': {
    marginInline: `${token.marginXXS}px`,
    color: token.colorSplit,
  },

  '.supplier-list__edit': {
    marginInlineStart: `${token.marginXS}px`,
    color: token.colorTextTertiary,
  },

  '.supplier-list__actions': {
    display: 'flex',
    flexShrink: 0,
    gap: `${token.margin}px`,
    alignItems: 'flex-start',
  },

  '.supplier-list__action': {
    'color': token.colorTextSecondary,

    '&:hover': {
      color: token.colorPrimary,
    },

    '&.is-danger': {
      'color': token.colorError,

      '&:hover': {
        color: token.colorErrorHover,
      },
    },
  },

  '.supplier-list__pagination': {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: `${token.padding}px`,
  },
}))
</script>
