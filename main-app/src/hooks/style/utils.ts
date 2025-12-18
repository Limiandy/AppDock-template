const runtimeSalt = Math.random().toString(36).slice(2)

export function hashString(input: string) {
  let h1 = 0x811c9dc5
  let h2 = 0x811c9dc5

  const str = input + runtimeSalt

  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)

    h1 ^= c
    h1 = Math.imul(h1, 16777619)

    h2 ^= c
    h2 = Math.imul(h2, 2166136261)
  }

  // 转成无符号
  const s1 = (h1 >>> 0).toString(36)
  const s2 = (h2 >>> 0).toString(36)

  // 拼接并裁剪到 10 位
  return (s1 + s2).slice(0, 10)
}
