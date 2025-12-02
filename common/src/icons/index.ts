interface IconItem {
  name: string // 文件名
  dir: string // 所属目录
  fullName: string // dir:name  => svg-icon 直接用
  path: string // 原始路径（可选）
}

const modules = import.meta.glob('./**/*.svg', { eager: true })

const icons: IconItem[] = []

for (const path in modules) {
  // path 示例: ./xx/close.svg

  const parts = path.split('/')
  const file = parts.pop()!
  const dir = parts.pop()! // 上级目录名
  const name = file.replace('.svg', '')

  icons.push({
    name,
    dir,
    fullName: dir === '.' ? `${name}` : `${dir}:${name}`,
    path,
  })
}

export function getAllIcons() {
  return icons
}

export function getIconsGrouped() {
  const map: Record<string, IconItem[]> = {}
  for (const item of icons) {
    if (!map[item.dir]) map[item.dir] = []
    map[item.dir].push(item)
  }
  return map
}

export type { IconItem }
