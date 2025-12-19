<template>
  <div :class="classNames" style="margin: 8px">
    <div class="token-panel-pro-token-collapse-map-collapse-token-description">
      {{ description }}
    </div>
    <tag-tip :texts="components" />
    <div class="token-panel-pro-token-collapse-map-collapse-token-inputs">
      <div>
        <div class="previewer-token-input">
          <span class="ant-input-group-wrapper">
            <a-input-number
              v-if="typeof getTokenRef(token).value === 'number'"
              v-model:value="getTokenRef(token).value"
              :min="token.startsWith('font') ? 12 : 0"
              :bordered="false"
            >
              <template #addonAfter>
                <span style="display: flex; align-items: center">
                  <a-button size="small" type="link" :disabled="!isModified(token)" @click="resetSeedToken(token)">
                    重置
                  </a-button>
                </span>
              </template>
            </a-input-number>
            <a-input v-else v-model:value="getTokenRef(token).value" :bordered="false" size="small">
              <template v-if="isColor(getTokenRef(token).value)" #addonBefore>
                <color-panel v-model:value="getTokenRef(token).value as string"></color-panel>
              </template>

              <template #addonAfter>
                <a-button size="small" type="link" :disabled="!isModified(token)" @click="resetSeedToken(token)">
                  重置
                </a-button>
              </template>
            </a-input>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ColorPanel from './ColorPanel.vue'
import TagTip from './TagTip.vue'

import useTokenComputed from '../utils/useTokenComputed.ts'
import { useTheme } from '@/hooks/theme/useTheme.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const getTokenRef = useTokenComputed()

const { isModified, resetSeedToken, isColor } = useTheme()

defineProps<{
  description: string
  components: string[]
  token: any
}>()

const classNames = useStyle('token-panel-token-detail', (token) => {
  return {
    '.token-panel-pro-token-collapse-map-collapse-token-description': {
      color: token.colorTextQuaternary,
    },

    '.token-panel-pro-token-collapse-map-collapse-token-inputs': {
      'backgroundColor': token.colorFillQuaternary,

      '.previewer-token-input': {
        '.ant-input,.ant-input-number': {
          background: token.colorBgSpotlight,
          borderRadius: `${token.borderRadiusLG}px`,
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        },

        '.ant-input-group-addon,.ant-input-number-group-addon': {
          padding: 0,
          background: 'none',
          border: 'none',
        },
      },
    },
  }
})
</script>

<style scoped lang="less">
.token-panel-token-detail {
  .token-panel-pro-token-collapse-map-collapse-token-description {
    margin-bottom: 8px;
    font-size: 12px;
  }

  .token-panel-pro-token-collapse-map-collapse-token-inputs {
    padding: 8px 10px;
    margin-top: 12px;

    .previewer-token-input {
      .ant-input-group-wrapper,
      .ant-input-number-group-wrapper {
        padding: 0;
        height: 24px;
        width: 100%;
      }
    }
  }
}
</style>
