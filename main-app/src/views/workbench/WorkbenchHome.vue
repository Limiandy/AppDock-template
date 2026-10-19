<template>
  <div :class="[scopeClass, className]">
    <a-card :bordered="false" class="workbench-card">
      <div class="workbench-card__head">
        <span class="workbench-card__title">待处理报名和申请</span>
        <a-button class="workbench-card__publish" @click="onPublish('发布招募')">
          <SvgIcon name="app:publish" class="workbench-card__publish-icon" />
          发布招募
        </a-button>
      </div>
      <a-row :gutter="[16, 16]">
        <a-col v-for="item in workbenchPending" :key="item.key" :xs="24" :sm="12" :xl="6">
          <div class="workbench-kpi">
            <div class="workbench-kpi__label">{{ item.label }}</div>
            <div class="workbench-kpi__value">
              {{ item.value }}
              <span class="workbench-kpi__unit">{{ item.unit }}</span>
            </div>
            <a class="workbench-kpi__link" @click="onPublish(item.label)">
              立即处理
              <SvgIcon name="solar:alt-arrow-right-outline" />
            </a>
            <SvgIcon :name="item.icon" class="workbench-kpi__icon" />
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card :bordered="false" class="workbench-card">
      <div class="workbench-card__head">
        <span class="workbench-card__title">待处理招标</span>
        <a-button class="workbench-card__publish" @click="onPublish('发布招标')">
          <SvgIcon name="app:publish" class="workbench-card__publish-icon" />
          发布招标
        </a-button>
      </div>
      <a-row :gutter="[16, 16]">
        <a-col v-for="item in workbenchTender" :key="item.key" :xs="24" :sm="12" :xl="6">
          <div class="workbench-kpi">
            <div class="workbench-kpi__label">{{ item.label }}</div>
            <div class="workbench-kpi__value">
              {{ item.value }}
              <span class="workbench-kpi__unit">{{ item.unit }}</span>
            </div>
            <a class="workbench-kpi__link" @click="onPublish(item.label)">
              立即处理
              <SvgIcon name="solar:alt-arrow-right-outline" />
            </a>
            <SvgIcon :name="item.icon" class="workbench-kpi__icon" />
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :xl="16">
        <a-card :bordered="false" class="workbench-card">
          <div class="workbench-card__head">
            <a-tabs v-model:active-key="messageTab" class="workbench-card__tabs">
              <a-tab-pane key="messages" tab="我的消息" />
              <a-tab-pane key="notices" tab="平台公告" />
            </a-tabs>
            <a class="workbench-card__more" @click="onPublish('查看更多消息')">查看更多</a>
          </div>
          <ul class="workbench-messages">
            <li v-for="item in currentMessages" :key="item.id" class="workbench-message">
              <div class="workbench-message__title">
                <span class="workbench-message__tag">【{{ item.tag }}】</span>
                {{ item.title }}
              </div>
              <div class="workbench-message__desc">{{ item.desc }}</div>
              <div class="workbench-message__date">{{ item.date }}</div>
            </li>
          </ul>
        </a-card>

        <a-card :bordered="false" class="workbench-card workbench-newbie">
          <div class="workbench-newbie__title">新手任务</div>
          <p class="workbench-newbie__text">
            恭喜您！已成为云采购认证采购商，在正式发布招募/招标信息之前，建议您先完成以下几项新手任务
          </p>
          <a-space :size="12" wrap>
            <a-tag v-for="task in newbieTasks" :key="task" color="geekblue">{{ task }}</a-tag>
          </a-space>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="8">
        <a-card :bordered="false" class="workbench-card">
          <div class="workbench-card__head">
            <span class="workbench-card__title">我的业绩</span>
          </div>
          <div class="workbench-performance">
            <button type="button" class="workbench-performance__arrow" aria-label="上一项业绩" @click="shiftMetric(-1)">
              <SvgIcon name="solar:alt-arrow-left-outline" />
            </button>
            <div class="workbench-performance__main">
              <div class="workbench-performance__label">{{ performance.label }}</div>
              <div class="workbench-performance__total">{{ performance.total }} {{ performance.unit }}</div>
              <div ref="chartRef" class="workbench-performance__chart"></div>
            </div>
            <button type="button" class="workbench-performance__arrow" aria-label="下一项业绩" @click="shiftMetric(1)">
              <SvgIcon name="solar:alt-arrow-right-outline" />
            </button>
          </div>
        </a-card>

        <a-card :bordered="false" class="workbench-card">
          <div class="workbench-card__head">
            <span class="workbench-card__title">平台动态</span>
            <a class="workbench-card__more" @click="onPublish('查看更多平台动态')">查看更多</a>
          </div>
          <div class="workbench-dynamics">
            <span>认证供应商 {{ platformDynamics.certified }} 家</span>
            <span>本周新增 {{ platformDynamics.weeklyNew }} 家</span>
          </div>
          <ul class="workbench-suppliers">
            <li v-for="item in platformDynamics.suppliers" :key="item.id" class="workbench-supplier">
              <span class="workbench-supplier__logo" :style="{ color: item.logoColor }">{{ item.logoText }}</span>
              <div class="workbench-supplier__info">
                <div class="workbench-supplier__name">{{ item.name }}</div>
                <div class="workbench-supplier__meta">
                  {{ item.capital }}注册资本 · {{ item.scope }} · {{ item.year }}
                </div>
              </div>
            </li>
          </ul>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import { SvgIcon } from 'common'
