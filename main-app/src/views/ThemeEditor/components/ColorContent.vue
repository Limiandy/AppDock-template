<template>
  <div>
    <div class="token-panel-pro-token-collapse-description">{{ seedToken.description }}</div>

    <!--    Seed Token Start -->
    <seed-block v-for="item in seedToken.seedTokens" :key="item.key" :seed-token="item" style="margin-bottom: 12px" />
    <!--    Seed Token End -->

    <div
      v-if="seedToken.mapTokens?.length || seedToken.multipleMapTokens?.length"
      style="margin-top: 16px; margin-bottom: 24px"
    >
      <div
        class="token-panel-pro-token-collapse-subtitle"
        style="margin-bottom: 10px; display: flex; align-items: center"
      >
        <span>Map Token</span>
        <question-tip
          title="梯度变量（Map Token） 是基于 Seed 派生的梯度变量，我们精心设计的梯度变量模型具有良好的视觉设计语义，可在亮暗色模式切换时保证视觉梯度的一致性。"
        />

        <div
          v-if="seedToken.multipleMapTokens?.length && seedToken.key.includes('Color')"
          style="display: flex; align-items: center; gap: 4px; margin-left: auto"
        >
          <span>分组显示</span>
          <a-switch v-model:checked="isGroupPreview" size="small" />
        </div>
      </div>

      <template v-if="seedToken.multipleMapTokens?.length">
        <a-collapse
          v-if="isGroupPreview"
          :active-key="seedToken.multipleMapTokens.map((item: any) => item.key)"
          class="token-panel-pro-grouped-map-collapse"
        >
          <a-collapse-panel
            v-for="mapTokenGroup in seedToken.multipleMapTokens"
            :key="mapTokenGroup.key"
            :header="mapTokenGroup.title"
            :show-arrow="false"
          >
            <map-collapse :map-tokens="mapTokenGroup.mapTokens" />
          </a-collapse-panel>
        </a-collapse>

        <map-collapse v-else :map-tokens="seedToken.flatMapTokens" />
      </template>

      <map-collapse v-else :map-tokens="seedToken.mapTokens" />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionTip from './QuestionTip.vue'
import MapCollapse from './MapCollapse.vue'
import SeedBlock from './SeedBlock.vue'

import { ref } from 'vue'

const props = defineProps<{
  seedToken: any
}>()

console.log(props.seedToken)

const isGroupPreview = ref(true)
</script>

<style lang="less" scoped>
:deep(.ant-collapse) {
  .ant-collapse-content {
    color: rgba(0, 0, 0, 0.88);
    background-color: #ffffff;
    border-top: 1px solid #f0f0f0;

    .ant-collapse-content-box {
      padding: 0;
    }
  }
}
.token-panel-pro-token-collapse-description {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 16px;
}

.token-panel-pro-grouped-map-collapse {
  border-radius: 4px;
  :deep(.ant-collapse-header) {
    padding: 6px 12px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    line-height: 1.6666666666666667;
  }

  .token-panel-pro-token-collapse-map-collapse.ant-collapse {
    border: none;

    :deep(.ant-collapse-item) {
      &:last-child {
        border: none;
      }
    }
  }
}
</style>
