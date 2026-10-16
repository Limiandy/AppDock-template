import type { SuperTableRecord, SuperTableRequestParams, SuperTableRequestResult } from 'common'

/**
 * 原型数据集：按参考稿（明源云采购开发商后台）整理的静态演示数据。
 *
 * 说明：原型阶段用单一数据集仓库承载各页面数据；正式项目应按
 * `main-app/src/data/<domain>/` 的模式拆成领域 repository（mock + supabase 双实现）。
 */

export interface SupplierRecord extends SuperTableRecord {
  id: string
  name: string
  certified: boolean
  erpImported: boolean
  honors: string[]
  tags: string[]
  categories: string[]
  capital: string
  capitalValue: number
  areas: string
  cases: string
  inspectResult: string
  performance: string
  stage: 'screening' | 'reserve' | 'favorite' | 'recycle' | 'supplement' | 'rejected'
}

export interface RecruitRecord extends SuperTableRecord {
  id: string
  title: string
  pendingBadge?: string
  requirement: string
  publishedAt: string
  handlers: string
  applied: number
  unviewed: number
  stored: number
  status: '报名中' | '报名截止'
  owner: '我负责的' | '公司其他'
}

export interface TenderRecord extends SuperTableRecord {
  id: string
  title: string
  company: string
  method: string
  category: string
  deadline: string
  applied: number
  unviewed: number
  stored: number
  status: '报名中' | '评标中' | '已截止'
}

export interface CardRecord extends SuperTableRecord {
  id: string
  name: string
  role: string
  company: string
  logoText: string
  logoColor: string
  category: '人脉广场' | '人脉处理' | '人脉申请'
  target: '供应商' | '开发商'
  status: '可申请' | '可交换' | '已申请'
}

export interface MeetingRecord extends SuperTableRecord {
  id: string
  title: string
  city: string
  date: string
  category: string
  attendeeCount: number
  status: '报名中' | '待举办' | '已结束'
}

export interface InspectionRecord extends SuperTableRecord {
  id: string
  supplier: string
  type: string
  inspector: string
  deadline: string
  result: string
  status: '待考察' | '考察中' | '已完成'
}

export interface SourcingRecord extends SuperTableRecord {
  id: string
  title: string
  category: string
  area: string
  publishedAt: string
  status: '进行中' | '已结束'
}

export interface CompanyOrgRecord extends SuperTableRecord {
  id: string
  name: string
  parent: string
  owner: string
  members: number
}

export interface CompanyProjectRecord extends SuperTableRecord {
  id: string
  name: string
  region: string
  type: string
  status: '建设中' | '已竣工'
}

export interface CompanyZoneRecord extends SuperTableRecord {
  id: string
  title: string
  type: string
  publishedAt: string
  status: '已发布' | '草稿'
}

export interface CompanyAccountRecord extends SuperTableRecord {
  id: string
  name: string
  phone: string
  role: string
  department: string
  status: '启用' | '停用'
}

