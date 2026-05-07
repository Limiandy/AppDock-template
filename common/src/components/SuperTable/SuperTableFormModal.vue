<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :confirm-loading="submitting"
    :ok-text="okText"
    :footer="isDetail ? null : undefined"
    width="720px"
    destroy-on-close
    v-bind="mergedModalProps"
    @update:open="emit('update:open', $event)"
    @ok="onOk"
  >
    <a-form ref="formRef" :model="formModel" layout="vertical" v-bind="mergedFormProps">
      <a-row :gutter="[24, 8]">
        <a-col v-for="field in visibleFields" :key="field.field" :xs="24" :md="getFieldSpan(field)">
          <a-form-item
            :name="field.field"
            :label="field.label"
            :rules="isDetail ? undefined : field.rules"
            v-bind="field.formItemProps"
          >
            <slot
              v-if="field.component === 'slot'"
              :name="field.slot || `form-${field.field}`"
              :field="field"
              :model="formModel"
              :mode="mode"
              :readonly="isFieldReadonly(field)"
              :record="record"
            />
            <a-select
              v-else-if="field.component === 'select'"
              v-model:value="formModel[field.field]"
              allow-clear
              :disabled="isFieldReadonly(field)"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            >
              <a-select-option
                v-for="option in field.options || []"
                :key="String(option.value)"
                :value="option.value"
                :disabled="option.disabled"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
            <a-date-picker
              v-else-if="field.component === 'datePicker'"
              v-model:value="formModel[field.field]"
              class="super-table-form-modal__control"
              :disabled="isFieldReadonly(field)"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
            <a-input-number
              v-else-if="field.component === 'inputNumber'"
              v-model:value="formModel[field.field]"
              class="super-table-form-modal__control"
              :disabled="isFieldReadonly(field)"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
            <a-switch
              v-else-if="field.component === 'switch'"
              v-model:checked="formModel[field.field]"
              :disabled="isFieldReadonly(field)"
              v-bind="field.props"
            />
            <a-textarea
              v-else-if="field.component === 'textarea'"
              v-model:value="formModel[field.field]"
              :disabled="isFieldReadonly(field)"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
            <a-input
              v-else
              v-model:value="formModel[field.field]"
              allow-clear
              :disabled="isFieldReadonly(field)"
              :placeholder="getPlaceholder(field)"
              v-bind="field.props"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import type {
  SuperTableFormActionConfig,
  SuperTableFormConfig,
  SuperTableFormField,
  SuperTableFormMode,
  SuperTableRecord,
} from './types'

const props = defineProps<{
  open: boolean
  mode: SuperTableFormMode
  record?: SuperTableRecord
  config: SuperTableFormConfig
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [values: SuperTableRecord]
}>()

const formRef = ref<FormInstance>()
const formModel = reactive<SuperTableRecord>({})

const isDetail = computed(() => props.mode === 'detail')

const actionConfig = computed<SuperTableFormActionConfig | undefined>(() => {
  const config = props.config[props.mode]
  return config === false ? undefined : config
})

const visibleFields = computed(() =>
  props.config.fields.filter((field) => {
    if (typeof field.hidden === 'function') return !field.hidden(props.mode, props.record)
    return !field.hidden
  }),
)

const mergedModalProps = computed(() => ({
  ...props.config.modalProps,
  ...actionConfig.value?.modalProps,
}))

const mergedFormProps = computed(() => props.config.formProps ?? {})

const modalTitle = computed(() => {
  const configuredTitle = actionConfig.value?.title
  if (typeof configuredTitle === 'function') return configuredTitle(props.record)
  if (configuredTitle) return configuredTitle
  if (props.mode === 'create') return '新建'
  if (props.mode === 'edit') return '编辑'
  return '详情'
})

const okText = computed(() => actionConfig.value?.submitText ?? (props.mode === 'create' ? '新建' : '保存'))

watch(
  () => [props.open, props.mode, props.record] as const,
  ([open]) => {
    if (!open) return
    resetFormModel()
  },
  { immediate: true },
)

function resetFormModel() {
  Object.keys(formModel).forEach((key) => {
    delete formModel[key]
  })

  const values = getInitialValues()
  props.config.fields.forEach((field) => {
    const sourceValue = values[field.field]
    formModel[field.field] = field.transformIn?.(sourceValue, props.record, props.mode) ?? sourceValue
  })

  formRef.value?.clearValidate()
}

function getInitialValues() {
  if (props.mode === 'create') {
    const initialValues = actionConfig.value?.initialValues
    return typeof initialValues === 'function' ? initialValues(props.record) : (initialValues ?? {})
  }

  return {
    ...(props.record ?? {}),
    ...(typeof actionConfig.value?.initialValues === 'function'
      ? actionConfig.value.initialValues(props.record)
      : (actionConfig.value?.initialValues ?? {})),
  }
}

function getFieldSpan(field: SuperTableFormField) {
  return field.span ?? 12
}

function getPlaceholder(field: SuperTableFormField) {
  return field.placeholder ?? `请输入${field.label || ''}`
}

function isFieldReadonly(field: SuperTableFormField) {
  if (isDetail.value) return true
  if (typeof field.readonly === 'function') return field.readonly(props.mode, props.record)
  return Boolean(field.readonly)
}

function getSubmitValues() {
  return visibleFields.value.reduce<SuperTableRecord>((values, field) => {
    const value = formModel[field.field]
    values[field.field] = field.transformOut?.(value, formModel, props.mode) ?? value
    return values
  }, {})
}

async function onOk() {
  await formRef.value?.validate()
  emit('submit', getSubmitValues())
}
</script>

<style lang="less" scoped>
.super-table-form-modal__control {
  width: 100%;
}
</style>
