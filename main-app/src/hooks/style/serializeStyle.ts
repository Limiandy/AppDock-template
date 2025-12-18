function kebabCase(str: string) {
  return str.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

export function serializeStyle(selector: string, style: Record<string, any>): string {
  let css = ''
  const decls: string[] = []

  for (const key in style) {
    const value = style[key]

    if (value == null) continue

    if (typeof value === 'object') {
      // 嵌套选择器 / 伪类
      const nextSelector = key.startsWith('&') ? key.replace('&', selector) : `${selector} ${key}`

      css += serializeStyle(nextSelector, value)
    } else {
      decls.push(`${kebabCase(key)}: ${value};`)
    }
  }

  if (decls.length) {
    css = `${selector} { ${decls.join(' ')} }\n` + css
  }

  return css
}
