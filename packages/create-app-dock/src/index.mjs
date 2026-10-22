import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, parse, resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin as processStdin } from 'node:process'
import { fileURLToPath } from 'node:url'
import { applySingleAppMode, removeExamples, writeModeNote } from './transforms.mjs'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const templateDir = resolve(packageDir, 'template')

const usage = `用法：\n  pnpm create app-dock <项目目录> [--single|--micro] [--no-examples] [--template default] [--force]\n\n示例：\n  pnpm create app-dock my-app                          # 交互式选择形态与示例\n  pnpm create app-dock my-app --micro                  # 微前端（默认）\n  pnpm create app-dock my-app --single --no-examples   # 单应用，不含示例页面\n  pnpm init app-dock my-app --template default`

export function parseArgs(args) {
  const options = { force: false, help: false, target: '', template: 'default', mode: undefined, examples: undefined }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--force') {
      options.force = true
    } else if (arg === '--single') {
      options.mode = 'single'
    } else if (arg === '--micro') {
      options.mode = 'micro'
    } else if (arg === '--examples') {
      options.examples = true
    } else if (arg === '--no-examples') {
      options.examples = false
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--template') {
      options.template = args[index + 1] ?? ''
      index += 1
    } else if (arg.startsWith('-')) {
      throw new Error(`不支持的参数：${arg}`)
    } else if (options.target) {
      throw new Error('只能指定一个项目目录')
    } else {
      options.target = arg
    }
  }

  return options
}

export function toProjectName(target) {
  const normalized = basename(resolve(target))
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!normalized || !/^[a-z0-9][a-z0-9-]*$/.test(normalized)) {
    throw new Error('项目目录必须能转换为以字母或数字开头的 kebab-case 名称')
  }

  return normalized
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function isDirectoryEmpty(path) {
  return (await readdir(path)).length === 0
}

function assertSafeDestination(destination, cwd) {
  if (destination === parse(destination).root) {
    throw new Error('不能将项目创建到文件系统根目录')
  }

  if (destination === resolve(cwd)) {
    throw new Error('请提供一个新的项目目录，而不是当前工作目录')
  }
}

async function writeProjectManifest(destination, projectName) {
  const manifestPath = resolve(destination, 'package.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  manifest.name = projectName
  manifest.private = true

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function resolveVariant(options, { stdin = processStdin } = {}) {
  const resolved = {
    mode: options.mode ?? 'micro',
    examples: options.examples ?? true,
  }

  if (!stdin?.isTTY || (options.mode && options.examples !== undefined)) {
    return resolved
  }

  const rl = createInterface({ input: stdin, output: process.stdout })
  try {
    if (!options.mode) {
      const answer = (await rl.question('项目形态：(1) 微前端（默认） (2) 单应用 > ')).trim()
      resolved.mode = answer === '2' || answer.toLowerCase() === 'single' ? 'single' : 'micro'
    }

    if (options.examples === undefined) {
      const answer = (await rl.question('是否包含示例页面（工作台 / 寻源 / 供应商等）？(Y/n) > ')).trim().toLowerCase()
      resolved.examples = !(answer === 'n' || answer === 'no')
    }
  } finally {
    rl.close()
  }

  return resolved
}

export async function createProject({ cwd = process.cwd(), force = false, target }) {
  const destination = resolve(cwd, target)
  assertSafeDestination(destination, cwd)

  if (await pathExists(destination)) {
    if (await isDirectoryEmpty(destination)) {
      // An empty directory is safe to use without an explicit overwrite flag.
    } else if (force) {
      await rm(destination, { recursive: true, force: true })
    } else {
      throw new Error(`目标目录不是空目录：${destination}。如需覆盖，请显式传入 --force`)
    }
  }

  await mkdir(destination, { recursive: true })
  await cp(templateDir, destination, { recursive: true })

  const projectName = toProjectName(target)
  await writeProjectManifest(destination, projectName)

  return { destination, projectName }
}

export async function run(args, { cwd = process.cwd(), stdout = console.log } = {}) {
  const options = parseArgs(args)

  if (options.help) {
    stdout(usage)
    return
  }

  if (!options.target) {
    throw new Error(`缺少项目目录。\n\n${usage}`)
  }

  if (options.template !== 'default') {
    throw new Error(`当前仅提供 default 模板，收到：${options.template}`)
  }

  const variant = await resolveVariant(options)

  const { destination, projectName } = await createProject({
    cwd,
    force: options.force,
    target: options.target,
  })

  if (variant.mode === 'single') {
    await applySingleAppMode(destination, { examples: variant.examples })
  }

  if (!variant.examples) {
    await removeExamples(destination)
  }

  await writeModeNote(destination, { single: variant.mode === 'single', examples: variant.examples })

  const modeLabel = variant.mode === 'single' ? '单应用' : '微前端'
  const examplesLabel = variant.examples ? '包含示例页面' : '不含示例页面'

  stdout(
    `\n已创建 AppDock 项目：${projectName}（${modeLabel}，${examplesLabel}）\n\n下一步：\n  cd ${destination}\n  pnpm install\n  pnpm dev\n`,
  )
}
