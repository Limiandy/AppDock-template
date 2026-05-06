// WorkerPool.ts
type Task = {
  workerName: string
  payload: any
  resolve: (v: any) => void
  reject: (e: any) => void
  onMessage?: (v: any) => void // 新增流式消息回调
}

function unwrapProxy(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(unwrapProxy)
  const result: any = {}
  for (const key in obj) {
    result[key] = obj[key] // 这里不会丢掉方法
  }
  return result
}

export class WorkerPool {
  private readonly size: number
  private readonly workers: Worker[]
  private readonly workerBusy: boolean[]
  private readonly workerCodeMap: Map<string, string>
  private readonly queue: Task[]

  constructor(size = navigator.hardwareConcurrency || 4) {
    this.size = size
    this.workerCodeMap = new Map()
    this.queue = []
    this.workerBusy = Array(size).fill(false)
    this.workers = Array.from({ length: size }, () => this.createWorker())
  }

  /** bootstrap worker，只包 init/run */
  private createWorker() {
    const bootstrap = `
      let userRun = null;
      self.onmessage = async function(e) {
        const msg = e.data;
        if (msg.type === 'init') {
          // 注入用户代码
          const code = msg.code;
          const blob = new Blob([code], { type: 'application/javascript' })
          const url = URL.createObjectURL(blob)
          importScripts(url)
          if (typeof run === 'function') userRun = run;
        } else if (msg.type === 'run') {
          if (!userRun) return self.postMessage({ ok: false, error: 'worker not initialized' });
          try {
            const stream = (chunk) => self.postMessage({ type: 'stream', chunk })
            const result = await userRun(msg.payload, stream);
            self.postMessage({ ok: true, result });
          } catch (err) {
            self.postMessage({ ok: false, error: err?.toString() });
          }
        }
      }
    `
    return new Worker(URL.createObjectURL(new Blob([bootstrap], { type: 'application/javascript' })))
  }

  /** 注册 worker 代码（字符串） */
  registerWorker(name: string, code: string) {
    this.workerCodeMap.set(name, code)
  }

  /** 派发任务，返回 Promise */
  postTask(workerName: string, payload: any, onMessage?: (v: any) => void) {
    return new Promise((resolve, reject) => {
      this.queue.push({ workerName, payload, resolve, reject, onMessage })
      this.dispatch()
    })
  }

  /** 核心调度 */
  private dispatch() {
    for (let i = 0; i < this.size; i++) {
      if (this.workerBusy[i]) continue
      if (this.queue.length === 0) break

      const task = this.queue.shift()!
      const worker = this.workers[i]
      const code = this.workerCodeMap.get(task.workerName)
      if (!code) {
        task.reject(`Worker '${task.workerName}' not registered`)
        continue
      }

      this.workerBusy[i] = true
      const payload = unwrapProxy(task.payload)
      const handle = (e: MessageEvent) => {
        const msg = e.data
        if (msg.type === 'stream') {
          task.onMessage?.(msg.chunk)
          return
        }
        worker.removeEventListener('message', handle)
        this.workerBusy[i] = false

        const { ok, result, error } = e.data
        ok ? task.resolve(result) : task.reject(error)

        this.dispatch()
      }
      worker.addEventListener('message', handle)

      // 注入用户代码
      worker.postMessage({ type: 'init', code })

      // 执行任务
      worker.postMessage({ type: 'run', payload: payload })
    }
  }
}
