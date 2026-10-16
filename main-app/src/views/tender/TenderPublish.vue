<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <h2 class="tender-publish__title">发布招标</h2>

    <a-form layout="horizontal" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" class="tender-publish__form">
      <a-row :gutter="[24, 0]">
        <a-col :xs="24" :xl="12">
          <a-form-item label="招标名称" required>
            <a-input v-model:value="model.title" placeholder="请输入招标名称，如：地区+项目名称+服务分类+招标公告" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="采购方式" required>
            <a-select
              v-model:value="model.purchaseMethod"
              placeholder="搜索供应商名称 / 服务分类"
              :options="selectOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="所属公司" required>
            <a-select v-model:value="model.company" :options="companyOptions" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="招标类别" required>
            <a-select
              v-model:value="model.category"
              placeholder="请选择服务分类，支持关键字搜索"
              :options="categoryOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="招标方式" required>
            <a-select v-model:value="model.method" placeholder="搜索供应商名称 / 服务分类" :options="methodOptions" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="报名截止时间" required>
            <a-date-picker
              v-model:value="model.deadline"
              show-time
              style="width: 100%"
              placeholder="请选择报名截止时间"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="招标项目" required>
            <a-select v-model:value="model.project" placeholder="请选择招标项目" :options="projectOptions" />
          </a-form-item>
        </a-col>
      </a-row>

      <div class="tender-publish__section">供应商投标条件</div>

      <a-row :gutter="[24, 0]">
        <a-col :xs="24" :xl="12">
          <a-form-item label="注册资金" required>
            <div class="tender-publish__inline">
              <a-select v-model:value="model.capital" placeholder="请输入注册资金" :options="capitalOptions" />
              <span class="tender-publish__suffix">万元以上</span>
            </div>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="服务区域" required>
            <a-select
              v-model:value="model.area"
              placeholder="以企业及分支机构所在地区为筛选项"
              :options="areaOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="服务资质" required>
            <div class="tender-publish__inline">
              <a-select
                v-model:value="model.qualification"
                placeholder="请选择服务资质"
                :options="qualificationOptions"
              />
              <span class="tender-publish__suffix">及以上</span>
            </div>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="成功案例" required>
            <div class="tender-publish__inline">
              <a-select v-model:value="model.caseCount" placeholder="不限" :options="caseOptions" />
              <span class="tender-publish__suffix">个以上</span>
              <a-checkbox v-model:checked="model.caseInArea">限服务区域内</a-checkbox>
            </div>
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item :wrapper-col="{ offset: 6 }">
            <div class="tender-publish__measure">
              <a-button @click="onMeasure">测算</a-button>
              <span>点击测算符合条件的供应商数量</span>
            </div>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="招标详情" required>
        <a-textarea v-model:value="model.detail" :rows="6" :maxlength="200" show-count placeholder="请输入招标详情" />
      </a-form-item>

      <a-form-item label="招标详情" required>
        <a-checkbox v-model:checked="model.needSupplement">供应商报名招标时需补充资料</a-checkbox>
        <a-checkbox v-model:checked="model.noSupplement" class="tender-publish__checkbox">不需要补充资料</a-checkbox>
      </a-form-item>

      <a-form-item label="招标详情">
        <a-upload-dragger v-model:file-list="fileList" multiple :before-upload="() => false">
          <p class="tender-publish__upload-icon">
            <SvgIcon name="solar:cloud-upload-outline" />
          </p>
          <p class="tender-publish__upload-text">
            点击上传文件，单个文件大小不超过150M；支持
            doc、docx、xls、xlsx、ppt、pptx、pdf、jpg、jpeg、bmp、png、zip、rar 格式文件
          </p>
        </a-upload-dragger>
        <div class="tender-publish__upload-count">已上传 {{ fileList.length }}/0 个文件</div>
      </a-form-item>

      <div class="tender-publish__section">设置招标负责人</div>

      <a-row :gutter="[24, 0]">
        <a-col :xs="24" :xl="12">
          <a-form-item label="招标负责人" required>
            <div class="tender-publish__inline">
              <a-select v-model:value="model.owner" :options="ownerOptions" />
              <a class="tender-publish__link">添加不在平台的负责人</a>
            </div>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="办公电话" required>
            <a-input v-model:value="model.officePhone" placeholder="办公电话" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :xl="12">
          <a-form-item label="职务" required>
            <a-select v-model:value="model.ownerRole" placeholder="请输入招标负责人公司职务" :options="roleOptions" />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>

    <div class="tender-publish__footer">
      <a-button type="primary" @click="onSubmit">发布招标</a-button>
      <a-button @click="onSaveDraft">存为草稿</a-button>
      <a-button type="text" @click="onReset">取消</a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import dayjs from 'dayjs'
