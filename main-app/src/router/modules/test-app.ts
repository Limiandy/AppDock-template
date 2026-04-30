import MicroAppLoader from '@/layout/MicroAppLoader.vue'

export default [
  {
    path: 'test-app',
    name: 'TestApp',
    component: MicroAppLoader,
    meta: {
      title: 'test-app',
      icon: 'solar:widget-outline',
    },
    children: [
      {
        path: 'home',
        name: 'TestAppHome',
        component: MicroAppLoader,
        meta: {
          title: '首页',
          icon: 'solar:home-outline',
        },
      },
    ],
  },
]
