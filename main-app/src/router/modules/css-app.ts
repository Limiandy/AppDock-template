import MicroAppLoader from '@/layout/MicroAppLoader.vue'

export default [
  {
    path: 'css-app',
    name: 'CssApp',
    component: MicroAppLoader,
    meta: {
      title: 'CSS 训练场',
      icon: 'solar:accumulator-outline',
    },
    children: [
      {
        path: 'home',
        name: 'CssAppHome',
        component: MicroAppLoader,
        meta: {
          title: '首页',
          icon: 'solar:home-outline',
        },
      },
    ],
  },
]