import { SvgIcon } from 'common'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const global = useGlobalStore()

const selectOptions = [
  { label: '公开招标', value: '公开招标' },
  { label: '邀请招标', value: '邀请招标' },
  { label: '竞争性谈判', value: '竞争性谈判' },
]
const companyOptions = [{ label: '明源云采购', value: '明源云采购' }]
const categoryOptions = ['电梯', '防水材料', '智能化', '精装修'].map((item) => ({ label: item, value: item }))
const methodOptions = selectOptions
const projectOptions = [
  { label: '明源云谷产业园', value: '明源云谷产业园' },
  { label: '广州智慧城公寓', value: '广州智慧城公寓' },
]
const capitalOptions = [100, 500, 1000, 2000].map((item) => ({ label: `${item}`, value: item }))
const areaOptions = ['全国', '华南', '华东', '西南'].map((item) => ({ label: item, value: item }))
const qualificationOptions = ['电子系统工程甲级', '特种设备安装改造维修单位A'].map((item) => ({
  label: item,
  value: item,
}))
const caseOptions = ['不限', '1', '3', '5'].map((item) => ({ label: item, value: item }))
const ownerOptions = [
  { label: '吴兴江', value: '吴兴江' },
  { label: '尹先森', value: '尹先森' },
]
const roleOptions = ['招采负责人', '招标负责人', '采购经理'].map((item) => ({ label: item, value: item }))

const model = reactive({
  title: '',
  purchaseMethod: undefined as string | undefined,
  company: '明源云采购',
  category: undefined as string | undefined,
  method: undefined as string | undefined,
  deadline: dayjs('2021-07-29 24:00', 'YYYY-MM-DD HH:mm'),
  project: undefined as string | undefined,
  capital: undefined as number | undefined,
  area: undefined as string | undefined,
  qualification: undefined as string | undefined,
  caseCount: '不限' as string | undefined,
  caseInArea: false,
  detail: '',
  needSupplement: false,
  noSupplement: true,
  owner: '吴兴江' as string | undefined,
  ownerRole: undefined as string | undefined,
  officePhone: '',
})

const fileList = ref([])

function onMeasure() {
  global.message.success('原型演示：符合条件的供应商约 128 家')
}

function onSubmit() {
  global.message.success('原型演示：招标已发布')
}

function onSaveDraft() {
  global.message.info('原型演示：已存为草稿')
}

function onReset() {
  global.message.info('原型演示：已取消')
}

const [className, scopeClass] = useStyle('tender-publish', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'

  return {
    'margin': `${token.margin}px`,
    'borderRadius': `${token.borderRadiusLG}px`,

    '.tender-publish__title': {
      margin: `0 0 ${token.margin}px`,
      fontSize: `${token.fontSizeHeading4}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.tender-publish__form': {
      [`${rootCls}-form-item-label`]: {
        color: token.colorTextSecondary,
      },
    },

    '.tender-publish__section': {
      margin: `${token.marginLG}px 0 ${token.margin}px`,
      fontSize: `${token.fontSizeLG}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.tender-publish__inline': {
      display: 'flex',
      alignItems: 'center',
      gap: `${token.marginXS}px`,
    },

    '.tender-publish__suffix': {
      flexShrink: 0,
      color: token.colorTextSecondary,
    },

    '.tender-publish__checkbox': {
      marginInlineStart: `${token.margin}px`,
    },

    '.tender-publish__measure': {
      display: 'flex',
      alignItems: 'center',
      gap: `${token.marginXS}px`,
      color: token.colorTextSecondary,
    },

    '.tender-publish__upload-icon': {
      margin: `${token.margin}px 0 ${token.marginXS}px`,
      fontSize: `${token.fontSizeHeading3}px`,
      color: token.colorPrimary,
    },

    '.tender-publish__upload-text': {
      color: token.colorTextTertiary,
      fontSize: `${token.fontSizeSM}px`,
    },

    '.tender-publish__upload-count': {
      marginTop: `${token.marginXS}px`,
      textAlign: 'right',
      color: token.colorTextTertiary,
      fontSize: `${token.fontSizeSM}px`,
    },

    '.tender-publish__link': {
      flexShrink: 0,
      color: token.colorPrimary,
    },

    '.tender-publish__footer': {
      display: 'flex',
      gap: `${token.marginXS}px`,
      paddingTop: `${token.padding}px`,
      borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
    },
  }
})
</script>