export const suppliers: SupplierRecord[] = [
  {
    id: 'sup-001',
    name: '上海三棵树防水涂料有限公司',
    certified: false,
    erpImported: true,
    honors: ['行业竞争力十强', '百强战略', '行业TOP级'],
    tags: ['坪地面工程', '防水工程', '内外墙涂料', '保温材料', '特殊地面材料'],
    categories: [
      '工程咨询单位-电子系统工程甲级',
      '特种设备安装改造维修单位A',
      '产品安全生产认证备案资料',
      '特种设备制造许可证（电梯）备案',
      '电梯安装维护改造A级',
    ],
    capital: '2000万元人民币',
    capitalValue: 2000,
    areas: '上海、广州',
    cases: '湘潭五矿万境水岸-深圳等',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量2分，服务配合1分',
    stage: 'reserve',
  },
  {
    id: 'sup-002',
    name: '厦门狄耐克电子科技有限公司',
    certified: true,
    erpImported: true,
    honors: ['行业竞争力十强'],
    tags: ['楼宇对讲', '智能家居'],
    categories: ['电子与智能化工程专业承包二级'],
    capital: '2.1亿元',
    capitalValue: 21000,
    areas: '福建、广东',
    cases: '厦门大学附属第一医院',
    inspectResult: '良好',
    performance: '质量价格3分，出货数量3分，服务配合2分',
    stage: 'reserve',
  },
  {
    id: 'sup-003',
    name: '上海三棵树防水技术有限公司',
    certified: true,
    erpImported: false,
    honors: ['百强战略'],
    tags: ['防水材料', '地坪工程'],
    categories: ['防水防腐保温工程专业承包一级'],
    capital: '5000万元人民币',
    capitalValue: 5000,
    areas: '上海、江苏',
    cases: '上海虹桥枢纽',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量2分，服务配合2分',
    stage: 'reserve',
  },
  {
    id: 'sup-004',
    name: '贝朗（中国）卫浴有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['卫浴洁具'],
    categories: ['给排水设备'],
    capital: '1.0亿元',
    capitalValue: 10000,
    areas: '全国',
    cases: '万科翡翠系项目',
    inspectResult: '良好',
    performance: '质量价格2分，出货数量2分，服务配合2分',
    stage: 'reserve',
  },
  {
    id: 'sup-005',
    name: '中宝达灯控系统（中山）有限公司',
    certified: true,
    erpImported: true,
    honors: ['行业TOP级'],
    tags: ['照明控制'],
    categories: ['照明工程设计专项乙级'],
    capital: '800万元人民币',
    capitalValue: 800,
    areas: '广东、海南',
    cases: '金地集团总部',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量3分，服务配合3分',
    stage: 'screening',
  },
  {
    id: 'sup-006',
    name: '湖南五矿地产地坪工程有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['地坪工程', '土建施工'],
    categories: ['建筑工程施工总承包三级'],
    capital: '1200万元人民币',
    capitalValue: 1200,
    areas: '湖南、湖北',
    cases: '长沙梅溪湖项目',
    inspectResult: '待考察',
    performance: '质量价格2分，出货数量1分，服务配合2分',
    stage: 'screening',
  },
  {
    id: 'sup-007',
    name: '广州白云化工实业有限公司',
    certified: true,
    erpImported: true,
    honors: ['百强战略', '行业TOP级'],
    tags: ['结构胶', '密封胶'],
    categories: ['建筑密封材料'],
    capital: '3000万元人民币',
    capitalValue: 3000,
    areas: '广东、广西',
    cases: '广州塔幕墙',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量2分，服务配合3分',
    stage: 'favorite',
  },
  {
    id: 'sup-008',
    name: '四川蜀羊防水材料有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['防水卷材'],
    categories: ['防水防腐保温工程专业承包二级'],
    capital: '600万元人民币',
    capitalValue: 600,
    areas: '四川、重庆',
    cases: '成都天府新区',
    inspectResult: '不通过',
    performance: '质量价格1分，出货数量1分，服务配合1分',
    stage: 'recycle',
  },
  {
    id: 'sup-009',
    name: '深圳卓宝科技股份有限公司',
    certified: true,
    erpImported: false,
    honors: ['行业竞争力十强'],
    tags: ['防水材料', '保温装饰'],
    categories: ['建筑防水工程专业承包一级'],
    capital: '8000万元人民币',
    capitalValue: 8000,
    areas: '深圳、东莞',
    cases: '深圳湾一号',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量2分，服务配合2分',
    stage: 'supplement',
  },
  {
    id: 'sup-010',
    name: '广东省联塑科技实业有限公司',
    certified: true,
    erpImported: true,
    honors: ['百强战略'],
    tags: ['管材管件', '市政给排水'],
    categories: ['给排水设备', '市政公用工程施工总承包二级'],
    capital: '1.2亿元',
    capitalValue: 12000,
    areas: '广东、湖南',
    cases: '广州南沙新区',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量3分，服务配合2分',
    stage: 'favorite',
  },
  {
    id: 'sup-011',
    name: '北京东方雨虹防水技术股份有限公司',
    certified: true,
    erpImported: true,
    honors: ['行业竞争力十强', '行业TOP级'],
    tags: ['防水材料', '防水施工'],
    categories: ['防水防腐保温工程专业承包一级'],
    capital: '3.5亿元',
    capitalValue: 35000,
    areas: '全国',
    cases: '北京大兴机场',
    inspectResult: '优秀',
    performance: '质量价格3分，出货数量3分，服务配合3分',
    stage: 'recycle',
  },
  {
    id: 'sup-012',
    name: '广州集泰化工股份有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['密封胶', '水性涂料'],
    categories: ['建筑密封材料'],
    capital: '1800万元人民币',
    capitalValue: 1800,
    areas: '广东、福建',
    cases: '珠海横琴项目',
    inspectResult: '良好',
    performance: '质量价格2分，出货数量2分，服务配合2分',
    stage: 'supplement',
  },
  {
    id: 'sup-013',
    name: '浙江亚厦装饰股份有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['精装修', '工装'],
    categories: ['建筑装修装饰工程专业承包一级'],
    capital: '2.6亿元',
    capitalValue: 26000,
    areas: '浙江、江苏',
    cases: '杭州亚运村',
    inspectResult: '不通过',
    performance: '质量价格1分，出货数量2分，服务配合1分',
    stage: 'rejected',
  },
  {
    id: 'sup-014',
    name: '郑州中原国际石材有限公司',
    certified: false,
    erpImported: false,
    honors: [],
    tags: ['石材', '幕墙'],
    categories: ['建筑幕墙工程专业承包二级'],
    capital: '900万元人民币',
    capitalValue: 900,
    areas: '河南、陕西',
    cases: '郑州会展中心',
    inspectResult: '不通过',
    performance: '质量价格1分，出货数量1分，服务配合2分',
    stage: 'rejected',
  },
]

