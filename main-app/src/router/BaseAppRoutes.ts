import type { RouteRecordRaw } from 'vue-router'

export const baseAppDevEntries = [
  { path: '/base-app/icons', title: '全量图标', icon: 'solar:album-outline' },
  { path: '/base-app/theme-editor', title: '主题编辑器', icon: 'solar:palette-2-outline' },
  { path: '/base-app/super-table', title: '超级表格', icon: 'solar:bill-list-outline' },
] as const

/** 原型通用列表页：通过 props 指定数据集与列配置 */
function listPage(configKey: string, title: string, icon?: string): RouteRecordRaw {
  return {
    path: configKey,
    name: `List-${configKey}`,
    component: () => import('@/views/SimpleListPage.vue'),
    props: { configKey },
    meta: { title, ...(icon ? { icon } : {}) },
  }
}

const workbenchRoutes: RouteRecordRaw[] = [
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('@/views/workbench/WorkbenchHome.vue'),
    meta: { title: '工作台', icon: 'app:workbench' },
  },
  {
    path: '/sourcing',
    name: 'Sourcing',
    component: () => import('@/views/SimpleListPage.vue'),
    props: { configKey: 'sourcing' },
    meta: { title: '寻源', icon: 'app:sourcing' },
  },
]

const recruitmentRoutes: RouteRecordRaw[] = [
  {
    path: '/recruitment',
    name: 'Recruitment',
    component: null,
    meta: { title: '招募管理', icon: 'app:recruitment' },
    children: [
      {
        path: 'list',
        name: 'RecruitmentList',
        component: () => import('@/views/recruitment/RecruitList.vue'),
        meta: { title: '招募列表' },
      },
      listPage('rejected', '不合格供应商'),
      listPage('drafts', '草稿箱'),
    ],
  },
]

const inspectionRoutes: RouteRecordRaw[] = [
  {
    path: '/inspection',
    name: 'Inspection',
    component: null,
    meta: { title: '供应商考察', icon: 'app:inspection' },
    children: [
      {
        path: 'tasks',
        name: 'InspectionTasks',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'inspectionTasks' },
        meta: { title: '考察任务' },
      },
      {
        path: 'records',
        name: 'InspectionRecords',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'inspectionRecords' },
        meta: { title: '考察记录' },
      },
    ],
  },
]

const supplierRoutes: RouteRecordRaw[] = [
  {
    path: '/supplier',
    name: 'Supplier',
    component: null,
    meta: { title: '供应商管理', icon: 'app:supplier' },
    children: [
      {
        path: 'screening',
        name: 'SupplierScreening',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'supplierScreening' },
        meta: { title: '初筛供应商' },
      },
      {
        path: 'reserve',
        name: 'SupplierReserve',
        component: () => import('@/views/supplier/SupplierReserve.vue'),
        meta: { title: '储备供应商' },
      },
      {
        path: 'favorites',
        name: 'SupplierFavorites',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'supplierFavorites' },
        meta: { title: '收藏供应商' },
      },
      {
        path: 'recycle',
        name: 'SupplierRecycle',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'supplierRecycle' },
        meta: { title: '回收站' },
      },
      {
        path: 'card-exchange',
        name: 'SupplierCardExchange',
        component: () => import('@/views/supplier/CardExchange.vue'),
        meta: { title: '名片交换' },
      },
      {
        path: 'supplement',
        name: 'SupplierSupplement',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'supplierSupplement' },
        meta: { title: '补充资料' },
      },
    ],
  },
]

const tenderRoutes: RouteRecordRaw[] = [
  {
    path: '/tender',
    name: 'Tender',
    component: null,
    meta: { title: '招标管理', icon: 'app:tender' },
    children: [
      {
        path: 'publish',
        name: 'TenderPublish',
        component: () => import('@/views/tender/TenderPublish.vue'),
        meta: { title: '发布招标' },
      },
      {
        path: 'list',
        name: 'TenderList',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'tenderList' },
        meta: { title: '招标列表' },
      },
      {
        path: 'drafts',
        name: 'TenderDrafts',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'tenderDrafts' },
        meta: { title: '草稿箱' },
      },
    ],
  },
]

