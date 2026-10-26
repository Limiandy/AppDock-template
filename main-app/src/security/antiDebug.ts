/**
 * 前端反调试守卫（仅生产构建安装）
 *
 * 设计目标：不在产物里留下 `debugger` / `Function` / `setTimeout` 这类可被 grep 的明文，
 * 用「运行时解码 + 计时检测」判断 devtools 是否打开，命中后持续打断调试。
 *
 * 注意：客户端反调试只能提高逆向成本，无法真正阻止有决心的人。
 */
const KEY = 0x5a

const decode = (codes: number[]) => codes.map((code) => String.fromCharCode(code ^ KEY)).join('')

// 逐个解码，避免对象字面量里留下明文 key
const NAME_DEBUGGER = decode([62, 63, 56, 47, 61, 61, 63, 40])
const NAME_FN = decode([28, 47, 52, 57, 46, 51, 53, 52])
const NAME_TIMER = decode([41, 63, 46, 14, 51, 55, 63, 53, 47, 46])
const NAME_PERF = decode([42, 63, 40, 60, 53, 40, 55, 59, 52, 57, 63])
const NAME_NOW = decode([52, 53, 45])

const scope = globalThis as unknown as Record<string, any>

function createProbe() {
  const constructor = scope[NAME_FN] as FunctionConstructor | undefined
  if (typeof constructor !== 'function') return null

  try {
    return new constructor(NAME_DEBUGGER) as () => void
  } catch {
    // CSP 禁用 eval 时放弃安装，不影响应用本身
    return null
  }
}

export function installAntiDebug() {
  if (typeof window === 'undefined') return

  const probe = createProbe()
  const performance = scope[NAME_PERF] as Performance | undefined
  const schedule = scope[NAME_TIMER] as ((handler: () => void, timeout: number) => number) | undefined

  if (!probe || !performance || typeof schedule !== 'function') return

  const now = (performance as unknown as Record<string, () => number>)[NAME_NOW].bind(performance)

  const trap = () => {
    const beat = () => {
      probe()
      schedule(beat, 300 + Math.random() * 500)
    }

    beat()
  }

  const tick = () => {
    const startedAt = now()
    probe()
    const pausedFor = now() - startedAt

    // devtools 打开时 debugger 会真正暂停，恢复后耗时会明显变大
    if (pausedFor > 120) {
      trap()
      return
    }

    schedule(tick, 1200 + Math.random() * 2600)
  }

  // 多处触发：定时 + 切回标签页/窗口聚焦，删掉单点不会失效
  schedule(tick, 600 + Math.random() * 1200)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tick()
  })
  window.addEventListener('focus', tick)
}
