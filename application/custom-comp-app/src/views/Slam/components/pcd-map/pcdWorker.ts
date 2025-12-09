// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function run(data: any, stream) {
  const { fileUrl, chunkSize = 50000 } = data
  const response = await fetch(fileUrl)
  const text = await response.text()

  const lines = text.split(/\r?\n/)
  const dataStart = lines.findIndex((l) => !l.startsWith('#') && /^\d/.test(l))
  const pointLines = lines.slice(dataStart)

  const totalPoints = pointLines.length
  let positions = new Float32Array(Math.min(chunkSize, totalPoints) * 3)
  let colors = new Float32Array(Math.min(chunkSize, totalPoints) * 3)
  let count = 0

  // 预估 zMin zMax
  let zMin = Infinity,
    zMax = -Infinity
  for (const line of pointLines) {
    const z = parseFloat(line.trim().split(/\s+/)[2])
    if (z < zMin) zMin = z
    if (z > zMax) zMax = z
  }

  for (let i = 0; i < totalPoints; i++) {
    const parts = pointLines[i].trim().split(/\s+/).map(Number)
    const x = parts[0],
      y = parts[1],
      z = parts[2]

    const t = (z - zMin) / (zMax - zMin)
    const hue = 240 * (1 - t)
    const color = hslToRgb(hue / 360, 0.6, 0.4)

    const idx = count * 3
    positions[idx] = x
    positions[idx + 1] = y
    positions[idx + 2] = z

    colors[idx] = color[0]
    colors[idx + 1] = color[1]
    colors[idx + 2] = color[2]

    count++

    if (count === chunkSize || i === totalPoints - 1) {
      // 流式返回 chunk
      stream({
        positions: positions.buffer,
        colors: colors.buffer,
        count,
        totalPoints,
      })

      // 为下一轮 chunk 重置数组
      const remaining = totalPoints - i - 1
      const newSize = Math.min(chunkSize, remaining)
      positions = new Float32Array(newSize * 3)
      colors = new Float32Array(newSize * 3)
      count = 0
    }
  }

  // 最终返回统计信息
  return { totalPoints }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r, g, b]
}
