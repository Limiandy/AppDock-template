import type { SuperTableAction, SuperTableColumn, SuperTableSearchFields } from 'common'
import { queryDataset, type DatasetKey } from '@/data/prototype'

/**
 * 原型通用列表页配置：SimpleListPage 按 key 取用，走 SuperTable + 原型数据集。
 */
export interface ListPageConfig {
  title: string
  description?: string
  columns: SuperTableColumn[]
  searchFields: SuperTableSearchFields
  toolbarActions?: SuperTableAction[]
  showSelection?: boolean
}

export const listPageConfigs: Partial<Record<DatasetKey, ListPageConfig>> = {
  sourcing: {
    title: '寻源',
    description: '按区域与品类发布寻源需求，等待供应商响应',
    columns: [
      { key: 'title', title: '寻源标题', dataIndex: 'title', width: 280 },
      { key: 'category', title: '品类', dataIndex: 'category', width: 140 },
      { key: 'area', title: '区域', dataIndex: 'area', width: 120 },
      { key: 'publishedAt', title: '发布时间', dataIndex: 'publishedAt', width: 140 },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 140,
        fixed: 'right',
        align: 'center',
        actions: [{ key: 'detail', label: '详情', icon: 'solar:file-text-outline' }],
      },
    ],
    searchFields: {
      fields: [
        { field: 'title', label: '寻源标题', placeholder: '请输入寻源标题' },
        { field: 'category', label: '品类', placeholder: '请输入品类' },
        { field: 'area', label: '区域', placeholder: '请输入区域' },
      ],
    },
  },
  recruitmentDrafts: {
    title: '草稿箱',
    description: '未发布的招募草稿',
    columns: [
      { key: 'title', title: '招募标题', dataIndex: 'title', width: 320 },
      { key: 'requirement', title: '招募要求', dataIndex: 'requirement', width: 360 },
      { key: 'publishedAt', title: '创建时间', dataIndex: 'publishedAt', width: 140 },
      {
        key: 'action',
        title: '操作',
        width: 170,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'edit', label: '继续编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'delete', label: '删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
        ],
      },
    ],
    searchFields: { fields: [{ field: 'title', label: '招募标题', placeholder: '请输入招募标题' }] },
  },
  inspectionTasks: {
    title: '考察任务',
    columns: [
      { key: 'supplier', title: '供应商', dataIndex: 'supplier', width: 280 },
      { key: 'type', title: '考察类型', dataIndex: 'type', width: 120 },
      { key: 'inspector', title: '考察负责人', dataIndex: 'inspector', width: 120 },
      { key: 'deadline', title: '截止时间', dataIndex: 'deadline', width: 140 },
      { key: 'result', title: '考察结果', dataIndex: 'result', width: 110, align: 'center' },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 150,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'detail', label: '详情', icon: 'solar:file-text-outline' },
          { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
        ],
      },
    ],
    searchFields: {
      fields: [
        { field: 'supplier', label: '供应商', placeholder: '请输入供应商名称' },
        { field: 'inspector', label: '考察负责人', placeholder: '请输入负责人' },
        {
          field: 'type',
          label: '考察类型',
          component: 'select',
          options: [
            { label: '工厂考察', value: '工厂考察' },
            { label: '项目考察', value: '项目考察' },
          ],
        },
      ],
    },
    toolbarActions: [{ key: 'create', label: '新建考察任务', type: 'primary', icon: 'solar:add-circle-outline' }],
  },
  inspectionRecords: {
    title: '考察记录',
    columns: [
      { key: 'supplier', title: '供应商', dataIndex: 'supplier', width: 280 },
      { key: 'type', title: '考察类型', dataIndex: 'type', width: 120 },
      { key: 'inspector', title: '考察负责人', dataIndex: 'inspector', width: 120 },
      { key: 'deadline', title: '完成时间', dataIndex: 'deadline', width: 140 },
      { key: 'result', title: '考察结果', dataIndex: 'result', width: 110, align: 'center' },
    ],
    searchFields: { fields: [{ field: 'supplier', label: '供应商', placeholder: '请输入供应商名称' }] },
  },
  tenderList: {
    title: '招标列表',
    columns: [
      { key: 'title', title: '招标名称', dataIndex: 'title', width: 300 },
      { key: 'method', title: '招标方式', dataIndex: 'method', width: 120 },
      { key: 'category', title: '招标类别', dataIndex: 'category', width: 120 },
      { key: 'deadline', title: '报名截止', dataIndex: 'deadline', width: 160 },
      { key: 'applied', title: '已报名', dataIndex: 'applied', width: 100, align: 'right' },
      { key: 'unviewed', title: '未查看', dataIndex: 'unviewed', width: 100, align: 'right' },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 170,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'detail', label: '查看', icon: 'solar:file-text-outline' },
          { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'delete', label: '截止', danger: true, icon: 'solar:close-circle-outline' },
        ],
      },
    ],
    searchFields: {
      fields: [
        { field: 'title', label: '招标名称', placeholder: '请输入招标名称' },
        { field: 'category', label: '招标类别', placeholder: '请输入招标类别' },
        {
          field: 'status',
          label: '状态',
          component: 'select',
          options: [
            { label: '报名中', value: '报名中' },
            { label: '评标中', value: '评标中' },
            { label: '已截止', value: '已截止' },
          ],
        },
      ],
    },
    toolbarActions: [{ key: 'create', label: '发布招标', type: 'primary', icon: 'app:publish' }],
  },
  tenderDrafts: {
    title: '草稿箱',
    columns: [
      { key: 'title', title: '招标名称', dataIndex: 'title', width: 320 },
      { key: 'category', title: '招标类别', dataIndex: 'category', width: 120 },
      { key: 'method', title: '招标方式', dataIndex: 'method', width: 120 },
      {
        key: 'action',
        title: '操作',
        width: 170,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'edit', label: '继续编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'delete', label: '删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
        ],
      },
    ],
    searchFields: { fields: [{ field: 'title', label: '招标名称', placeholder: '请输入招标名称' }] },
  },
  meetingList: {
    title: '对接会',
    columns: [
      { key: 'title', title: '对接会名称', dataIndex: 'title', width: 300 },
      { key: 'city', title: '城市', dataIndex: 'city', width: 100 },
      { key: 'date', title: '举办时间', dataIndex: 'date', width: 140 },
      { key: 'category', title: '品类', dataIndex: 'category', width: 120 },
      { key: 'attendeeCount', title: '报名人数', dataIndex: 'attendeeCount', width: 110, align: 'right' },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 140,
        fixed: 'right',
        align: 'center',
        actions: [{ key: 'detail', label: '详情', icon: 'solar:file-text-outline' }],
      },
    ],
    searchFields: {
      fields: [
        { field: 'title', label: '对接会名称', placeholder: '请输入对接会名称' },
        { field: 'city', label: '城市', placeholder: '请输入城市' },
      ],
    },
    toolbarActions: [{ key: 'create', label: '创建对接会', type: 'primary', icon: 'solar:add-circle-outline' }],
  },
  companyProjects: {
    title: '项目设置',
    columns: [
      { key: 'name', title: '项目名称', dataIndex: 'name', width: 220 },
      { key: 'company', title: '所属公司', dataIndex: 'company', width: 240 },
      { key: 'owner', title: '项目负责人', dataIndex: 'owner', width: 130 },
      { key: 'creator', title: '创建人', dataIndex: 'creator', width: 120 },
      { key: 'stage', title: '项目阶段', dataIndex: 'stage', width: 120, align: 'center' },
      { key: 'publishedAt', title: '发布时间', dataIndex: 'publishedAt', width: 160 },
      {
        key: 'action',
        title: '操作',
        width: 150,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'delete', label: '删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
        ],
      },
    ],
    searchFields: {
      fields: [
        { field: 'name', label: '项目名称', placeholder: '搜索项目名称' },
        { field: 'company', label: '所属公司', placeholder: '请选择所属公司' },
      ],
    },
    toolbarActions: [
      { key: 'batchDelete', label: '批量删除', danger: true, icon: 'solar:trash-bin-trash-outline' },
      { key: 'create', label: '新增项目', type: 'primary', icon: 'solar:add-circle-outline' },
    ],
  },
  companyZone: {
    title: '企业专区',
    columns: [
      { key: 'title', title: '内容标题', dataIndex: 'title', width: 300 },
      { key: 'type', title: '内容类型', dataIndex: 'type', width: 140 },
      { key: 'publishedAt', title: '发布时间', dataIndex: 'publishedAt', width: 140 },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 150,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'publish', label: '发布', icon: 'app:publish' },
        ],
      },
    ],
    searchFields: { fields: [{ field: 'title', label: '内容标题', placeholder: '请输入标题' }] },
    toolbarActions: [{ key: 'create', label: '新建内容', type: 'primary', icon: 'solar:add-circle-outline' }],
  },
  companyAccounts: {
    title: '查看所有账号',
    columns: [
      { key: 'name', title: '姓名', dataIndex: 'name', width: 140 },
      { key: 'phone', title: '手机号', dataIndex: 'phone', width: 160 },
      { key: 'role', title: '角色', dataIndex: 'role', width: 140 },
      { key: 'department', title: '部门', dataIndex: 'department', width: 160 },
      { key: 'status', title: '状态', dataIndex: 'status', width: 110, align: 'center' },
      {
        key: 'action',
        title: '操作',
        width: 150,
        fixed: 'right',
        align: 'center',
        actions: [
          { key: 'edit', label: '编辑', icon: 'solar:pen-new-square-outline' },
          { key: 'delete', label: '停用', danger: true, icon: 'solar:stop-circle-outline' },
        ],
      },
    ],
    searchFields: {
      fields: [
        { field: 'name', label: '姓名', placeholder: '请输入姓名' },
        { field: 'department', label: '部门', placeholder: '请输入部门' },
      ],
    },
    toolbarActions: [{ key: 'create', label: '新增账号', type: 'primary', icon: 'solar:user-plus-outline' }],
  },
}

export function getListRequest(key: DatasetKey) {
  return (params: Parameters<typeof queryDataset>[1]) => queryDataset(key, params)
}
