<template>
  <div style="flex: 1 1 0%; overflow: auto">
    <a-empty v-if="!aliasTokens.length" :image="simpleImage" description="暂无相关 Alias Token"></a-empty>
    <template v-else>
      <a-collapse v-model:active-key="activeKey" ghost class="token-panel-pro-alias-collapse">
        <template #expandIcon="{ isActive }">
          <caret-right-outlined :rotate="isActive ? 90 : 0" />
        </template>

        <a-collapse-panel v-for="item in aliasTokens" :key="item.key">
          <template #header>
            <collapse-header :title="item.key" token="" :count="item.components?.length ?? undefined" />
          </template>
          <panel-detail :description="item.description" :components="item.components" :token="item.key" />
        </a-collapse-panel>
      </a-collapse>
    </template>
  </div>
</template>

<script lang="ts" setup>
import CollapseHeader from './CollapseHeader.vue'
import PanelDetail from './PanelDetail.vue'
import { Empty } from 'ant-design-vue'
import { ref } from 'vue'
import { CaretRightOutlined } from '@ant-design/icons-vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

withDefaults(
  defineProps<{
    aliasTokens?: any[]
  }>(),
  {
    aliasTokens: () => [],
  },
)

const activeKey = ref([])
</script>

<style lang="less" scoped>
.token-panel-pro-alias-collapse {
  :deep(.ant-collapse-header) {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    padding: 0 16px;
    color: rgba(0, 0, 0, 0.88);
    line-height: 1.5714285714285714;
    cursor: pointer;
    transition:
      all 0.3s,
      visibility 0s;
  }

  :deep(.ant-collapse-content-box) {
    padding: 8px;
  }
}
</style>
