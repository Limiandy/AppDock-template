type Handler = (...args: any[]) => void

class EventEmitter {
  private events: Map<string, Set<Handler>>

  constructor() {
    this.events = new Map()
  }

  on(event: string, handler: Handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }

  off(event: string, handler: Handler) {
    const handlers = this.events.get(event)
    if (!handlers) return
    handlers.delete(handler)
    if (handlers.size === 0) {
      this.events.delete(event)
    }
  }

  once(event: string, handler: Handler) {
    const wrapper: Handler = (...args) => {
      handler(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event)
    if (!handlers) return // 拷贝一份，避免 emit 时修改 Set 导致的问题
    ;[...handlers].forEach((fn) => fn(...args))
  }

  clear() {
    this.events.clear()
  }
}

export default EventEmitter
