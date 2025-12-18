// updateStyle.ts
import { styleCache } from './styleCache'

function findInsertPosition() {
  const styles = document.querySelectorAll<HTMLStyleElement>('style[data-vc-order]')
  return styles.length ? styles[styles.length - 1] : null
}

export function updateStyle(hash: string, css: string, order = 0) {
  let cache = styleCache.get(hash)

  if (!cache) {
    const el = document.createElement('style')
    el.setAttribute('type', 'text/css')
    el.setAttribute('data-css-i-hash', hash)
    el.setAttribute('data-vc-order', 'custom')
    el.setAttribute('data-order', String(order))

    const anchor = findInsertPosition()

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(el, anchor.nextSibling)
    } else {
      // fallback：如果 antd 还没注入，先丢到 head 末尾
      document.head.appendChild(el)
    }

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
