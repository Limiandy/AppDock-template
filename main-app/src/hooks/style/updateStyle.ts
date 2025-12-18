// updateStyle.ts
import { styleCache } from './styleCache'

export function updateStyle(hash: string, css: string, order = 0) {
  let cache = styleCache.get(hash)

  if (!cache) {
    const el = document.createElement('style')
    el.setAttribute('type', 'text/css')
    el.setAttribute('data-css-i-hash', hash)
    el.setAttribute('data-vc-order', 'prependQueue')
    el.setAttribute('data-order', String(order))

    document.head.appendChild(el)

    cache = { el, css: '' }
    styleCache.set(hash, cache)
  }

  if (cache.css !== css) {
    cache.el.textContent = css
    cache.css = css
  }
}

export function removeStyle(hash: string) {
  const cache = styleCache.get(hash)
  if (cache) {
    cache.el.remove()
    styleCache.delete(hash)
  }
}
