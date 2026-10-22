<template>
  <a-card :bordered="false" :class="[scopeClass, className]">
    <h2 class="profile-settings__title">个人设置</h2>

    <a-form
      ref="formRef"
      :model="model"
      :rules="rules"
      layout="horizontal"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
    >
      <a-form-item label="头像">
        <a-avatar :size="64" :style="{ backgroundColor: '#546FFD' }">{{ model.name.slice(0, 1) }}</a-avatar>
        <a-button type="link" @click="notify('更换头像')">更换头像</a-button>
      </a-form-item>
      <a-form-item label="姓名" name="name" required>
        <a-input v-model:value="model.name" class="profile-settings__control" />
      </a-form-item>
      <a-form-item label="手机号" name="phone" required>
        <a-input v-model:value="model.phone" class="profile-settings__control" />
      </a-form-item>
      <a-form-item label="邮箱">
        <a-input v-model:value="model.email" class="profile-settings__control" />
      </a-form-item>
      <a-form-item label="所属公司">
        <a-input v-model:value="model.company" class="profile-settings__control" disabled />
      </a-form-item>
      <a-form-item label="部门">
        <a-input v-model:value="model.department" class="profile-settings__control" />
      </a-form-item>
      <a-form-item label="职务">
        <a-input v-model:value="model.role" class="profile-settings__control" />
      </a-form-item>
      <a-form-item :wrapper-col="{ offset: 4 }">
        <a-space>
          <a-button type="primary" @click="onSave">保存</a-button>
          <a-button @click="notify('修改密码')">修改密码</a-button>
          <a-button type="text" danger @click="notify('退出登录')">退出登录</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </a-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import { profileRecord } from '@/data/prototype'
import { useGlobalStore } from '@/store/modules/global.ts'
import useStyle from '@/hooks/style/useStyle.ts'
import { pageInsetStyles } from '@/hooks/style/pageStyles'

const global = useGlobalStore()
const model = reactive({ ...profileRecord })
const formRef = ref<FormInstance>()
const rules = {
  name: [{ required: true, message: '请输入姓名' }],
  phone: [{ required: true, message: '请输入手机号' }],
}

async function onSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  global.message.success('原型演示：个人信息已保存')
}

function notify(action: string) {
  global.message.success(`原型演示：${action}`)
}

const [className, scopeClass] = useStyle('profile-settings', (token) => {
  const rootCls = (token as any).rootCls ?? '.ant'

  return {
    ...pageInsetStyles(token),

    '.profile-settings__title': {
      margin: `0 0 ${token.margin}px`,
      fontSize: `${token.fontSizeHeading4}px`,
      fontWeight: token.fontWeightStrong,
      color: token.colorText,
    },

    '.profile-settings__control': {
      maxWidth: '420px',
    },

    [`${rootCls}-form-item-label`]: {
      color: token.colorTextSecondary,
    },
  }
})
</script>
