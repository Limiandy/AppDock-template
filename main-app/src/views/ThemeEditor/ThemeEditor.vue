<template>
  <div :class="classNames">
    <div class="theme-editor-header">
      <a-typography-title :level="5">主题编辑器</a-typography-title>
      <div>
        <a-button class="theme-editor-header-actions">导 出</a-button>
        <a-button class="theme-editor-header-actions">编 辑</a-button>
        <a-button type="primary" class="theme-editor-header-actions">保 存</a-button>
      </div>
    </div>

    <div class="antd-theme-editor" style="height: calc(-120px + 100vh)">
      <div :style="panelStyle">
        <div class="token-panel-pro" style="flex: 1 1 0%">
          <a-tabs v-model:active-key="activeKey" class="token-panel-pro-tabs" style="height: 100%; flex: 0 0 540px">
            <a-tab-pane v-for="item in seedTokenMap" :key="item.key" :tab="item.title">
              <color-holder :seed-tokens="item.children">
                <template #header>
                  <span style="margin-right: 12px">{{ item.title }}</span>
                  <div
                    v-if="item.key === 'color' || item.key === 'size'"
                    class="theme-editor-icon-switch"
                    style="margin-left: auto"
                    @click="handleChangeTheme(item.key)"
                  >
                    <div
                      class="holder"
                      :class="{
                        leftChecked: (item.key === 'color' && isLight) || (item.key === 'size' && !isCompact),
                      }"
                    >
                      <span class="icon active">
                        <svg-icon v-if="item.key === 'color'" name="solar:sun-outline" />
                        <svg-icon v-if="item.key === 'size'" name="solar:full-screen-outline" />
                      </span>
                      <span class="icon">
                        <svg-icon v-if="item.key === 'color'" name="solar:moon-outline" />
                        <svg-icon v-if="item.key === 'size'" name="solar:quit-full-screen-outline" />
                      </span>
                    </div>
                  </div>
                </template>
              </color-holder>
            </a-tab-pane>
          </a-tabs>

          <div
            class="token-panel-pro-color-alias"
            :style="[
              panelAliasStyle,
              { '--i-margin-top': token.paddingSM * 2 + token.fontSize * token.lineHeight - 1 + 'px' },
            ]"
          >
            <div v-if="!isShowAlias" class="token-panel-pro-color-alias-expand">
              <div class="token-panel-pro-color-alias-expand-handler" @click="handleShowPanelAlias">
                <span role="img" aria-label="right" class="anticon anticon-right" style="font-size: 12px">
                  <svg-icon name="solar:alt-arrow-right-outline" />
                </span>
              </div>
            </div>
            <template v-else>
              <div class="token-panel-pro-color-alias-title">
                <span class="token-panel-pro-color-alias-title-text">Alias Token</span>
                <question-tip
                  title="别名变量（Alias Token）是 Map Token 的别名。Alias Token 用于批量控制某些共性组件的样式。"
                />
                <a-button type="text" style="margin-left: auto" @click="handleShowPanelAlias">
                  <svg-icon name="solar:minimize-outline" />
                </a-button>
              </div>
              <div v-if="aliasTokens?.length" class="token-panel-pro-color-alias-description">
                你可以利用 Alias Token 来精准控制部分组件的效果。例如 Input 、InputNumber、Select 等Control
                类组件都共享了相同的 controlXX token 。只需修改值，即可实现不改变 Button 的情况下，修改 Control
                类组件的效果。
              </div>
              <alias-collapse :alias-tokens="aliasTokens" />
            </template>
          </div>
        </div>
      </div>

      <div :style="containerStyle">11111</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import ColorHolder from './components/ColorHolder.vue'
import QuestionTip from './components/QuestionTip.vue'
import AliasCollapse from './components/AliasCollapse.vue'

import seedTokenMap from './utils/seedTokenMap.ts'
import { type AlgorithmName, useTheme } from '@/hooks/theme/useTheme.ts'
import { useEvent } from '@/hooks/useEvent.ts'
import { theme } from 'ant-design-vue'
import useStyle from '@/hooks/style/useStyle.ts'
const { useToken } = theme
const { token } = useToken()

const { setAlgorithms, currentAlgorithm } = useTheme()

const { eventBus } = useEvent()

const aliasTokens = ref<any[]>([])

eventBus.on('subAliasToken', (tokens) => {
  aliasTokens.value = tokens || []
})

const activeKey = ref('color')

