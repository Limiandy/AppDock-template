<template>
  <a-popover v-model:open="open" trigger="click" placement="bottomRight">
    <template #content>
      <div class="color-panel" style="border: none">
        <hex-color-picker :color="innerValue" style="width: 100%; height: 160px" @color-changed="handleColorChange" />

        <div style="margin-top: 12px">
          <div class="color-panel-mode">
            <div class="color-panel-preview">
              <div :style="panelPreviewStyle" />
            </div>
            <a-select ref="select" v-model:value="colorModel" size="small" :bordered="false" style="width: 70px">
              <a-select-option value="HEX">HEX</a-select-option>
              <a-select-option value="HEX8">HEX8</a-select-option>
              <a-select-option value="RGB">RGB</a-select-option>
              <a-select-option value="RGBA">RGBA</a-select-option>
            </a-select>
          </div>
          <div v-if="colorModel === 'HEX'">
            <a-input v-model:value="hexInputValue" size="small">
              <template #prefix>#</template>
            </a-input>
            <div class="color-panel-mode-title">{{ colorModel }}</div>
          </div>

          <div v-if="colorModel === 'RGB' || colorModel === 'RGBA'" class="color-panel-rgba-input">
            <div class="color-panel-rgba-input-part">
              <a-input-number v-model:value="rbgInputValue.r" :min="0" :max="255" size="small" />
              <div class="color-panel-mode-title">R</div>
            </div>
            <div class="color-panel-rgba-input-part">
              <a-input-number v-model:value="rbgInputValue.g" :min="0" :max="255" size="small" />
              <div class="color-panel-mode-title">G</div>
            </div>
            <div class="color-panel-rgba-input-part">
              <a-input-number v-model:value="rbgInputValue.b" :min="0" :max="255" size="small" />
              <div class="color-panel-mode-title">B</div>
            </div>
            <div v-if="colorModel === 'RGBA'" class="color-panel-rgba-input-part">
              <a-input-number v-model:value="rbgInputValue.a" :min="0" :max="1" :step="0.1" size="small" />
              <div class="color-panel-mode-title">A</div>
            </div>
          </div>
        </div>
        <div class="color-panel-preset-colors">
          <button
            v-for="(color, index) in resetColorList"
            :key="index"
            :style="{ backgroundColor: color }"
            class="color-panel-preset-color-btn"
            @click="handelResetColor(color)"
          />
        </div>
      </div>
    </template>
    <slot :value="innerValue" :toggle="togglePicker">
      <div
        class="previewer-color-preview"
        :style="`
          --antd-token-previewer-color-preview: ${value};
          cursor: pointer;
          margin-inline-end: 8px;
          vertical-align: top;`"
      >
        <div
          style="
            content: '';
            width: 18px;
            height: 18px;
            border-radius: 50%;
            position: absolute;
            z-index: 1;
            background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAFpJREFUWAntljEKADAIA23p6v//qQ+wfUEcCu1yriEgp0FHRJSJcnehmmWm1Dv/lO4HIg1AAAKjTqm03ea88zMCCEDgO4HV5bS757f+7wRoAAIQ4B9gByAAgQ3pfiDmXmAeEwAAAABJRU5ErkJggg==')
              0% 0% / 20px;
            top: 1px;
            inset-inline-start: 1px;
          "
        ></div>
      </div>
    </slot>
  </a-popover>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, ref, watch } from 'vue'
import tinycolor from 'tinycolor2'
import { useTheme } from '@/hooks/theme/useTheme.ts'

const { isSameColor } = useTheme()

const emits = defineEmits(['update:value'])

const props = withDefaults(defineProps<{ value?: string }>(), { value: '#000000' })

const open = ref(false)
const innerValue = ref(props.value)

watch(
  () => props.value,
  (v) => {
    if (!isSameColor(v, innerValue.value)) {
      innerValue.value = v
    }
  },
)

const panelPreviewStyle = computed(() => {
  const tc = tinycolor(innerValue.value)

  return {
    backgroundColor: tc.toRgbString(),
    width: '100%',
    height: '100%',
  } as CSSProperties
})

const togglePicker = () => {
  open.value = !open.value
}

const colorModel = ref<'HEX' | 'RGB' | 'HEX8' | 'RGBA'>('HEX')

const hexInputValue = computed({
  get() {
    const tc = tinycolor(innerValue.value)
    return tc.toHexString().replace('#', '')
  },
  set(v) {
    const val = `#${v}`
    const tc = tinycolor(val)
    if (!tc.isValid()) return
    updateColor(tc.toHexString())
  },
})

