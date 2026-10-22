import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const binPath = resolve(packageDir, 'bin/create-app-dock.mjs')

function runCli(args, cwd) {
  return spawnSync(process.execPath, [binPath, ...args], { cwd, encoding: 'utf8' })
}

test('prints the CLI version', async () => {
  const testRoot = await mkdtemp(resolve(tmpdir(), 'create-app-dock-'))
  const { version } = JSON.parse(await readFile(resolve(packageDir, 'package.json'), 'utf8'))

  try {
    const result = runCli(['--version'], testRoot)
    assert.equal(result.status, 0)
    assert.equal(result.stdout.trim(), version)
  } finally {
    await rm(testRoot, { recursive: true, force: true })
  }
})

test('creates an AppDock project from the packaged template', async () => {
  const testRoot = await mkdtemp(resolve(tmpdir(), 'create-app-dock-'))

  try {
    const result = runCli(['demo-app'], testRoot)
    assert.equal(result.status, 0, result.stderr)

    const manifest = JSON.parse(await readFile(resolve(testRoot, 'demo-app/package.json'), 'utf8'))
    const workspace = await readFile(resolve(testRoot, 'demo-app/pnpm-workspace.yaml'), 'utf8')

    assert.equal(manifest.name, 'demo-app')
    assert.match(workspace, /main-app/)
    assert.doesNotMatch(workspace, /packages\/\*/)
    assert.match(result.stdout, /pnpm install/)
    await access(resolve(testRoot, 'demo-app/AGENTS.md'))
    await access(resolve(testRoot, 'demo-app/docs/scaffold.md'))
    await access(resolve(testRoot, 'demo-app/main-app/.env.mock'))
    await access(resolve(testRoot, 'demo-app/main-app/.env.supabase'))
    const microApps = JSON.parse(await readFile(resolve(testRoot, 'demo-app/main-app/src/micro-apps.json'), 'utf8'))
    assert.deepEqual(microApps, [])
  } finally {
    await rm(testRoot, { recursive: true, force: true })
  }
})

test('creates a single app project without examples', async () => {
  const testRoot = await mkdtemp(resolve(tmpdir(), 'create-app-dock-single-'))

  try {
    const result = runCli(['demo-single', '--single', '--no-examples'], testRoot)
    assert.equal(result.status, 0, result.stderr)

    const root = resolve(testRoot, 'demo-single')
    assert.match(result.stdout, /单应用/)
    assert.match(result.stdout, /不含示例页面/)

    // micro frontend plumbing removed
    await assert.rejects(access(resolve(root, 'main-app/src/registerMicroApp.ts')))
    await assert.rejects(access(resolve(root, 'application')))
    await assert.rejects(access(resolve(root, 'main-app/src/micro-apps.json')))
    await assert.rejects(access(resolve(root, 'scripts/workspace-projects.mjs')))
    await assert.rejects(access(resolve(root, 'vite/plugins/routeSyncPlugin.ts')))

    // examples removed and replaced by a minimal home page
    await assert.rejects(access(resolve(root, 'main-app/src/views/workbench')))
    await assert.rejects(access(resolve(root, 'main-app/src/data/prototype')))
    await access(resolve(root, 'main-app/src/views/HomeView.vue'))
    const routes = await readFile(resolve(root, 'main-app/src/router/BaseAppRoutes.ts'), 'utf8')
    assert.match(routes, /HomeView/)
    assert.doesNotMatch(routes, /WorkbenchHome/)
    const router = await readFile(resolve(root, 'main-app/src/router/index.ts'), 'utf8')
    assert.doesNotMatch(router, /modules/)
    assert.match(router, /redirect: '\/home'/)

    const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    assert.equal(manifest.devDependencies['vite-plugin-qiankun'], undefined)
    assert.equal(manifest.scripts['create:app'], undefined)
    assert.equal(manifest.scripts['gen-micro-apps'], undefined)
    assert.doesNotMatch(manifest.scripts.dev, /gen-micro-apps/)
    assert.doesNotMatch(manifest.scripts.check, /test:scripts/)

    const mainManifest = JSON.parse(await readFile(resolve(root, 'main-app/package.json'), 'utf8'))
    assert.equal(mainManifest.dependencies.qiankun, undefined)

    const readme = await readFile(resolve(root, 'README.md'), 'utf8')
    assert.match(readme, /单应用/)
    const agents = await readFile(resolve(root, 'AGENTS.md'), 'utf8')
    assert.match(agents, /单应用/)
  } finally {
    await rm(testRoot, { recursive: true, force: true })
  }
})

test('keeps the micro frontend scaffold when only examples are disabled', async () => {
  const testRoot = await mkdtemp(resolve(tmpdir(), 'create-app-dock-clean-'))

  try {
    const result = runCli(['demo-clean', '--micro', '--no-examples'], testRoot)
    assert.equal(result.status, 0, result.stderr)

    const root = resolve(testRoot, 'demo-clean')
    await access(resolve(root, 'main-app/src/registerMicroApp.ts'))
    await access(resolve(root, 'main-app/src/micro-apps.json'))
    await access(resolve(root, 'scripts/workspace-projects.mjs'))

    await assert.rejects(access(resolve(root, 'main-app/src/views/workbench')))
    await assert.rejects(access(resolve(root, 'main-app/src/data/prototype')))
    await access(resolve(root, 'main-app/src/views/HomeView.vue'))
    const routes = await readFile(resolve(root, 'main-app/src/router/BaseAppRoutes.ts'), 'utf8')
    assert.match(routes, /HomeView/)

    const readme = await readFile(resolve(root, 'README.md'), 'utf8')
    assert.match(readme, /不含示例页面/)
  } finally {
    await rm(testRoot, { recursive: true, force: true })
  }
})

test('refuses to overwrite a non-empty destination without --force', async () => {
  const testRoot = await mkdtemp(resolve(tmpdir(), 'create-app-dock-'))

  try {
    const occupiedDir = resolve(testRoot, 'occupied')
    await mkdir(occupiedDir)
    await writeFile(resolve(occupiedDir, 'sentinel'), 'sentinel')
    const result = runCli(['occupied'], testRoot)

    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /不是空目录/)
    assert.equal(await readFile(resolve(occupiedDir, 'sentinel'), 'utf8'), 'sentinel')
  } finally {
    await rm(testRoot, { recursive: true, force: true })
  }
})