export const recruits: RecruitRecord[] = [
  {
    id: 'rec-001',
    title: '精装修工程招募',
    pendingBadge: '存在未处理的报名',
    requirement: '500万注册资本 / 案例3个及以上 / 重庆、广西、四川等6个地区',
    publishedAt: '2018-02-18',
    handlers: 'hp等3人可处理该招募',
    applied: 223,
    unviewed: 56,
    stored: 0,
    status: '报名中',
    owner: '我负责的',
  },
  {
    id: 'rec-002',
    title: '中宝达灯控系统供应商招募',
    requirement: '500万注册资本 / 案例3个及以上 / 重庆、广西、四川等6个地区',
    publishedAt: '2018-02-18',
    handlers: 'hp等2人可处理该招募',
    applied: 23,
    unviewed: 212,
    stored: 10,
    status: '报名中',
    owner: '我负责的',
  },
  {
    id: 'rec-003',
    title: '湖南五矿地产地坪地面工程供应商招募',
    requirement: '500万注册资本 / 案例3个及以上 / 重庆、广西、四川等6个地区',
    publishedAt: '2018-02-18',
    handlers: 'hp等2人可处理该招募',
    applied: 19,
    unviewed: 56,
    stored: 235,
    status: '报名截止',
    owner: '我负责的',
  },
  {
    id: 'rec-004',
    title: '三棵树防水涂料供应商招募',
    requirement: '500万注册资本 / 案例3个及以上 / 重庆、广西、四川等6个地区',
    publishedAt: '2018-02-18',
    handlers: 'hp等2人可处理该招募',
    applied: 123,
    unviewed: 555,
    stored: 24,
    status: '报名中',
    owner: '我负责的',
  },
  {
    id: 'rec-005',
    title: '万达地产精装修工程招募',
    requirement: '500万注册资本 / 案例3个及以上 / 重庆、广西、四川等6个地区',
    publishedAt: '2018-02-18',
    handlers: 'hp等2人可处理该招募',
    applied: 64,
    unviewed: 356,
    stored: 235,
    status: '报名中',
    owner: '公司其他',
  },
  {
    id: 'rec-006',
    title: '金地集团入户门战略采购招募',
    requirement: '1000万注册资本 / 案例5个及以上 / 全国',
    publishedAt: '2018-03-02',
    handlers: 'hp等2人可处理该招募',
    applied: 48,
    unviewed: 120,
    stored: 12,
    status: '报名截止',
    owner: '公司其他',
  },
]

export const tenders: TenderRecord[] = [
  {
    id: 'ten-001',
    title: '2021年度电梯设备集中采购招标',
    company: '明源云采购',
    method: '公开招标',
    category: '电梯',
    deadline: '2021-07-29 24:00',
    applied: 18,
    unviewed: 6,
    stored: 4,
    status: '报名中',
  },
  {
    id: 'ten-002',
    title: '华南区域防水材料战略招标',
    company: '明源云采购',
    method: '邀请招标',
    category: '防水材料',
    deadline: '2021-07-12 24:00',
    applied: 26,
    unviewed: 3,
    stored: 11,
    status: '评标中',
  },
  {
    id: 'ten-003',
    title: '智能家居系统供应商招标公告',
    company: '明源云采购',
    method: '公开招标',
    category: '智能化',
    deadline: '2021-06-30 24:00',
    applied: 42,
    unviewed: 0,
    stored: 19,
    status: '已截止',
  },
  {
    id: 'ten-004',
    title: '精装修瓷砖集采招标',
    company: '明源云采购',
    method: '公开招标',
    category: '精装修',
    deadline: '2021-08-05 24:00',
    applied: 9,
    unviewed: 9,
    stored: 0,
    status: '报名中',
  },
]