const meetingRoutes: RouteRecordRaw[] = [
  {
    path: '/meeting',
    name: 'Meeting',
    component: () => import('@/views/SimpleListPage.vue'),
    props: { configKey: 'meetingList' },
    meta: { title: '对接会', icon: 'app:meeting' },
  },
]

const companyRoutes: RouteRecordRaw[] = [
  {
    path: '/company',
    name: 'Company',
    component: null,
    meta: { title: '公司设置', icon: 'app:company' },
    children: [
      {
        path: 'profile',
        name: 'CompanyProfile',
        component: () => import('@/views/company/CompanyProfile.vue'),
        meta: { title: '公司资料' },
      },
      {
        path: 'org',
        name: 'CompanyOrg',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'companyOrg' },
        meta: { title: '组织架构' },
      },
      {
        path: 'projects',
        name: 'CompanyProjects',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'companyProjects' },
        meta: { title: '项目设置' },
      },
      {
        path: 'zone',
        name: 'CompanyZone',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'companyZone' },
        meta: { title: '企业专区' },
      },
      {
        path: 'accounts',
        name: 'CompanyAccounts',
        component: () => import('@/views/SimpleListPage.vue'),
        props: { configKey: 'companyAccounts' },
        meta: { title: '查看所有账号' },
      },
    ],
  },
]

const personalRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileSettings.vue'),
    meta: { title: '个人设置', icon: 'app:profile' },
  },
]

const systemManagementRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    name: 'SystemManagement',
    component: null,
    meta: {
      title: '系统管理',
      icon: 'solar:settings-outline',
    },
    children: [
      {
        path: 'users',
        name: 'BaseAdminUsers',
        component: () => import('@/views/BaseAdminUsers.vue'),
        meta: { title: '用户管理', icon: 'solar:users-group-rounded-outline' },
      },
      {
        path: 'roles',
        name: 'BaseAdminRoles',
        component: () => import('@/views/BaseAdminRoles.vue'),
        meta: { title: '角色管理', icon: 'solar:shield-user-outline' },
      },
      {
        path: 'menus',
        name: 'BaseAdminMenus',
        component: () => import('@/views/BaseAdminMenus.vue'),
        meta: { title: '菜单管理', icon: 'solar:menu-dots-outline' },
      },
    ],
  },
]

const baseAppDevRoutes: RouteRecordRaw[] = [
  {
    path: '/base-app',
    name: 'BaseApp',
    component: null,
    meta: {
      title: '基座应用',
      icon: 'solar:dumbbell-large-minimalistic-outline',
      hideInMenu: true,
    },
    children: [
      {
        path: 'icons',
        name: 'Icons',
        component: () => import('@/views/IconsRender.vue'),
        meta: { title: '全量图标', icon: 'solar:album-outline' },
      },
      {
        path: 'theme-editor',
        name: 'ThemeEditor',
        component: () => import('@/views/ThemeEditor/ThemeEditor.vue'),
        meta: { title: '主题编辑器', icon: 'solar:album-outline' },
      },
      {
        path: 'super-table',
        name: 'SuperTableDemo',
        component: () => import('@/views/SuperTableDemo.vue'),
        meta: { title: '超级表格', icon: 'solar:bill-list-outline' },
      },
    ],
  },
]

export const asyncRoutes: RouteRecordRaw[] = [
  ...workbenchRoutes,
  ...recruitmentRoutes,
  ...inspectionRoutes,
  ...supplierRoutes,
  ...tenderRoutes,
  ...meetingRoutes,
  ...companyRoutes,
  ...personalRoutes,
  ...(import.meta.env.DEV ? [...baseAppDevRoutes, ...systemManagementRoutes] : []),
]

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import('@/views/exceptions/NotFound.vue'),
  },
]
