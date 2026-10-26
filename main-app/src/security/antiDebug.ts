/**
 * 前端反调试守卫（仅生产构建安装）
 *
 * 设计目标：不在产物里留下 `debugger` / `Function` / `setTimeout` 这类可被 grep 的明文。
 * 检测手段：
 * 1. 计时探针：用 `performance.now()` 包一次 debugger，被暂停超过 120ms 判定 devtools 打开；
 * 2. 视口差值：devtools 停靠时会压缩 innerWidth/innerHeight，用它兜住「⌘F8 关闭断点」的绕过；
 * 3. 命中后锁屏，并在恢复后自动刷新。
 *
 * 注意：客户端反调试只能提高逆向成本，无法真正阻止有决心的人（独立窗口 + 关闭断点仍可绕过）。
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

const GUARD_ID = 'app-devtools-guard'
const LOCK_TEXT = '检测到开发者工具已打开，请关闭后刷新页面'

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

function lock() {
  if (document.getElementById(GUARD_ID)) return

  // 清空应用内容，避免锁屏后仍能直接读到已渲染的页面和组件状态
  const app = document.getElementById('main-app')
  if (app) app.replaceChildren()

  const overlay = document.createElement('div')
  overlay.id = GUARD_ID
  overlay.textContent = LOCK_TEXT
  overlay.setAttribute(
    'style',
    [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:#0d1117',
      'color:#e6edf3',
      'font:16px/1.8 system-ui,-apple-system,"PingFang SC",sans-serif',
      'text-align:center',
      'padding:32px',
    ].join(';'),
  )

  document.documentElement.appendChild(overlay)
  document.title = 'Access restricted'
}

export function installAntiDebug() {
  if (typeof window === 'undefined') return

  const probe = createProbe()
  const performance = scope[NAME_PERF] as Performance | undefined
  const schedule = scope[NAME_TIMER] as ((handler: () => void, timeout: number) => number) | undefined

  if (!probe || !performance || typeof schedule !== 'function') return

  const now = (performance as unknown as Record<string, () => number>)[NAME_NOW].bind(performance)

  let locked = false
  let cleanTicks = 0

  const devtoolsDocked = () =>
    window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 260

  const tick = () => {
    const startedAt = now()
    probe()
    const pausedFor = now() - startedAt

    const paused = pausedFor > 120
    const docked = devtoolsDocked()

    if (paused || docked) {
      locked = true
      cleanTicks = 0
      lock()
      // 锁屏期间保持检测：overlay 被删掉会被补回来
      schedule(tick, 800 + Math.random() * 800)
      return
    }

    if (locked) {
      cleanTicks += 1
      if (cleanTicks >= 2) {
        window.location.reload()
        return
      }
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
