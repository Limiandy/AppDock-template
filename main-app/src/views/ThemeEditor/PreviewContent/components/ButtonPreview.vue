<template>
  <a-space align="start">
    <a-space direction="vertical">
      <a-space>
        <a-button type="primary">Primary Button</a-button>
        <a-button type="primary" shape="circle" :icon="h(SearchOutlined)" />
        <a-button type="primary" shape="circle">A</a-button>
        <a-button type="primary" ghost :icon="h(SearchOutlined)">Search</a-button>
      </a-space>
      <div>
        <a-radio :checked="true">Radio</a-radio>
        <a-space>
          <a-checkbox :checked="false">Checkbox</a-checkbox>
          <a-checkbox :checked="true">选中态</a-checkbox>
        </a-space>
        <a-switch :checked="true"></a-switch>
      </div>
      <a-space>
        <a-radio-group :value="'a'" button-style="solid">
          <a-radio-button value="a">Hangzhou</a-radio-button>
          <a-radio-button value="b">Shanghai</a-radio-button>
        </a-radio-group>

        <a-radio-group :value="'b'" button-style="outline">
          <a-radio-button value="a">Apple</a-radio-button>
          <a-radio-button value="b">Orange</a-radio-button>
        </a-radio-group>
      </a-space>

      <a-tabs active-key="1">
        <a-tab-pane key="1" tab="Tab 1">Content of Tab Pane 1</a-tab-pane>
        <a-tab-pane key="2" tab="Tab 2" force-render>Content of Tab Pane 2</a-tab-pane>
        <a-tab-pane key="3" tab="Tab 3">Content of Tab Pane 3</a-tab-pane>
      </a-tabs>
    </a-space>

    <a-select
      :value="['a10', 'b12', 'c13']"
      mode="multiple"
      style="width: 100%"
      placeholder="Please select"
      allow-clear
      :options="[...Array(25)].map((_, i) => ({ value: (i + 10).toString(36) + (i + 1) }))"
    ></a-select>
  </a-space>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
</script>
