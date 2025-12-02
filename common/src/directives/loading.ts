import type { Directive, DirectiveBinding } from 'vue'

interface LoadingEl extends HTMLElement {
  __loadingMask?: HTMLElement
}

function createMask() {
  const mask = document.createElement('div')
  mask.className = 'v-loading-mask'
  mask.innerHTML = `
    <div class="v-loading-spinner"></div>
  `
  return mask
}

export const loadingDirective: Directive = {
  mounted(el: LoadingEl, binding: DirectiveBinding) {
    const mask = createMask()
    el.__loadingMask = mask

    if (binding.value) {
      document.body.appendChild(mask)
    }
  },

  updated(el: LoadingEl, binding: DirectiveBinding) {
    const mask = el.__loadingMask
    if (!mask) return

    if (binding.value) {
      if (!mask.parentNode) {
        document.body.appendChild(mask)
      }
    } else {
      mask.remove()
    }
  },

  unmounted(el: LoadingEl) {
    el.__loadingMask?.remove()
    delete el.__loadingMask
  },
}