import {
  platformDynamics,
  workbenchBoardNotices,
  workbenchMessages,
  workbenchPending,
  workbenchPerformanceMetrics,
  workbenchTender,
} from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const global = useGlobalStore()
const messageTab = ref<'messages' | 'notices'>('messages')
const newbieTasks = ['完善公司资料', '发布第一个招募', '邀请同事协作', '导入供应商名单']
const currentMessages = computed(() => (messageTab.value === 'messages' ? workbenchMessages : workbenchBoardNotices))

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined

const performanceIndex = ref(0)
const performance = computed(() => workbenchPerformanceMetrics[performanceIndex.value])

function shiftMetric(step: number) {
  const total = workbenchPerformanceMetrics.length
  performanceIndex.value = (performanceIndex.value + step + total) % total
}

function renderChart() {
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  chart.setOption(
    {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#596078' } },
      series: [
        {
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: performance.value.sources.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: ['#546FFD', '#55C5CD', '#6C5EE7'][index] },
          })),
        },
      ],
    },
    true,
  )
}

watch(performance, () => renderChart())

function onResize() {
  chart?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
})

function onPublish(action: string) {
  global.message.info(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('workbench', (token) => ({
  'padding': `${token.padding}px`,
  'background': token.colorBgLayout,

  '.workbench-card': {
    'marginBottom': `${token.margin}px`,
    'border-radius': `${token.borderRadiusLG}px`,

    [`${(token as any).rootCls ?? '.ant'}-card-body`]: {
      padding: `${token.paddingLG}px`,
    },
  },

  '.workbench-card__head': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: `${token.margin}px`,
  },

  '.workbench-card__title': {
    fontSize: `${token.fontSizeLG}px`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.workbench-card__publish': {
    'color': token.colorWarning,
    'borderColor': token.colorWarningBorder,
    'background': token.colorBgContainer,

    '&:hover': {
      color: token.colorWarningHover,
      borderColor: token.colorWarningBorderHover,
    },
  },

  '.workbench-card__publish-icon': {
    marginInlineEnd: `${token.marginXXS}px`,
  },

  '.workbench-card__tabs': {
    flex: 1,

    [`${(token as any).rootCls ?? '.ant'}-tabs-nav`]: {
      marginBottom: 0,
    },
  },

  '.workbench-card__more': {
    color: token.colorTextSecondary,
  },

  '.workbench-kpi': {
    position: 'relative',
    padding: `${token.padding}px ${token.paddingLG}px`,
    border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    borderRadius: `${token.borderRadiusLG}px`,
    background: token.colorBgContainer,
  },

  '.workbench-kpi__label': {
    color: token.colorTextSecondary,
    fontSize: `${token.fontSize}px`,
  },

  '.workbench-kpi__value': {
    marginTop: `${token.marginSM}px`,
    fontSize: `${token.fontSizeXL}px`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.workbench-kpi__unit': {
    marginInlineStart: `${token.marginXXS}px`,
    fontSize: `${token.fontSizeSM}px`,
    color: token.colorTextSecondary,
  },

  '.workbench-kpi__link': {
    'display': 'inline-flex',
    'alignItems': 'center',
    'gap': `${token.marginXXS}px`,
    'marginTop': `${token.marginXS}px`,
    'fontSize': `${token.fontSizeSM}px`,
    'color': token.colorTextTertiary,

    '&:hover': {
      color: token.colorPrimary,
    },
  },

  '.workbench-kpi__icon': {
    position: 'absolute',
    top: `${token.padding}px`,
    insetInlineEnd: `${token.paddingLG}px`,
    fontSize: `${token.fontSizeHeading4}px`,
    color: token.colorPrimary,
  },

  '.workbench-messages': {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  '.workbench-message': {
    position: 'relative',
    paddingBlock: `${token.paddingSM}px`,
    paddingInlineEnd: '120px',
    borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
  },

  '.workbench-message__title': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.workbench-message__tag': {
    color: token.colorError,
  },

  '.workbench-message__desc': {
    marginTop: `${token.marginXXS}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.workbench-message__date': {
    position: 'absolute',
    top: `${token.paddingSM}px`,
    insetInlineEnd: 0,
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.workbench-newbie__title': {
    fontSize: `${token.fontSizeLG}px`,
    fontWeight: token.fontWeightStrong,
    marginBottom: `${token.marginXS}px`,
  },

  '.workbench-newbie__text': {
    margin: `0 0 ${token.margin}px`,
    color: token.colorTextSecondary,
  },

  '.workbench-performance': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginXS}px`,
  },

  '.workbench-performance__main': {
    flex: 1,
    minWidth: 0,
  },

  '.workbench-performance__label': {
    color: token.colorTextSecondary,
    fontSize: `${token.fontSize}px`,
  },

  '.workbench-performance__total': {
    marginTop: `${token.marginXXS}px`,
    fontSize: `${token.fontSizeHeading2}px`,
    fontWeight: token.fontWeightStrong,
    color: token.colorText,
  },

  '.workbench-performance__chart': {
    // 图表高度随主题密度缩放（紧凑下更矮），不写死像素值
    height: `${token.controlHeightLG * 6}px`,
    marginTop: `${token.marginSM}px`,
  },

  '.workbench-performance__arrow': {
    'display': 'inline-flex',
    'alignItems': 'center',
    'justifyContent': 'center',
    'width': `${token.controlHeightSM}px`,
    'height': `${token.controlHeightSM}px`,
    'color': token.colorIcon,
    'background': 'transparent',
    'border': 'none',
    'borderRadius': `${token.borderRadius}px`,
    'cursor': 'pointer',
    'transition': `color ${token.motionDurationMid}, background-color ${token.motionDurationMid}`,

    '&:hover': {
      color: token.colorPrimary,
      background: token.colorFillTertiary,
    },
  },

  '.workbench-dynamics': {
    display: 'flex',
    gap: `${token.margin}px`,
    color: token.colorTextSecondary,
    fontSize: `${token.fontSizeSM}px`,
    marginBottom: `${token.marginSM}px`,
  },

  '.workbench-suppliers': {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  '.workbench-supplier': {
    display: 'flex',
    alignItems: 'center',
    gap: `${token.marginSM}px`,
    paddingBlock: `${token.paddingSM}px`,
    borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
  },

  '.workbench-supplier__logo': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '64px',
    height: `${token.controlHeightSM}px`,
    paddingInline: `${token.paddingXS}px`,
    border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
    borderRadius: `${token.borderRadiusSM}px`,
    fontWeight: token.fontWeightStrong,
    fontSize: `${token.fontSizeSM}px`,
  },

  '.workbench-supplier__name': {
    color: token.colorText,
  },

  '.workbench-supplier__meta': {
    marginTop: `${token.marginXXS}px`,
    color: token.colorTextTertiary,
    fontSize: `${token.fontSizeSM}px`,
  },
}))
</script>
