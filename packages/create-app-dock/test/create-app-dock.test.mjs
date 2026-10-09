import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const binPath = resolve(packageDir, 'bin/create-app-dock.mjs')

function runCli(args, cwd) {
  return spawnSync(process.execPath, [binPath, ...args], { cwd, encoding: 'utf8' })
}

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
