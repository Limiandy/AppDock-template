<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <div v-for="group in filterGroups" :key="group.key" class="supplier-filter">
      <span class="supplier-filter__label">{{ group.label }}</span>
      <a-tag
        class="supplier-filter__chip"
        :class="{ 'is-active': group.model.value === undefined }"
        @click="group.model.value = undefined"
      >
        不限
      </a-tag>
      <a-tag
        v-for="option in group.options"
        :key="option"
        class="supplier-filter__chip"
        :class="{ 'is-active': group.model.value === option }"
        @click="group.model.value = option"
      >
        {{ option }}
      </a-tag>
      <a v-if="group.more" class="supplier-filter__more">
        更多
        <SvgIcon name="solar:alt-arrow-down-outline" />
      </a>
      <div v-if="group.key === 'category'" class="supplier-filter__right">
        <a class="supplier-filter__link" @click="notify('批量导入供应商')">批量导入供应商</a>
        <a class="supplier-filter__link" @click="notify('导入记录')">导入记录</a>
      </div>
    </div>

    <div class="supplier-filter">
      <span class="supplier-filter__label">注册资本</span>
      <a-input-number v-model:value="capitalMin" class="supplier-filter__number" placeholder="最低" :min="0" />
      <span class="supplier-filter__dash">-</span>
      <a-input-number v-model:value="capitalMax" class="supplier-filter__number" placeholder="最高" :min="0" />
      <span class="supplier-filter__unit">万</span>
    </div>

    <div class="supplier-toolbar">
      <a-checkbox v-model:checked="allChecked" />
      <span class="supplier-toolbar__title">公司名称</span>
      <span class="supplier-toolbar__count">共 {{ filteredSuppliers.length }} 家企业</span>
      <div class="supplier-toolbar__right">
        <a-select
          v-model:value="qualification"
          class="supplier-toolbar__select"
          placeholder="请选择服务资质"
          allow-clear
          :options="qualificationOptions"
        />
        <a-input-search
          v-model:value="keyword"
          class="supplier-toolbar__search"
          placeholder="搜索供应商名称 / 服务分类"
        />
        <a-button @click="notify('导出到Excel')">
          导出到Excel
          <SvgIcon name="solar:alt-arrow-down-outline" class="supplier-list__icon" />
        </a-button>
      </div>
    </div>

    <div v-for="item in visibleSuppliers" :key="item.id" class="supplier-item">
      <a-checkbox class="supplier-item__check" />
      <div class="supplier-item__body">
        <div class="supplier-item__title">
          <span class="supplier-item__name">{{ item.name }}</span>
          <a-tag v-if="!item.certified">未认证</a-tag>
          <a-tag v-if="item.erpImported" color="geekblue">已导入到ERP</a-tag>
          <a-tag v-for="honor in item.honors" :key="honor" color="volcano">{{ honor }}</a-tag>
          <SvgIcon name="solar:info-circle-outline" class="supplier-item__info" />
        </div>

        <div v-for="field in metaFields" :key="field.key" class="supplier-item__field">
          <span class="supplier-item__label">{{ field.label }}</span>
          <div class="supplier-item__value">
            <template v-if="field.key === 'tags'">
              <a-tag v-for="tagText in item.tags" :key="tagText">{{ tagText }}</a-tag>
              <SvgIcon name="solar:pen-new-square-outline" class="supplier-item__edit" />
            </template>
            <template v-else-if="field.key === 'categories'">
              <span v-for="(categoryText, index) in visibleCategories(item.categories)" :key="categoryText">
                <span v-if="index" class="supplier-item__divider">|</span>
                {{ categoryText }}
              </span>
              <a class="supplier-item__link">
                展开
                <SvgIcon name="solar:alt-arrow-down-outline" />
              </a>
            </template>
            <template v-else>
              {{ item[field.key as keyof typeof item] }}
              <a v-if="field.link" class="supplier-item__link" @click="notify(`${field.label}详情`)">查看详情</a>
            </template>
          </div>
        </div>
      </div>
      <a class="supplier-item__action" @click="notify('操作')">操作</a>
    </div>

    <div class="supplier-pagination">
      <a-pagination
        v-model:current="page"
        :page-size="pageSize"
        :total="filteredSuppliers.length"
        size="small"
        show-less-items
      />
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { SvgIcon } from 'common'
import { suppliers } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const global = useGlobalStore()

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

