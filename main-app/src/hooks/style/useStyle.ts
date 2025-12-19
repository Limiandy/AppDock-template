import { computed, onScopeDispose, shallowRef, watch } from 'vue'
import { type CSSObject, theme } from 'ant-design-vue'
import type { AliasToken } from 'ant-design-vue/es/theme/interface'
import { serializeStyle } from './serializeStyle'
import { hashString } from './utils.ts'
import { updateStyle, removeStyle } from './updateStyle'

const { useToken } = theme

export default function useStyle(
  arg1: string | ((token: AliasToken) => CSSObject),
  arg2?: (token: AliasToken) => CSSObject,
): [className: string, scopeClass: string] {
  let className: string
  let styleFn: (token: AliasToken) => CSSObject

  if (typeof arg1 === 'function') {
    className = ''
    styleFn = arg1
  } else {
    className = arg1
    styleFn = arg2!
  }

  const { token } = useToken()

  const styleObj = computed(() => styleFn(token.value))

  const baseClass = className || ''
  const scopeClass = `css-${hashString(`css-scoped-identifier_${baseClass || 'root'}`)}`

  const styleIdRef = shallowRef<string | null>(null)

  watch(
    styleObj,
    (style) => {
      const selector = baseClass ? `:where(.${scopeClass}).${baseClass}` : `:where(.${scopeClass})`

      const css = serializeStyle(selector, style)

      const tokenKey = (token.value as any)._tokenKey ?? 'default'
      const styleId = hashString(`${baseClass || 'root'}_${tokenKey}`)

      if (styleIdRef.value && styleIdRef.value !== styleId) {
        removeStyle(styleIdRef.value)
      }

      updateStyle(styleId, css)
      styleIdRef.value = styleId
    },
    { deep: true, immediate: true, flush: 'post' },
  )

  onScopeDispose(() => {
    if (styleIdRef.value) removeStyle(styleIdRef.value)
  })

  return [scopeClass, baseClass] as const
}
