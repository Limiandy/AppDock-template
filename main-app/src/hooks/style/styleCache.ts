export interface StyleCacheItem {
  el: HTMLStyleElement
  css: string
}

export const styleCache = new Map<string, StyleCacheItem>()
