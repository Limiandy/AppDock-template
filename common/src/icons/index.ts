import iconMap from './icons.json'

const map = iconMap as Record<string, string[]>

interface IconItem {
  name: string // 文件名
  dir: string // 所属目录
  fullName: string // dir:name
  path: string // 原始路径
}

const icons: IconItem[] = []

// 遍历 JSON 生成和 glob 同样的结构
for (const dir in iconMap) {
  const names = map[dir]

  for (const name of names) {
    const file = `${name}.svg`
    const relPath = `./${dir}/${file}`

    icons.push({
      name,
      dir,
      fullName: dir === 'root' ? `${name}` : `${dir}:${name}`,
      path: relPath,
    })
  }
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
