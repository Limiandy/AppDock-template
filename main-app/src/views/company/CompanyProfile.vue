<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <h2 class="company-profile__title">公司资料</h2>

    <a-form layout="horizontal" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }" class="company-profile__form">
      <a-form-item label="公司LOGO">
        <a-upload v-model:file-list="logoFiles" list-type="picture-card" :before-upload="() => false">
          <div class="company-profile__upload">
            <SvgIcon name="solar:cloud-upload-outline" />
            <span>点击上传</span>
          </div>
        </a-upload>
        <div class="company-profile__hint">点击上传，注意：请确认图片长200px，高100px，白底，以确保完美显示</div>
      </a-form-item>

      <a-form-item label="公司名称" required>
        <a-input v-model:value="model.name" class="company-profile__control" placeholder="请输入公司名称" />
      </a-form-item>

      <a-form-item label="开发资质">
        <a-select
          v-model:value="model.qualification"
          class="company-profile__control"
          placeholder="请选择"
          :options="qualificationOptions"
        />
      </a-form-item>

      <a-form-item label="业务领域">
        <a-checkbox-group v-model:value="model.businessAreas" :options="businessAreaOptions" />
      </a-form-item>

      <a-form-item label="企业荣誉">
        <a-input v-model:value="model.honors" class="company-profile__control" placeholder="请输入企业荣誉" />
      </a-form-item>

      <a-form-item label="公司简介">
        <a-textarea
          v-model:value="model.intro"
          class="company-profile__control"
          :rows="8"
          :maxlength="600"
          show-count
          placeholder="公司具体描述限制600字以内"
        />
      </a-form-item>

      <a-form-item label="企业网站">
        <a-input v-model:value="model.website" class="company-profile__control" />
      </a-form-item>

      <a-form-item label="企业微博">
        <a-input v-model:value="model.weibo" class="company-profile__control" />
      </a-form-item>

      <a-form-item label="微信公众号">
        <a-input v-model:value="model.wechat" class="company-profile__control" />
      </a-form-item>
    </a-form>

    <div class="company-profile__section">公司联系信息</div>

    <a-form layout="horizontal" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
      <a-form-item v-for="contact in model.contacts" :key="contact.id" :label="contact.title">
        <div class="company-profile__contact">
          <a-input v-model:value="contact.name" placeholder="联系人" />
          <a-input v-model:value="contact.phone" placeholder="联系电话" />
          <a-input v-model:value="contact.email" placeholder="联系邮箱" />
          <a-button type="text" danger @click="removeContact(contact.id)">
            <SvgIcon name="solar:trash-bin-trash-outline" />
          </a-button>
        </div>
      </a-form-item>
      <a-form-item :wrapper-col="{ offset: 4 }">
        <a-button type="dashed" @click="addContact">
          <SvgIcon name="solar:add-circle-outline" />
          添加联系信息
        </a-button>
      </a-form-item>
    </a-form>

    <div class="company-profile__footer">
      <a-button type="primary" @click="notify('保存公司资料')">保存</a-button>
      <a-button type="text" @click="notify('取消')">取消</a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { SvgIcon } from 'common'
import { companyProfile } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'

const global = useGlobalStore()

const qualificationOptions = ['房地产开发一级', '房地产开发二级', '施工总承包一级'].map((item) => ({
  label: item,
  value: item,
}))
const businessAreaOptions = [
  { label: '商业地产', value: '商业地产' },
  { label: '工业地产', value: '工业地产' },
  { label: '住宅地产', value: '住宅地产' },
  { label: '旅游地产', value: '旅游地产' },
]

const logoFiles = ref([])

const model = reactive({
  name: companyProfile.name,
  qualification: companyProfile.qualification,
  businessAreas: [...companyProfile.businessAreas],
  honors: companyProfile.honors,
  intro: companyProfile.intro,
  website: companyProfile.website,
  weibo: companyProfile.weibo,
  wechat: companyProfile.wechat,
  contacts: companyProfile.contacts.map((item) => ({ ...item })),
})

function addContact() {
  model.contacts.push({
    id: `ct-${Date.now()}`,
    title: '公司联系信息',
    name: '',
    phone: '',
    email: '',
  } as (typeof model.contacts)[number])
}

function removeContact(id: string) {
  model.contacts = model.contacts.filter((item) => item.id !== id)
}

function notify(action: string) {
  global.message.success(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('company-profile', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'

  return {
    'margin': `${token.margin}px`,
    'borderRadius': `${token.borderRadiusLG}px`,

    '.company-profile__title': {
      margin: `0 0 ${token.margin}px`,
      fontSize: `${token.fontSizeHeading4}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.company-profile__form': {
      [`${rootCls}-form-item-label`]: {
        color: token.colorTextSecondary,
      },
    },

    '.company-profile__control': {
      maxWidth: '560px',
    },

    '.company-profile__upload': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: `${token.marginXXS}px`,
      color: token.colorTextSecondary,
    },

    '.company-profile__hint': {
      marginTop: `${token.marginXS}px`,
      color: token.colorTextTertiary,
      fontSize: `${token.fontSizeSM}px`,
    },

    '.company-profile__section': {
      margin: `${token.marginLG}px 0 ${token.margin}px`,
      fontSize: `${token.fontSizeLG}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.company-profile__contact': {
      display: 'flex',
      gap: `${token.marginXS}px`,
      maxWidth: '720px',
    },

    '.company-profile__footer': {
      display: 'flex',
      gap: `${token.marginXS}px`,
      paddingTop: `${token.padding}px`,
      borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorSplit}`,
    },
  }
})
</script>
