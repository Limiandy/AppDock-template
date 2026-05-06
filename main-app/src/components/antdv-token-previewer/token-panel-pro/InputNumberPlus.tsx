import { InputNumber, Slider } from 'ant-design-vue'
import type { PropType } from 'vue'
import { defineComponent, toRefs } from 'vue'

export type InputNumberPlusProps = {
  value?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
}

const InputNumberPlus = defineComponent({
  name: 'InputNumberPlus',
  props: {
    value: { type: Number },
    onChange: { type: Function as PropType<(value: number | null) => void> },
    min: { type: Number },
    max: { type: Number },
  },
  setup(props) {
    const { value, min, max } = toRefs(props)
    const handleChange = (nextValue: unknown) => {
      props.onChange?.(typeof nextValue === 'number' ? nextValue : null)
    }

    return () => {
      return (
        <div style={{ display: 'flex', width: '200px' }}>
          <Slider
            style={{ flex: '0 0 120px', marginRight: '12px' }}
            value={value.value}
            min={min.value}
            max={max.value}
            onChange={handleChange}
          />
          <InputNumber
            value={value.value}
            min={min.value}
            max={max.value}
            onChange={handleChange}
            style={{ flex: 1 }}
          />
        </div>
      )
    }
  },
})

export default InputNumberPlus