const isShowAlias = ref<boolean>(true)
const panelStyle = computed(() => {
  return {
    flex: `0 0 ${isShowAlias.value ? 740 : 440}px`,
    height: `100%`,
    backgroundColor: token.value.colorBgLayout,
    backgroundImage: `linear-gradient(
      ${token.value.colorBgContainer} 0%,
      ${token.value.colorBgLayout} 100%
)`,
    display: 'flex',
    transition: `0.3s`,
  }
})
const panelAliasStyle = computed(() => {
  return {
    flex: `0 0 ${isShowAlias.value ? '320px' : 'auto'}`,
    width: '0px',
  }
})

const containerStyle = computed(() => {
  return {
    flex: '1 1 0%',
    overflow: 'auto',
    background: 'rgb(245, 245, 245)',
    paddingBottom: '24px',
  }
})

function handleShowPanelAlias() {
  isShowAlias.value = !isShowAlias.value
}

const isLight = computed(() => currentAlgorithm.value?.includes('light'))

const isCompact = computed(() => currentAlgorithm.value?.includes('compact'))

function handleChangeTheme(key: 'color' | 'size') {
  const prev = currentAlgorithm.value!
  let next: AlgorithmName[]

  if (key === 'color') {
    const isDark = prev.includes('dark')
    next = [...prev.filter((a) => a !== 'light' && a !== 'dark'), isDark ? 'light' : 'dark']
  } else {
    const hasCompact = prev.includes('compact')

    next = hasCompact ? prev.filter((a) => a !== 'compact') : [...prev, 'compact']
  }

  setAlgorithms(next)
}

const classNames = useStyle('theme-editor', (token) => {
  return {
    'backgroundColor': token.colorBgContainer,

    '.theme-editor-header': {
      'borderBottom': `1px solid ${token.colorSplit}`,
      'paddingInline': `${token.paddingLG}px`,

      '.theme-editor-header-actions': {
        marginRight: `${token.marginXS}px`,
      },
    },

    '.antd-theme-editor': {
      'backgroundColor': token.colorBgLayout,
      'display': 'flex',

      '.token-panel-pro': {
        'borderInlineEnd': `1px solid ${token.colorBorderSecondary}`,

        '.token-panel-pro-color-alias-description': {
          color: token.colorTextTertiary,
          fontSize: `${token.fontSizeSM}px`,
          lineHeight: token.lineHeightSM,
          padding: `0 16px 12px`,
        },
      },
    },
  }
})
</script>

<style lang="less" scoped>
.theme-editor-header {
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.token-panel-pro {
  height: 100%;
  display: flex;

  .token-panel-pro-tabs {
    &.ant-tabs {
      height: 100%;
      overflow: auto;

      :deep(.ant-tabs-nav) {
        padding: 0 16px;
        margin: 0;
      }

      :deep(.ant-tabs-content) {
        height: 100%;
      }
    }
  }
}

.theme-editor-icon-switch {
  display: inline-block;

  .holder {
    position: relative;
    display: inline-flex;
    background: #ebedf0;
    border-radius: 100vw;
    cursor: pointer;
    transition: all 0.3s;

    &::before {
      position: absolute;
      top: 0;
      left: calc(100% - 32px);
      width: 32px;
      height: 32px;
      background: #314659;
      border-radius: 100vw;
      transition: all 0.3s;
      content: '';
    }

    &.leftChecked::before {
      left: 0;
    }
  }

  .icon {
    position: relative;
    width: 32px;
    height: 32px;
    color: #a3b1bf;
    line-height: 32px;
    text-align: center;
    transition: all 0.3s;
    font-size: 16px;

    &.active {
      color: #fff;
    }

    &:first-child {
      margin-inline-end: -4px;
    }
  }
}

.token-panel-pro-color-alias {
  display: flex;
  flex-direction: column;
  margin-top: calc(var(--i-margin-top));
  border-top: 1px solid rgba(5, 5, 5, 0.06);

  .token-panel-pro-color-alias-title {
    display: flex;
    align-items: center;
    padding: 0 16px;
    flex: 0 0 60px;

    .token-panel-pro-color-alias-title-text {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .token-panel-pro-color-alias-expand {
    height: 100%;
    width: 20px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      .token-panel-pro-color-alias-expand-handler {
        opacity: 1;
      }
    }

    .token-panel-pro-color-alias-expand-handler {
      height: 100px;
      width: 16px;
      border-radius: 999px;
      border: 1px solid rgba(5, 5, 5, 0.06);
      background-color: #fff;
      margin: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: box-shadow 0.2s;
    }
  }
}

.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
