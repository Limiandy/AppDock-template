// 简易 YAML 解析（仅提取我们需要的字段）
export function parseYamlMinimal(yamlText) {
  const out = {}
  const lines = yamlText.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^([a-zA-Z_]+):\s*(.+)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim()
      // 尝试解析数字或数组
      if (/^\[.*]$/.test(val)) {
        try {
          out[key] = JSON.parse(val.replace(/'/g, '"'))
        } catch (err) {
          console.log('Parse YAML ERROR: ========', err)
          // fallback: split
          out[key] = val
            .replace(/^\[|]$/g, '')
            .split(',')
            .map((s) => parseFloat(s))
        }
      } else if (/^[0-9.+-eE]+$/.test(val)) {
        out[key] = parseFloat(val)
      } else if (/^(true|false)$/.test(val.toLowerCase())) {
        out[key] = val.toLowerCase() === 'true'
      } else {
        out[key] = val.replace(/^"|"$/g, '')
      }
    }
  }
  return out
}

// PGM (P5) 二进制解析
export function parsePGM(buffer) {
  const bytes = new Uint8Array(buffer)
  // 解析 header token（跳过注释）
  let i = 0

  function nextToken() {
    // skip whitespace
    while (
      i < bytes.length &&
      (bytes[i] === 0x20 ||
        bytes[i] === 0x0a ||
        bytes[i] === 0x0d ||
        bytes[i] === 0x09)
      ) { i++ }
    if (i >= bytes.length) return null
    // 注释行
    if (bytes[i] === 0x23) {
      // '#'
      while (i < bytes.length && bytes[i] !== 0x0a) i++
      return nextToken()
    }
    // read token until whitespace
    const start = i
    while (
      i < bytes.length &&
      bytes[i] !== 0x20 &&
      bytes[i] !== 0x0a &&
      bytes[i] !== 0x0d &&
      bytes[i] !== 0x09
      ) { i++ }
    return new TextDecoder('ascii').decode(bytes.slice(start, i))
  }

  const magic = nextToken()
  if (!magic || !magic.startsWith('P')) { throw new Error('Unsupported PGM format or corrupted') }
  const width = parseInt(nextToken(), 10)
  const height = parseInt(nextToken(), 10)
  const maxval = parseInt(nextToken(), 10)

  // now i points to the byte just after the maxval token; skip single whitespace if present
  if (bytes[i] === 0x0a) i++

  const pixelCount = width * height
  let pixels
  if (maxval < 256) {
    pixels = bytes.slice(i, i + pixelCount)
  } else {
    // 2 bytes per sample (big endian)
    pixels = new Uint8Array(pixelCount)
    for (let p = 0; p < pixelCount; p++) {
      const hi = bytes[i + p * 2]
      const lo = bytes[i + p * 2 + 1]
      const val = (hi << 8) | lo
      pixels[p] = Math.round((val / maxval) * 255)
    }
  }

  return { width, height, maxval, pixels }
}

// 工具：世界坐标 <-> 像素坐标（基于 yaml: resolution, origin）
export function worldToPixel(x, y, yamlData, mapWidth, mapHeight) {
  const { resolution, origin } = yamlData
  const [x0, y0, yaw] = origin // yaw 为地图绕 z 轴旋转角（弧度）
  const W = mapWidth
  const H = mapHeight

  // dx, dy: 从 image 左下角像素中心到目标点的向量（在世界坐标）
  const dx = x - x0
  const dy = y - y0

  // 旋转
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)

  // 旋转到“图像坐标系（左下原点，u向右，v向上）”并除以 resolution 得到像素单位
  const u_real = (dx * cosYaw + dy * sinYaw) / resolution
  const v_real = (-dx * sinYaw + dy * cosYaw) / resolution

  // 将 v 翻转为左上原点（canvas / image 元素常用）：
  const ui = Math.round(u_real)
  const vi = H - 1 - Math.round(v_real)

  return { u: ui, v: vi }
}

// 工具：像素坐标 -> 世界坐标（基于 yaml: resolution, origin）
export function pixelToWorld(u, v, yamlData, mapWidth, mapHeight) {
  const { resolution, origin } = yamlData
  const [x0, y0, yaw] = origin
  const W = mapWidth
  const H = mapHeight

  // 将图像坐标（左上原点）转换为左下原点坐标系
  const v_real = H - 1 - v

  // 旋转矩阵的逆（即旋转角度 -yaw）
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)

  // 从像素单位恢复到米（世界坐标下的偏移）
  const dx = (u * cosYaw - v_real * sinYaw) * resolution
  const dy = (u * sinYaw + v_real * cosYaw) * resolution

  // 加回左下角世界坐标原点
  const x = x0 + dx
  const y = y0 + dy

  return { x, y }
}

/**
 * u,v 是图像像素坐标（左上原点），mapImg 是 Fabric.Image（origin=center）
 * 返回 Fabric canvas 坐标 { x, y }
 */
export function pixelToCanvas(u, v, mapImg) {
  if (!mapImg) return { x: u, y: v }

  // mapImg.getScaledWidth()/getScaledHeight() 已包含 scaleX/scaleY
  const scaledW = mapImg.getScaledWidth()
  const scaledH = mapImg.getScaledHeight()

  // 计算 image 左上角在 canvas 的坐标（因 origin=center）
  const leftTopX = mapImg.left - scaledW / 2
  const leftTopY = mapImg.top - scaledH / 2

  // 计算 x,y（注意：u,v 的原点是图像左上角，v 向下）
  // mapImg.width / mapImg.height 是原始像素尺寸
  const sx = scaledW / mapImg.width
  const sy = scaledH / mapImg.height

  const cx = leftTopX + u * sx
  const cy = leftTopY + v * sy

  return { x: cx, y: cy }
}

export function removeHost(url) {
  return url.replace(/^(https?:\/\/)?\d{1,3}(?:\.\d{1,3}){3}:\d+\//, '')
}

export function randomUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
