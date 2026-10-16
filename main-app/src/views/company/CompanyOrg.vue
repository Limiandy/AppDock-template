<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <div class="company-org__head">
      <div class="company-org__head-right">
        <a-input-search v-model:value="keyword" class="company-org__search" placeholder="搜索组织名称 / 用户姓名" />
        <a-button type="primary" @click="notify('新增组织')">
          <SvgIcon name="solar:add-circle-outline" class="company-org__icon" />
          新增组织
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="filteredTree"
      :pagination="false"
      :default-expand-all-rows="true"
      row-key="id"
      size="middle"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-space v-if="record.type === 'user'" :size="12">
            <a @click="notify(`编辑 ${record.name}`)">
              <SvgIcon name="solar:pen-new-square-outline" />
            </a>
            <a class="company-org__danger" @click="notify(`删除 ${record.name}`)">
              <SvgIcon name="solar:trash-bin-trash-outline" />
            </a>
          </a-space>
          <a-space v-else :size="12">
            <a @click="notify(`重命名 ${record.name}`)">
              <SvgIcon name="solar:pen-new-square-outline" />
            </a>
            <a class="company-org__danger" @click="notify(`删除 ${record.name}`)">
              <SvgIcon name="solar:trash-bin-trash-outline" />
            </a>
          </a-space>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableColumnsType } from 'ant-design-vue'
import { SvgIcon } from 'common'
import { companyOrgTree, type OrgNodeRecord, type OrgUserRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import { pageInsetStyles } from '@/hooks/style/pageStyles'

const global = useGlobalStore()
const keyword = ref('')

const columns: TableColumnsType = [
  {
    title: '组织名称',
    dataIndex: 'name',
    key: 'orgName',
    width: 300,
    customRender: ({ record }) => (record.type === 'org' ? record.name : ''),
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'userName',
    width: 140,
    customRender: ({ record }) => (record.type === 'user' ? record.name : ''),
  },
  { title: '所属公司', dataIndex: 'company', key: 'company', width: 280 },
  { title: '岗位', dataIndex: 'position', key: 'position', width: 160 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 160 },
  { title: '操作', key: 'action', width: 120 },
]

/** 按关键字过滤：保留命中的组织，或包含命中用户的组织 */
const filteredTree = computed<Array<OrgNodeRecord | OrgUserRecord>>(() => {
  const text = keyword.value.trim().toLowerCase()
  const tree = companyOrgTree as Array<OrgNodeRecord | OrgUserRecord>
  if (!text) return tree

  function filterNodes(nodes: Array<OrgNodeRecord | OrgUserRecord>): Array<OrgNodeRecord | OrgUserRecord> {
    const result: Array<OrgNodeRecord | OrgUserRecord> = []

    for (const node of nodes) {
      if (node.type === 'user') {
        if (node.name.toLowerCase().includes(text)) result.push(node)
        continue
      }

      const children = filterNodes((node.children ?? []) as Array<OrgNodeRecord | OrgUserRecord>)
      if (node.name.toLowerCase().includes(text) || children.length) {
        result.push({ ...node, children: children.length ? children : node.children } as OrgNodeRecord)
      }
    }

    return result
  }

  return filterNodes(tree)
})

function notify(action: string) {
  global.message.info(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('company-org', (token) => ({
  ...pageInsetStyles(token),

  '.company-org__head': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: `${token.margin}px`,
  },

  '.company-org__head-right': {
    display: 'flex',
    gap: `${token.marginXS}px`,
  },

  '.company-org__search': {
    width: '260px',
  },

  '.company-org__icon': {
    marginInlineEnd: `${token.marginXXS}px`,
  },

  '.company-org__name': {
    color: token.colorText,
    fontWeight: token.fontWeightStrong,
  },

  '.company-org__danger': {
    'color': token.colorError,

    '&:hover': {
      color: token.colorErrorHover,
    },
  },
}))
</script>