const categoryOptions = [
  '不限',
  '照明专业设计',
  '方案设计',
  '招标代理',
  '造价咨询',
  '超前钻探',
  '规划设计',
  '电线电缆',
  '其他',
]
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

const reserveSuppliers = suppliers.filter((item) => item.stage === 'reserve')

const filteredSuppliers = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return reserveSuppliers.filter((item) => {
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

const [className, scopeClass] = useStyle('supplier-reserve', (token) => ({
  '.supplier-filter': {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: `${token.marginXS}px`,
    paddingBlock: `${token.paddingXS}px`,
  },

  '.supplier-filter__label': {
    width: '64px',
    color: token.colorTextSecondary,
  },

  '.supplier-filter__chip': {
    'cursor': 'pointer',
    'marginInlineEnd': 0,
    'paddingInline': `${token.paddingSM}px`,
    'borderColor': 'transparent',
    'background': 'transparent',
    'color': token.colorTextSecondary,

    '&:hover': {
      color: token.colorPrimary,
    },

    '&.is-active': {
      color: token.colorPrimary,
      borderColor: token.colorPrimaryBorder,
      background: token.colorPrimaryBg,
    },
  },

  '.supplier-filter__more': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    color: token.colorTextSecondary,
  },

  '.supplier-filter__right': {
    display: 'flex',
    gap: `${token.margin}px`,
    marginInlineStart: 'auto',
  },

  '.supplier-filter__link': {
    color: token.colorPrimary,
  },

  '.supplier-filter__number': {
    width: '110px',
  },

  '.supplier-filter__dash': {
    color: token.colorTextTertiary,
  },

  '.supplier-filter__unit': {
    color: token.colorTextSecondary,
  },

  '.supplier-toolbar': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
    paddingBlock: `${token.paddingSM}px`,
    borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
    marginTop: `${token.marginXS}px`,
  },

  '.supplier-toolbar__title': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.supplier-toolbar__count': {
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.supplier-toolbar__right': {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginInlineStart: 'auto',
  },

  '.supplier-toolbar__select': {
    width: '200px',
  },

  '.supplier-toolbar__search': {
    width: '260px',
  },

  '.supplier-item': {
    'position': 'relative',
    'display': 'flex',
    'gap': `${token.marginXS}px`,
    'padding': `${token.padding}px 0`,
    'borderTop': `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,

    '&:hover': {
      background: token.colorFillQuaternary,
    },
  },

  '.supplier-item__check': {
    marginTop: `${token.marginXS}px`,
  },

  '.supplier-item__body': {
    flex: 1,
    minWidth: 0,
  },

  '.supplier-item__title': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXXS}px`,
    flexWrap: 'wrap',
  },

  '.supplier-item__name': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.supplier-item__info': {
    color: token.colorTextTertiary,
  },

  '.supplier-item__field': {
    display: 'flex',
    gap: `${token.marginXS}px`,
    marginTop: `${token.marginXS}px`,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.supplier-item__label': {
    flexShrink: 0,
    width: '64px',
    color: token.colorTextTertiary,
  },

  '.supplier-item__value': {
    color: token.colorTextSecondary,
    minWidth: 0,
  },

  '.supplier-item__divider': {
    marginInline: `${token.marginXXS}px`,
    color: token.colorSplit,
  },

  '.supplier-item__link': {
    marginInlineStart: `${token.marginXS}px`,
    color: token.colorPrimary,
  },

  '.supplier-item__edit': {
    marginInlineStart: `${token.marginXS}px`,
    color: token.colorTextTertiary,
  },

  '.supplier-item__action': {
    flexShrink: 0,
    color: token.colorTextSecondary,
  },

  '.supplier-pagination': {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: `${token.padding}px`,
  },
}))
</script>
