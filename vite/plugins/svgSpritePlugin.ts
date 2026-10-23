import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ResolvedConfig } from 'vite'

interface SpriteIcon {
  dir: string
  name: string
  viewBox: string
  content: string
}

interface SpriteOptions {
  /** 图标目录（相对仓库根目录），默认 common/src/icons */
  iconDir?: string
  /** 产物文件名，默认 app-icons.svg */
  fileName?: string
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const symbolId = (icon: SpriteIcon) => `icon-${icon.dir ? `${icon.dir}-` : ''}${icon.name}`

function walk(dir: string, accept: (file: string) => boolean, files: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path, accept, files)
    else if (accept(path)) files.push(path)
  }

  return files
}

function readIcon(file: string, root: string): SpriteIcon {
  const segments = relative(root, file).split(sep)
  const svg = readFileSync(file, 'utf8')

  return {
    dir: segments.length > 1 ? segments[0] : '',
    name: segments.at(-1)!.replace(/\.svg$/, ''),
    viewBox: svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 24 24',
    content: svg
      .replace(/<\?xml[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg\b[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim(),
  }
}

function renderSprite(icons: SpriteIcon[]) {
  const symbols = icons.map(
    (icon) => `<symbol id="${symbolId(icon)}" viewBox="${icon.viewBox}">${icon.content}</symbol>`,
  )

  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>`
}

/**
 * 把 common/src/icons 打成一个独立的 sprite 静态资源（默认 app-icons.svg），不再内联进 JS。
 *
 * 始终输出全量图标：菜单等图标名称可能由后端配置下发（例如新建菜单时选择图标），
 * 前端在运行时才拼出名称，构建期做「只保留引用到的图标」裁剪会漏掉这些图标。
 * 全量 sprite 约 1.7MB，gzip 后约 400KB，作为独立文件可被浏览器/CDN 缓存。
 */
export default function svgSpritePlugin(options: SpriteOptions = {}): Plugin {
  const iconRoot = resolve(repoRoot, options.iconDir ?? 'common/src/icons')
  const fileName = options.fileName ?? 'app-icons.svg'

  let config: ResolvedConfig
  let cache: { signature: string; sprite: string } | null = null

  function loadSprite() {
    const files = walk(iconRoot, (file) => file.endsWith('.svg'))
    const signature = files
      .map((file) => {
        const stat = statSync(file)
        return `${file}:${stat.mtimeMs}:${stat.size}`
      })
      .join('|')

    if (cache?.signature !== signature) {
      cache = { signature, sprite: renderSprite(files.map((file) => readIcon(file, iconRoot))) }
    }

    return cache.sprite
  }

  return {
    name: 'app:svg-sprite',
    configResolved(resolved) {
      config = resolved
    },
    configureServer(server) {
      config = server.config

      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0]

        if (!url?.endsWith(`/${fileName}`)) return next()

        response.setHeader('Content-Type', 'image/svg+xml')
        response.setHeader('Cache-Control', 'no-cache')
        response.end(loadSprite())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName, source: loadSprite() })
    },
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { name: 'app-icon-sprite', content: `${config.base}${fileName}` },
          injectTo: 'head',
        },
      ]
    },
  }
}