export const cards: CardRecord[] = [
  {
    id: 'card-001',
    name: '梁**',
    role: '高级采购经理',
    company: '欧普照明股份有限公司',
    logoText: 'OPPLE',
    logoColor: '#1F4FD8',
    category: '人脉广场',
    target: '供应商',
    status: '可申请',
  },
  {
    id: 'card-002',
    name: '李**',
    role: '技术总监',
    company: '山东中科蓝天科技有限公司',
    logoText: 'Panasonic',
    logoColor: '#0B4EA2',
    category: '人脉广场',
    target: '供应商',
    status: '可交换',
  },
  {
    id: 'card-003',
    name: '许**',
    role: '高级采购经理',
    company: '深圳市凯迪仕智能科技有限公司',
    logoText: 'KAADAS',
    logoColor: '#20294A',
    category: '人脉广场',
    target: '供应商',
    status: '已申请',
  },
  {
    id: 'card-004',
    name: '叶**',
    role: '高级采购经理',
    company: '欧普照明股份有限公司',
    logoText: 'OPPLE',
    logoColor: '#1F4FD8',
    category: '人脉处理',
    target: '供应商',
    status: '可交换',
  },
  {
    id: 'card-005',
    name: '蔡**',
    role: '高级采购经理',
    company: '深圳市凯迪仕智能科技有限公司',
    logoText: 'KAADAS',
    logoColor: '#20294A',
    category: '人脉处理',
    target: '开发商',
    status: '可交换',
  },
  {
    id: 'card-006',
    name: '尹先森',
    role: '招采负责人',
    company: '明源云采购',
    logoText: '明源',
    logoColor: '#F85300',
    category: '人脉申请',
    target: '开发商',
    status: '已申请',
  },
]

export const meetings: MeetingRecord[] = [
  {
    id: 'mtg-001',
    title: '2021华南地产供应链对接会',
    city: '广州',
    date: '2021-08-12',
    category: '综合对接',
    attendeeCount: 128,
    status: '报名中',
  },
  {
    id: 'mtg-002',
    title: '华东区域精装修专场对接会',
    city: '上海',
    date: '2021-09-03',
    category: '精装修',
    attendeeCount: 86,
    status: '待举办',
  },
  {
    id: 'mtg-003',
    title: '西南区域防水材料供需对接会',
    city: '成都',
    date: '2021-06-18',
    category: '防水材料',
    attendeeCount: 64,
    status: '已结束',
  },
]

export const inspections: InspectionRecord[] = [
  {
    id: 'ins-001',
    supplier: '上海三棵树防水涂料有限公司',
    type: '工厂考察',
    inspector: '吴兴江',
    deadline: '2021-07-20',
    result: '优秀',
    status: '已完成',
  },
  {
    id: 'ins-002',
    supplier: '中宝达灯控系统（中山）有限公司',
    type: '工厂考察',
    inspector: '尹先森',
    deadline: '2021-07-30',
    result: '',
    status: '考察中',
  },
  {
    id: 'ins-003',
    supplier: '四川蜀羊防水材料有限公司',
    type: '项目考察',
    inspector: '李工',
    deadline: '2021-08-06',
    result: '',
    status: '待考察',
  },
]

export const sourcing: SourcingRecord[] = [
  {
    id: 'src-001',
    title: '华东区域寻源：精装修石材',
    category: '精装修',
    area: '华东',
    publishedAt: '2021-07-02',
    status: '进行中',
  },
  {
    id: 'src-002',
    title: '全国寻源：电梯维保服务商',
    category: '电梯',
    area: '全国',
    publishedAt: '2021-06-21',
    status: '进行中',
  },
  {
    id: 'src-003',
    title: '华南区域寻源：防水卷材',
    category: '防水材料',
    area: '华南',
    publishedAt: '2021-05-18',
    status: '已结束',
  },
]

export const companyOrg: CompanyOrgRecord[] = [
  { id: 'org-001', name: '招采中心', parent: '公司总部', owner: '尹先森', members: 12 },
  { id: 'org-002', name: '成本管理部', parent: '公司总部', owner: '吴兴江', members: 8 },
  { id: 'org-003', name: '工程管理部', parent: '公司总部', owner: '李工', members: 21 },
]

