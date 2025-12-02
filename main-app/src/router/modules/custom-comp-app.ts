import MicroAppLoader from '@/layout/MicroAppLoader.vue'

export default [
  {
    path: 'custom-comp-app',
    name: 'CustomCompApp',
    component: MicroAppLoader,
    meta: {
      title: '自定义组件',
      icon: 'solar:atom-broken',
    },
    children: [
      {
        path: 'home',
        name: 'CustomCompAppHome',
        component: MicroAppLoader,
        meta: {
          title: '首页',
          icon: 'solar:home-outline',
        },
      },
      {
        path: 'slam',
        name: 'CustomCompAppSlam',
        component: MicroAppLoader,
        meta: {
          title: 'SLAM 地图',
          icon: 'solar:gallery-wide-linear',
        },
      },
    ],
  },
]
