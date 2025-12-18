import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import { type CSSObject, theme } from 'ant-design-vue'
import type { AliasToken } from 'ant-design-vue/es/theme/interface'
import { serializeStyle } from './serializeStyle'
import { hashString } from './utils.ts'
import { updateStyle, removeStyle } from './updateStyle'

const { useToken } = theme

export default function useStyle(
  className: string,
  styleFn: (token: AliasToken) => CSSObject,
): [className: string, scopeClass: string] {
  const { token } = useToken()

  const styleObj = computed(() => styleFn(token.value))

  const scopeClass = `css-${hashString(`css-scoped-identifier_${className}`)}`

  const styleIdRef = shallowRef<string | null>(null)

  watch(
    styleObj,
    (style) => {
      const selector = `:where(.${scopeClass}).${className}`
      const css = serializeStyle(selector, style)

      // tokenKey 作为版本, 它的改变说明是主题的改变，不是 cssObject 内容的改变
      const styleId = hashString(className + (token.value as any)._tokenKey)

      if (styleIdRef.value && styleIdRef.value !== styleId) {
        removeStyle(styleIdRef.value)
      }
      updateStyle(styleId, css)
      styleIdRef.value = styleId
    },
    { deep: true, immediate: true, flush: 'post' },
  )

  onScopeDispose(() => {
    styleIdRef.value && removeStyle(styleIdRef.value)
  })
  return [className, scopeClass] as const
}