export const companyProjects: CompanyProjectRecord[] = [
  { id: 'prj-001', name: '明源云谷产业园', region: '深圳', type: '产业园区', status: '建设中' },
  { id: 'prj-002', name: '广州智慧城公寓', region: '广州', type: '住宅', status: '建设中' },
  { id: 'prj-003', name: '长沙梅溪湖商业综合体', region: '长沙', type: '商业', status: '已竣工' },
]

export const companyZone: CompanyZoneRecord[] = [
  { id: 'zone-001', title: '企业资质与荣誉展示', type: '企业专区', publishedAt: '2021-06-08', status: '已发布' },
  { id: 'zone-002', title: '年度采购需求发布', type: '采购需求', publishedAt: '2021-07-01', status: '已发布' },
  { id: 'zone-003', title: '供应商招募宣传页（草稿）', type: '企业专区', publishedAt: '', status: '草稿' },
]

export const companyAccounts: CompanyAccountRecord[] = [
  { id: 'acc-001', name: '尹先森', phone: '138****0001', role: '管理员', department: '招采中心', status: '启用' },
  { id: 'acc-002', name: '吴兴江', phone: '138****0002', role: '招标负责人', department: '招采中心', status: '启用' },
  { id: 'acc-003', name: '李工', phone: '138****0003', role: '考察负责人', department: '工程管理部', status: '停用' },
]

export const workbenchPending = [
  { key: 'recruit', label: '招募报名', value: 80, unit: '个', icon: 'app:recruitment' },
  { key: 'stock', label: '主动入库', value: 222, unit: '次', icon: 'app:supplier' },
  { key: 'form', label: '信息登记表', value: 226, unit: '项', icon: 'solar:document-text-outline' },
  { key: 'card', label: '名片交换', value: 20, unit: '次', icon: 'solar:card-outline' },
]

export const workbenchTender = [
  { key: 'apply', label: '招标报名', value: 10, unit: '个', icon: 'app:tender' },
  { key: 'question', label: '疑问解答', value: 45, unit: '次', icon: 'solar:chat-round-dots-outline' },
  { key: 'bid', label: '回标中', value: 28, unit: '项', icon: 'solar:document-add-outline' },
  { key: 'evaluate', label: '待评标', value: 19, unit: '个', icon: 'solar:clipboard-check-outline' },
]

export interface MessageRecord extends SuperTableRecord {
  id: string
  category: '我的消息' | '平台公告' | '系统通知'
  tag: string
  title: string
  desc: string
  date: string
  read: boolean
}

export const messageCenter: MessageRecord[] = [
  {
    id: 'mc-001',
    category: '我的消息',
    tag: '招募报名',
    title: '中宝达灯控系统供应商招募',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
    read: false,
  },
  {
    id: 'mc-002',
    category: '我的消息',
    tag: '招募报名',
    title: '金地集团入户门2021年度战略采购公告',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
    read: false,
  },
  {
    id: 'mc-003',
    category: '我的消息',
    tag: '招募报名',
    title: '联采需求品类审核通知',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
    read: true,
  },
  {
    id: 'mc-004',
    category: '我的消息',
    tag: '名片交换',
    title: '李** 申请与您交换名片',
    desc: '来自山东中科蓝天科技有限公司的技术总监希望与您建立联系',
    date: '2020年06月07日',
    read: false,
  },
  {
    id: 'mc-005',
    category: '我的消息',
    tag: '招标答疑',
    title: '2021年度电梯设备集中采购招标 新增疑问',
    desc: '供应商提交 2 条疑问，请及时解答以免影响报名',
    date: '2020年06月06日',
    read: true,
  },
  {
    id: 'mc-006',
    category: '平台公告',
    tag: '平台公告',
    title: '云采购平台 7 月采购节活动开启',
    desc: '认证采购商可参与集采专场，提前锁定优质供应商',
    date: '2021年07月01日',
    read: false,
  },
  {
    id: 'mc-007',
    category: '平台公告',
    tag: '平台公告',
    title: '供应商认证标准升级说明',
    desc: '新增行业竞争力评估维度，自 7 月起生效',
    date: '2021年06月20日',
    read: true,
  },
  {
    id: 'mc-008',
    category: '系统通知',
    tag: '系统通知',
    title: '企业专区内容审核通过',
    desc: '《年度采购需求发布》已通过审核并对外展示',
    date: '2021年07月02日',
    read: false,
  },
  {
    id: 'mc-009',
    category: '系统通知',
    tag: '系统通知',
    title: '账号安全提醒',
    desc: '建议每 90 天修改一次密码，避免账号共享',
    date: '2021年06月28日',
    read: true,
  },
]