const rbgInputValue = ref({ r: 0, g: 0, b: 0, a: 1 })

watch(
  () => innerValue.value,
  (v) => {
    const tc = tinycolor(v)

    rbgInputValue.value = {
      r: tc.toRgb().r,
      g: tc.toRgb().g,
      b: tc.toRgb().b,
      a: tc.toRgb().a,
    }
  },
  {
    immediate: true,
    deep: true,
  },
)

watch(
  rbgInputValue,
  (v) => {
    const tc = tinycolor(v)
    if (!tc.isValid()) return
    if (colorModel.value === 'RGB' || colorModel.value === 'RGBA') {
      updateColor(tc.toRgbString())
    }
  },
  { deep: true },
)

watch(
  colorModel,
  (v) => {
    if (v === 'HEX') {
      updateColor(tinycolor(innerValue.value).toHexString())
    }
    if (v === 'HEX8') {
      updateColor(tinycolor(innerValue.value).toHex8String())
    }
    if (v === 'RGB') {
      const tmp = tinycolor(innerValue.value)
      tmp.setAlpha(1)
      updateColor(tmp.toRgbString())
    }
    if (v === 'RGBA') {
      updateColor(tinycolor(innerValue.value).toRgbString())
    }
  },
  { deep: true, immediate: false },
)

const resetColorList = [
  'rgb(22, 119, 255)',
  'rgb(114, 46, 209)',
  'rgb(19, 194, 194)',
  'rgb(82, 196, 26)',
  'rgb(235, 47, 150)',
  'rgb(235, 47, 150)',
  'rgb(245, 34, 45)',
  'rgb(250, 140, 22)',
  'rgb(250, 219, 20)',
  'rgb(250, 84, 28)',
  'rgb(47, 84, 235)',
  'rgb(250, 173, 20)',
  'rgb(160, 217, 17)',
  'rgb(0, 0, 0)',
]

function updateColor(color: string) {
  if (isSameColor(color, innerValue.value)) return
  innerValue.value = color // 内部更新
  emits('update:value', color) // 通知外部（如果没人监听，也没关系）
}

function handleColorChange(event: CustomEvent) {
  const { value } = event.detail
  updateColor(value)
}

function handelResetColor(rgb: string) {
  updateColor(rgb)
}
</script>

<style lang="less" scoped>
.color-panel {
  margin: -12px;
  padding: 12px;
  background-color: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 1px 2px 0 rgba(0, 0, 0, 0.03),
    0 1px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px 0 rgba(0, 0, 0, 0.02);
  width: 224px;
  box-sizing: border-box;

  .color-panel-mode {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  .color-panel-preview {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    box-shadow:
      0 2px 3px -1px rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(0, 0, 0, 0.09);
    flex: none;
    overflow: hidden;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAAFpJREFUWAntljEKADAIA23p6v//qQ+wfUEcCu1yriEgp0FHRJSJcnehmmWm1Dv/lO4HIg1AAAKjTqm03ea88zMCCEDgO4HV5bS757f+7wRoAAIQ4B9gByAAgQ3pfiDmXmAeEwAAAABJRU5ErkJggg==)
      0% 0% / 32px;
  }

  .color-panel-mode-title {
    color: rgba(0, 0, 0, 0.25);
    margin-top: 2px;
    font-size: 12px;
    text-align: center;
  }

  .color-panel-preset-colors {
    padding-top: 12px;
    display: flex;
    flex-wrap: wrap;
    width: 200px;
  }

  .color-panel-preset-color-btn {
    border-radius: 4px;
    width: 20px;
    height: 20px;
    border: none;
    outline: none;
    margin: 4px;
    cursor: pointer;
    box-shadow:
      0 2px 3px -1px rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(0, 0, 0, 0.09);
  }

  .color-panel-rgba-input {
    display: flex;
    align-items: center;
  }

  .color-panel-rgba-input-part {
    flex: 1;
    width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;

    :deep(.ant-input-number) {
      width: auto;
    }

    &:not(:last-child) {
      margin-right: 4px;
    }
  }
}

.previewer-color-preview {
  --antd-token-previewer-color-preview: none;

  width: 20px;
  height: 20px;
  position: relative;
  border-radius: 50%;
  padding: 0;
  display: inline-block;

  &::before {
    content: '';
    width: 100%;
    height: 100%;
    border-radius: 50%;
    top: 0;
    inset-inline-start: 0;
    position: absolute;
    z-index: 2;
    background-color: var(--antd-token-previewer-color-preview);
    box-shadow:
      0 2px 3px -1px rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(0, 0, 0, 0.09);
  }
}
</style>
