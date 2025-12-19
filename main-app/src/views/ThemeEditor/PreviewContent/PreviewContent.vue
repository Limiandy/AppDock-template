<template>
  <div :class="classNames">
    <div style="margin: auto; max-width: 960px">
      <a-segmented v-model:value="segmentedValue" :options="segmentedData" style="margin: 12px 0 0 12px" />

      <div style="margin: 12px">
        <a-card size="small">
          <a-space direction="vertical">
            <a-space align="start">
              <menu-preview />

              <a-space direction="vertical">
                <button-preview />

                <a-space direction="vertical">
                  <a-pagination :current="2" show-quick-jumper :total="500" />
                </a-space>

                <a-steps
                  :current="1"
                  :items="[
                    {
                      title: 'Finished',
                      description,
                    },
                    {
                      title: 'In Progress',
                      description,
                      subTitle: 'Left 00:00:08',
                    },
                    {
                      title: 'Waiting',
                      description,
                    },
                  ]"
                ></a-steps>

                <a-space align="start">
                  <div style="width: 260px; padding-top: 80px">
                    <a href="#">Delete</a>
                  </div>
                  <a-timeline>
                    <a-timeline-item>Create a services site 2015-09-01</a-timeline-item>
                    <a-timeline-item>Solve initial network problems 2015-09-01</a-timeline-item>
                    <a-timeline-item>Technical testing 2015-09-01</a-timeline-item>
                    <a-timeline-item>Network problems being solved 2015-09-01</a-timeline-item>
                  </a-timeline>
                </a-space>
              </a-space>
            </a-space>

            <a-table :columns="columns" :data-source="data" :pagination="false">
              <template #headerCell="{ column }">
                <template v-if="column.key === 'name'">
                  <span>
                    <smile-outlined />
                    Name
                  </span>
                </template>
              </template>

              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <a>
                    {{ record.name }}
                  </a>
                </template>
                <template v-else-if="column.key === 'tags'">
                  <span>
                    <a-tag
                      v-for="tag in record.tags"
                      :key="tag"
                      :color="tag === 'loser' ? 'volcano' : tag.length > 5 ? 'geekblue' : 'green'"
                    >
                      {{ tag.toUpperCase() }}
                    </a-tag>
                  </span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <span>
                    <a>Invite 一 {{ record.name }}</a>
                    <a-divider type="vertical" />
                    <a>Delete</a>
                    <a-divider type="vertical" />
                    <a class="ant-dropdown-link">
                      More actions
                      <down-outlined />
                    </a>
                  </span>
                </template>
              </template>
            </a-table>
          </a-space>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useStyle from '@/hooks/style/useStyle.ts'
import { reactive, ref } from 'vue'
import MenuPreview from './components/MenuPreview.vue'
import ButtonPreview from './components/ButtonPreview.vue'
import { SmileOutlined, DownOutlined } from '@ant-design/icons-vue'

const description = 'This is a description.'
const segmentedData = reactive(['概览', '组件'])
const segmentedValue = ref(segmentedData[0])

const columns = [
  {
    name: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Address',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: 'Tags',
    key: 'tags',
    dataIndex: 'tags',
  },
  {
    title: 'Action',
    key: 'action',
  },
]

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
]

const classNames = useStyle('preview-content', (token) => {
  return {
    flex: '1 1 0%',
    overflow: 'auto',
    background: token.colorBgLayout,
    paddingBottom: `${token.paddingLG}px`,
  }
})
</script>
