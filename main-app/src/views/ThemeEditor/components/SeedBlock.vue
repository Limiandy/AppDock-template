<template>
  <div :class="[scopeClass, className]">
    <div style="margin-right: auto">
      <div class="token-panel-pro-token-collapse-subtitle">
        <span>Seed Token</span>
        <question-tip :title="seedToken.description" />
      </div>
      <div>
        <span class="token-panel-pro-token-collapse-seed-block-name-cn">{{ seedToken.title }}</span>
      </div>
    </div>
    <div class="token-panel-pro-token-collapse-seed-block-sample">
      <div class="token-panel-pro-token-collapse-seed-block-sample-theme">
        <a-typography-link
          href="javascript:void(0)"
          :style="{ opacity: isShowReset ? 1 : 0 }"
          style="font-size: 12px; padding: 0"
          @click="handleReset"
        >
          重置
        </a-typography-link>
      </div>
      <color-panel
        v-if="seedToken.key.startsWith('color')"
        v-model:value="getTokenRef(seedToken.key as TokenKey).value as string"
      >
        <div class="token-panel-pro-token-collapse-seed-block-sample-card" style="pointer-events: auto">
          <div :style="cardStyle"></div>
          <div class="token-panel-pro-token-collapse-seed-block-sample-card-value">
            {{ getTokenRef(seedToken.key as TokenKey) }}
          </div>
        </div>
      </color-panel>

      <div v-else-if="seedToken.key === 'wireframe'">
        <a-switch v-model:checked="getTokenRef('wireframe').value" />
      </div>

      <div v-else style="display: flex; width: 200px">
        <a-slider
          v-model:value="getTokenRef(seedToken.key as TokenKey).value"
          :min="getMinMax(seedToken.key).min"
          :max="getMinMax(seedToken.key).max"
          style="flex: 0 0 120px; margin-right: 12px"
        />
        <a-input-number v-model:value="getTokenRef(seedToken.key as TokenKey).value" :min="12" :max="120" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useTokenComputed from '../utils/useTokenComputed.ts'
import { type TokenKey, useTheme } from '@/hooks/theme/useTheme.ts'
import ColorPanel from './ColorPanel.vue'
import QuestionTip from './QuestionTip.vue'
import { computed, type CSSProperties } from 'vue'
import tinycolor from 'tinycolor2'
import useStyle from '@/hooks/style/useStyle.ts'

const props = defineProps<{
  seedToken: any
}>()

const getTokenRef = useTokenComputed()

const { isModified, resetSeedToken } = useTheme()

const isShowReset = computed(() => isModified(props.seedToken.key as TokenKey))

const cardStyle = computed<CSSProperties>(() => {
  return {
    backgroundColor: tinycolor(getTokenRef(props.seedToken.key as TokenKey).value as string).toRgbString(),
    width: `48px`,
    height: `32px`,
    borderRadius: `4px`,
    marginRight: `14px`,
    boxShadow: `rgba(0, 0, 0, 0.2) 0px 2px 3px -1px,
      rgba(0, 0, 0, 0.09) 0px 0px 0px 1px inset`,
  } as CSSProperties
})

function getMinMax(key: string): { min: number; max: number } {
  let min, max

  switch (key) {
    case 'fontSize':
      min = 12
      max = 32
      break
    case 'borderRadius':
    case 'sizeStep':
    case 'sizeUnit':
      min = 0
      max = 16
      break
    default:
      min = 0
      max = Infinity
  }

  return {
    min,
    max,
  }
}

function handleReset() {
  resetSeedToken(props.seedToken.key as TokenKey)
}

const [className, scopeClass] = useStyle('token-panel-pro-token-collapse-seed-block', (token) => {
  return {
    '.token-panel-pro-token-collapse-subtitle': {
      color: token.colorTextSecondary,
      fontSize: token.fontSizeSM,
    },

    '.token-panel-pro-token-collapse-seed-block-name-cn': {
      marginInlineEnd: `${token.marginXXS}px`,
    },

    '.token-panel-pro-token-collapse-seed-block-sample-card': {
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: `${token.borderRadiusSM}px`,
      padding: `${token.paddingXXS}px ${token.paddingXS}px`,
    },

    '.token-panel-pro-token-collapse-seed-block-sample-card-value': {
      fontFamily: token.fontFamily,
    },

    '.token-panel-pro-token-collapse-seed-block-sample-theme': {
      color: token.colorTextTertiary,
      marginBottom: '2px',
      fontSize: `${token.fontSizeSM}px`,
      textAlign: 'end',
    },
  }
})
</script>

<style lang="less" scoped>
.token-panel-pro-token-collapse-seed-block {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.token-panel-pro-token-collapse-seed-block-name-cn {
  font-weight: 600;
}

.token-panel-pro-token-collapse-seed-block-sample {
  flex: none;
}

.token-panel-pro-token-collapse-seed-block-sample-card {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
