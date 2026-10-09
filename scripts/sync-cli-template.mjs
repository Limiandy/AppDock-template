import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageDir = join(rootDir, 'packages', 'create-app-dock')
const templateDir = join(packageDir, 'template')

const templateEntries = [
  '.gitignore',
  'README.md',
  'application',
  'common',
  'docker',
  'eslint.config.js',
  'main-app',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'prettier.config.js',
  'scripts',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'types',
  'vite',
  'vite.config.base.ts',
]

const excludedNames = new Set(['.DS_Store', '.generated', '.git', '.npmignore', 'dist', 'node_modules'])

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function shouldCopy(source) {
  const pathFromRoot = relative(rootDir, source).split(sep).join('/')
  const fileName = pathFromRoot.split('/').at(-1)

  if (excludedNames.has(fileName)) return false
  if (pathFromRoot === 'main-app/src/micro-apps.json') return false
  if (pathFromRoot === 'scripts/sync-cli-template.mjs') return false
  if (pathFromRoot.endsWith('/.env.local')) return false

  return true
}

async function prepareTemplateManifest() {
  const manifestPath = join(templateDir, 'package.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

  manifest.scripts['test:scripts'] = 'node --test scripts/*.test.mjs'

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function prepareWorkspaceFile() {
  const workspacePath = join(templateDir, 'pnpm-workspace.yaml')
  const workspace = await readFile(workspacePath, 'utf8')
  await writeFile(workspacePath, workspace.replace("  - 'packages/*'\n", ''))
}

async function prepareIgnoreFile() {
  const ignorePath = join(templateDir, '.gitignore')
  const ignoreFile = await readFile(ignorePath, 'utf8')
  await writeFile(ignorePath, ignoreFile.replace('packages/create-app-dock/template/\n', ''))
}

async function prepareLockfile() {
  const lockfilePath = join(templateDir, 'pnpm-lock.yaml')
  if (!(await exists(lockfilePath))) return

  const lockfile = await readFile(lockfilePath, 'utf8')
  await writeFile(lockfilePath, lockfile.replace(/\n  packages\/create-app-dock: \{\}\n(?=\npackages:)/, '\n'))
}

export async function syncCliTemplate() {
  await rm(templateDir, { recursive: true, force: true })
  await mkdir(templateDir, { recursive: true })

  for (const entry of templateEntries) {
    const source = join(rootDir, entry)
    if (await exists(source)) {
      await cp(source, join(templateDir, entry), { recursive: true, filter: shouldCopy })
    }
  }

  await Promise.all([prepareTemplateManifest(), prepareWorkspaceFile(), prepareIgnoreFile(), prepareLockfile()])
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncCliTemplate().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
