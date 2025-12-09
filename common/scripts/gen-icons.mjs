// scripts/gen-icons.js
import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT = path.resolve(__dirname, '../src/icons')

const OUTPUT = path.resolve(__dirname, '../src/icons/icons.json')

function scanIcons() {
  const files = fg.sync('**/*.svg', { cwd: ROOT })

  const map = {}

  for (const file of files) {
    // file 例： system/close.svg
    const parts = file.split('/')
    const name = parts.pop().replace('.svg', '')
    const dir = parts.length ? parts[0] : 'root'

    if (!map[dir]) map[dir] = []
    map[dir].push(name)
  }

  // 排序更稳定，可选
  for (const key in map) {
    map[key].sort()
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(map, null, 2))
  console.log(`icons.json generated → ${OUTPUT}`)
}

scanIcons()
