<template>
  <div class="token-panel-token-detail" style="margin: 8px">
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

const getTokenRef = useTokenComputed()

const { isModified, resetSeedToken, isColor } = useTheme()

defineProps<{
  description: string
  components: string[]
  token: any
}>()
</script>

<style scoped lang="less">
.token-panel-token-detail {
  .token-panel-pro-token-collapse-map-collapse-token-description {
    color: rgba(0, 0, 0, 0.25);
    margin-bottom: 8px;
    font-size: 12px;
  }

  .token-panel-pro-token-collapse-map-collapse-token-inputs {
    padding: 8px 10px;
    background-color: rgba(0, 0, 0, 0.02);
    margin-top: 12px;

    .previewer-token-input {
      .ant-input-group-wrapper,
      .ant-input-number-group-wrapper {
        padding: 0;
        height: 24px;
        width: 100%;
      }

      :deep(.ant-input),
      :deep(.ant-input-number) {
        background: white;
        border-radius: 8px !important;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      :deep(.ant-input-group-addon),
      :deep(.ant-input-number-group-addon) {
        padding: 0;
        background: none;
        border: none;
      }
    }
  }
}
</style>
