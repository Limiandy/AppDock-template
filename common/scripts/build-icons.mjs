import path from 'path'
import { fileURLToPath } from 'url'
import { IconSet, exportToDirectory } from '@iconify/tools'
import { locate } from '@iconify/json'
import { readFile } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prefixes = ['solar']

for await (const prefix of prefixes) {
  const data = JSON.parse(await readFile(locate(`${prefix}`), 'utf8'))

  const iconSet = new IconSet(data)

  const outlineIcons = iconSet.list().filter((name) => name.includes('outline'))

  const filteredData = {
    ...data,
    icons: outlineIcons.reduce((acc, name) => {
      acc[name] = data.icons[name]
      return acc
    }, {}),
  }

  const filteredIconSet = new IconSet(filteredData)

  console.log('Exporting', iconSet.info.name)

  await exportToDirectory(filteredIconSet, {
    target: path.resolve(__dirname, '..', 'src', 'icons', `${prefix}`),
  })

  console.log('✔ 图标包生成完毕: ', `${__dirname}/src/icons/${prefix}`)
}
