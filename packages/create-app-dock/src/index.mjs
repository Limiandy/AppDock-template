import { access, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))
const templateDir = resolve(packageDir, 'template')

const usage = `用法：\n  pnpm create app-dock <项目目录> [--template default] [--force]\n\n示例：\n  pnpm create app-dock my-app\n  pnpm init app-dock my-app --template default`

export function parseArgs(args) {
  const options = { force: false, help: false, target: '', template: 'default' }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--force') {
      options.force = true
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

  const { destination, projectName } = await createProject({
    cwd,
    force: options.force,
    target: options.target,
  })

  stdout(`\n已创建 AppDock 项目：${projectName}\n\n下一步：\n  cd ${destination}\n  pnpm install\n  pnpm dev\n`)
}
