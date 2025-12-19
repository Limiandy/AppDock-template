<template>
  <div :class="classNames">
    <div class="token-panel-pro-color-seeds">
      <div class="token-panel-pro-color-themes">
        <slot name="header"></slot>
      </div>

      <a-collapse
        v-model:active-key="activeKey"
        accordion
        ghost
        expand-icon-position="end"
        class="token-panel-pro-token-collapse"
      >
        <template #expandIcon="{ isActive }">
          <caret-right-outlined :rotate="isActive ? 90 : 0" />
        </template>

        <a-collapse-panel v-for="item in seedTokens" :key="item.key">
          <template #header>
            <span style="font-weight: 500">{{ item.title }}</span>
          </template>
          <color-content :seed-token="item" @reset="handleResetPrimaryColor" />
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import ColorContent from './ColorContent.vue'
import { useEvent } from '@/hooks/useEvent.ts'
import { CaretRightOutlined } from '@ant-design/icons-vue'
import useStyle from '@/hooks/style/useStyle.ts'

const props = defineProps<{
  seedTokens: any[]
}>()

const activeKey = ref(props.seedTokens[0].key)

const { eventBus } = useEvent()

watchEffect(() => {
  const currentSeedToken = props.seedTokens.find((item) => item.key === activeKey.value)
  eventBus.emit('subAliasToken', currentSeedToken?.aliasTokens)
})

function handleResetPrimaryColor() {
  console.log('handleResetPrimaryColor')
}

const classNames = useStyle('token-panel-pro-color', (token) => {
  return {
    'height': '100%',
    'display': 'flex',

    '.token-panel-pro-color-seeds': {
      'borderInlineEnd': `1px solid ${token.colorBorderSecondary}`,

      '.token-panel-pro-token-collapse.ant-collapse > .ant-collapse-item-active': {
        backgroundColor: token.colorBgContainer,
        boxShadow: `0 6px 16px -8px rgba(0, 0, 0, 0.08),
      0 9px 28px 0 rgba(0, 0, 0, 0.05),
      0 12px 48px -8px rgba(0, 0, 0, 0.03),
      inset 0 0 0 2px ${token.colorPrimary}`,
      },
    },
  }
})
</script>

<style lang="less" scoped>
.token-panel-pro-color {
  .token-panel-pro-color-seeds {
    height: 100%;
    flex: 1;
    width: 0;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .token-panel-pro-color-themes {
      display: flex;
      align-items: center;
      padding: 0 16px;
      flex: 0 0 60px;

      :slotted(span) {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .token-panel-pro-token-collapse {
      &.ant-collapse {
        flex: 1;
        overflow: auto;

        & > .ant-collapse-item-active {
          transition: box-shadow 0.2s ease-in-out;
          border-radius: 8px;
        }
      }
    }
  }
}
</style>
