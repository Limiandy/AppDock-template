function kebabCase(str: string) {
  return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

/**
 * 祖先嵌套、&、伪类、数组值都支持
 * @param selector 当前选择器
 * @param style 样式对象
 * @param parentSelector 外层作用域，顶层 scopeClass
 */
export function serializeStyle(selector: string, style: Record<string, any>, parentSelector?: string): string {
  let css = ''
  const decls: string[] = []

  // 当前选择器加上父作用域
  const fullSelector = parentSelector ? `${parentSelector} ${selector}` : selector

  for (const key in style) {
    const value = style[key]
    if (value == null) continue

    if (typeof value === 'object') {
      let nextSelector: string
      if (key.startsWith('&')) {
        // & 替换成 fullSelector
        nextSelector = key.replace(/&/g, fullSelector)
        css += serializeStyle(nextSelector, value, undefined)
      } else {
        // 普通嵌套选择器，累加 fullSelector
        nextSelector = key
        css += serializeStyle(nextSelector, value, fullSelector)
      }
    } else if (Array.isArray(value)) {
      value.forEach((v) => decls.push(`${kebabCase(key)}: ${v};`))
    } else {
      decls.push(`${kebabCase(key)}: ${value};`)
    }
  }

  if (decls.length) {
    css = `${fullSelector} { ${decls.join(' ')} }\n` + css
  }

  return css
}
