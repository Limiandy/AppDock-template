<template>
  <a-collapse v-model:active-key="activeKey" accordion :class="classNames">
    <a-collapse-panel v-for="item in mapTokens" :key="item.key">
      <template #header>
        <collapse-header :title="item.title" :token="item.key" :count="getTokenRef(item.key).value">
          <template #preview>
            <div class="token-panel-pro-token-collapse-map-collapse-preview">
              <div class="token-panel-pro-token-collapse-map-collapse-preview-color">
                <div
                  :style="[
                    previewBlockStyle,
                    !item.key.startsWith('color')
                      ? ({
                          fontSize: `${getTokenRef(item.key).value}px`,
                          fontWeight: '700',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        } as CSSProperties)
                      : null,
                  ]"
                >
                  <component :is="renderChildren(item.key)" />
                </div>
              </div>
            </div>
          </template>
        </collapse-header>
      </template>

      <panel-detail :description="item.description" :components="item.components" :token="item.key" />
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup lang="ts">
import useTokenComputed from '../utils/useTokenComputed.ts'
import PanelDetail from './PanelDetail.vue'
import CollapseHeader from './CollapseHeader.vue'
import { computed, type CSSProperties, h, ref } from 'vue'
import { type TokenKey } from '@/hooks/theme/useTheme.ts'
import useStyle from '@/hooks/style/useStyle.ts'

defineProps<{
  mapTokens: any[]
}>()

const getTokenRef = useTokenComputed()
const activeKey = ref<string[]>([])

const previewBlockStyle = computed(() => {
  return {
    background:
      'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAFpJREFUWAntljEKADAIA23p6v//qQ+wfUEcCu1yriEgp0FHRJSJcnehmmWm1Dv/lO4HIg1AAAKjTqm03ea88zMCCEDgO4HV5bS757f+7wRoAAIQ4B9gByAAgQ3pfiDmXmAeEwAAAABJRU5ErkJggg==") 0% 0% / 28px',
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  } as CSSProperties
})

function renderChildren(key: string) {
  const value = getTokenRef(key as TokenKey).value

  if (key.startsWith('color')) {
    return h('div', {
      style: {
        width: '100%',
        height: '100%',
        transition: 'background-color 0.2s',
        backgroundColor: value,
      },
    })
  }

  if (key.startsWith('font')) {
    return h('span', 'Aa')
  }

  if (key.startsWith('lineHeight')) {
    return h(
      'span',
      {
        style: {
          fontSize: '14px',
          lineHeight: value,
          background: 'rgb(255, 242, 240)',
          paddingInline: '8px',
        },
      },
      'Aa',
    )
  }

  if (key.startsWith('margin')) {
    return h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'rgb(255, 241, 184)',
          transform: ' translate(10%, 10%) scale(0.8)',
        },
      },
      h('div', {
        style: {
          marginLeft: `${value}px`,
          marginTop: `${value}px`,
          width: `calc(100% - ${value}px)`,
          height: `calc(100% - ${value}px)`,
          background: 'rgb(186, 224, 255)',
        },
      }),
    )
  }

  if (key.startsWith('padding')) {
    return h(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: 'rgb(217, 247, 190)',
          transform: 'translate(10%, 10%) scale(0.8)',
          paddingLeft: `${value}px`,
          paddingTop: `${value}px`,
        },
      },
      h('div', { style: { width: '100%', height: '100%', background: 'rgb(186, 224, 255)' } }),
    )
  }

  if (key.startsWith('borderRadius')) {
    return h('div', {
      style: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transform: 'translate(30%, 30%)',
        border: '2px solid rgba(0, 0, 0, 0.45)',
        background: 'rgb(255, 255, 255)',
        borderRadius: `${value}px`,
      },
    })
  }

  if (key.startsWith('boxShadow')) {
    return h('div', {
      style: {
        width: '60%',
        height: '50%',
        borderRadius: '6px',
        background: 'rgb(255, 255, 255)',
        border: '1px solid rgb(217, 217, 217)',
        boxShadow: value,
      },
    })
  }
}

const classNames = useStyle('token-panel-pro-token-collapse-map-collapse', (token) => {
  return {
    '&.ant-collapse': {
      'borderRadius': `${token.borderRadiusSM}px`,
      'backgroundColor': token.colorBgContainer,
      'border': `1px solid ${token.colorBorderSecondary}`,

      '.ant-collapse-item': {
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      },
    },

    '.token-panel-pro-token-collapse-map-collapse-preview-color': {
      borderInline: `1px solid ${token.colorBorderSecondary}`,
    },
  }
})
</script>

<style scoped lang="less">
.token-panel-pro-token-collapse-map-collapse {
  &.ant-collapse {
    :deep(.ant-collapse-header) {
      position: relative;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      padding: 0 8px;
      line-height: 1.5714285714285714;
      cursor: pointer;
      transition:
        all 0.3s,
        visibility 0s;
    }

    :deep(.ant-collapse-content-box) {
      padding: 0;
    }

    .token-panel-pro-token-collapse-map-collapse-preview {
      display: flex;
      flex: none;
      margin-right: 12px;
    }

    .token-panel-pro-token-collapse-map-collapse-preview-color {
      height: 56px;
      width: 56px;
      position: relative;
    }
  }
}
</style>