export const workbenchMessages = [
  {
    id: 'msg-001',
    tag: '招募报名',
    title: '中宝达灯控系统供应商招募',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
  },
  {
    id: 'msg-002',
    tag: '招募报名',
    title: '金地集团入户门2021年度战略采购公告',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
  },
  {
    id: 'msg-003',
    tag: '招募报名',
    title: '联采需求品类审核通知',
    desc: '尊敬【吴兴江】，您参与过的【DAA】，新增品类【15975】，如需补充',
    date: '2020年06月08日',
  },
]

export const workbenchBoardNotices = [
  {
    id: 'notice-001',
    tag: '平台公告',
    title: '云采购平台 7 月采购节活动开启',
    desc: '认证采购商可参与集采专场',
    date: '2021年07月01日',
  },
  {
    id: 'notice-002',
    tag: '平台公告',
    title: '供应商认证标准升级说明',
    desc: '新增行业竞争力评估维度',
    date: '2021年06月20日',
  },
]

export const workbenchPerformance = {
  total: 3200,
  sources: [
    { name: '招募入库', value: 1500 },
    { name: '对接会入库', value: 1000 },
    { name: '主动入库', value: 700 },
  ],
}

export const platformDynamics = {
  certified: 29128,
  weeklyNew: 298,
  suppliers: [
    {
      id: 'dyn-001',
      name: '厦门狄耐克电子科技有限公司',
      logoText: 'DNAKE',
      logoColor: '#20294A',
      capital: '2.00亿',
      scope: '服务全国',
      year: '2018',
    },
    {
      id: 'dyn-002',
      name: '上海三棵树防水技术有限公司',
      logoText: '三棵树',
      logoColor: '#1B8A3A',
      capital: '23.00亿',
      scope: '服务全国',
      year: '2018',
    },
    {
      id: 'dyn-003',
      name: '贝朗（中国）卫浴有限公司',
      logoText: 'BRAVAT',
      logoColor: '#20294A',
      capital: '1.00亿',
      scope: '服务全国',
      year: '2018',
    },
  ],
}

export const companyProfile = {
  name: '明源云采购',
  qualification: '房地产开发一级',
  businessAreas: ['商业地产', '工业地产'],
  honors: '2020年度中国房地产采购平台十强',
  intro:
    '明源云采购（www.mycaigou.com）是深圳市明源云采购科技有限公司旗下网站，打造中国房地产行业领先的采购招投标平台。',
  website: 'http://www.sunac.com.cn/',
  weibo: '',
  wechat: '',
  contacts: [{ id: 'ct-001', title: '公司联系信息', name: '尹先森', phone: '13800000001', email: 'yin@example.com' }],
}

export const profileRecord = {
  name: '尹先森',
  phone: '138****0001',
  email: 'yin@example.com',
  department: '招采中心',
  role: '招采负责人',
  company: '明源云采购',
}

export const datasets = {
  sourcing,
  recruitmentRejected: suppliers.filter((item) => item.stage === 'rejected'),
  recruitmentDrafts: recruits.slice(0, 2),
  inspectionTasks: inspections,
  inspectionRecords: inspections.filter((item) => item.status === '已完成'),
  supplierScreening: suppliers.filter((item) => item.stage === 'screening'),
  supplierReserve: suppliers.filter((item) => item.stage === 'reserve'),
  supplierFavorites: suppliers.filter((item) => item.stage === 'favorite'),
  supplierRecycle: suppliers.filter((item) => item.stage === 'recycle'),
  supplierSupplement: suppliers.filter((item) => item.stage === 'supplement'),
  tenderList: tenders,
  tenderDrafts: tenders.slice(0, 2),
  meetingList: meetings,
  messageCenter,
  companyOrg,
  companyProjects,
  companyZone,
  companyAccounts,
} as const

export type DatasetKey = keyof typeof datasets

/** 原型数据集查询：按查询条件做包含匹配 + 内存分页 */
export function queryDataset(key: DatasetKey, params: SuperTableRequestParams): Promise<SuperTableRequestResult> {
  const rows = datasets[key] as SuperTableRecord[]
  const search = params.search ?? {}

  const filtered = rows.filter((row) =>
    Object.entries(search).every(([field, value]) => {
      if (value === undefined || value === null || value === '' || Array.isArray(value)) return true
      return String(row[field] ?? '')
        .toLowerCase()
        .includes(String(value).toLowerCase())
    }),
  )

  const start = Math.max(0, (params.current - 1) * params.pageSize)
  return Promise.resolve({
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
  })
}

export default datasets
