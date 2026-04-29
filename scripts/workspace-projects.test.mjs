import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  createMicroApps,
  createViteCommand,
  getApplicationProjects,
  getDevProjects,
  getProjectDistArgs,
  getProjectDistDir,
  getRequiredBuildProjects,
  normalizeForwardedArgs,
  parseSelection,
  readProjectPort,
  uniqueProjects,
  writeMicroApps,
} from './workspace-projects.mjs'

function makeProject(rootDir, relativeDir, pkgName) {
  const projectDir = path.join(rootDir, relativeDir)
  fs.mkdirSync(projectDir, { recursive: true })
  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ name: pkgName }, null, 2))
  fs.writeFileSync(path.join(projectDir, 'vite.config.ts'), 'export default {}\n')
  return projectDir
}

function withTempWorkspace(callback) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vue-playground-runner-'))
  try {
    return callback(rootDir)
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true })
  }
}

test('discovers application projects with vite config sorted by package name', () => {
  withTempWorkspace((rootDir) => {
    makeProject(rootDir, 'application/z-app', 'z-app')
    makeProject(rootDir, 'application/a-app', 'a-app')
    fs.mkdirSync(path.join(rootDir, 'application/no-vite'), { recursive: true })
    fs.writeFileSync(path.join(rootDir, 'application/no-vite/package.json'), '{"name":"no-vite"}')

    assert.deepEqual(
      getApplicationProjects(rootDir).map((project) => project.name),
      ['a-app', 'z-app'],
    )
  })
})

test('build projects always include main-app', () => {
  withTempWorkspace((rootDir) => {
    makeProject(rootDir, 'common', 'common')
    makeProject(rootDir, 'main-app', 'main-app')

    assert.deepEqual(
      getRequiredBuildProjects(rootDir).map((project) => project.name),
      ['main-app'],
    )
  })
})

test('dev projects include main-app and application projects only', () => {
  withTempWorkspace((rootDir) => {
    makeProject(rootDir, 'main-app', 'main-app')
    makeProject(rootDir, 'common', 'common')
    makeProject(rootDir, 'application/css-app', 'css-app')

    assert.deepEqual(
      getDevProjects(rootDir).map((project) => project.name),
      ['main-app', 'css-app'],
    )
  })
})

test('selection parser supports default, all, none, comma lists and dedupe', () => {
  const projects = [{ name: 'one' }, { name: 'two' }, { name: 'three' }]

  assert.deepEqual(parseSelection('', projects, { defaultAll: true }), projects)
  assert.deepEqual(parseSelection('', projects), [])
  assert.deepEqual(parseSelection('all', projects), projects)
  assert.deepEqual(parseSelection('none', projects), [])
  assert.deepEqual(parseSelection('3,1,1', projects), [projects[0], projects[2]])
  assert.throws(() => parseSelection('4', projects), /无效选择/)
})

test('project list can be de-duplicated by directory', () => {
  const projects = [
    { name: 'one', dir: '/repo/one' },
    { name: 'one-copy', dir: '/repo/one' },
    { name: 'two', dir: '/repo/two' },
  ]

  assert.deepEqual(uniqueProjects(projects), [projects[0], projects[2]])
})

test('vite command passes extra arguments through unchanged', () => {
  assert.deepEqual(createViteCommand('build', ['--mode', 'staging']), [
    'pnpm',
    ['exec', 'vite', 'build', '--mode', 'staging'],
  ])
  assert.deepEqual(createViteCommand('dev', ['--mode', 'mock']), ['pnpm', ['exec', 'vite', '--mode', 'mock']])
})

test('vite command strips pnpm argument separator before forwarding', () => {
  assert.deepEqual(normalizeForwardedArgs(['--', '--mode', 'staging']), ['--mode', 'staging'])
  assert.deepEqual(createViteCommand('build', ['--', '--mode', 'staging']), [
    'pnpm',
    ['exec', 'vite', 'build', '--mode', 'staging'],
  ])
})

test('build command writes application output under its own root dist subfolder', () => {
  withTempWorkspace((rootDir) => {
    const projectDir = makeProject(rootDir, 'application/css-app', 'css-app')
    const project = { name: 'css-app', dir: projectDir }

    assert.equal(getProjectDistDir(rootDir, project), path.join(rootDir, 'dist/css-app'))
    assert.deepEqual(getProjectDistArgs(rootDir, project), ['--outDir', '../../dist/css-app', '--emptyOutDir'])
    assert.deepEqual(createViteCommand('build', ['--', '--mode', 'test'], { rootDir, project }), [
      'pnpm',
      ['exec', 'vite', 'build', '--mode', 'test', '--outDir', '../../dist/css-app', '--emptyOutDir'],
    ])
  })
})

test('build command writes main-app output directly under root dist folder', () => {
  withTempWorkspace((rootDir) => {
    const projectDir = makeProject(rootDir, 'main-app', 'main-app')
    const project = { name: 'main-app', dir: projectDir }

    assert.equal(getProjectDistDir(rootDir, project), path.join(rootDir, 'dist'))
    assert.deepEqual(getProjectDistArgs(rootDir, project), ['--outDir', '../dist', '--emptyOutDir'])
    assert.deepEqual(createViteCommand('build', ['--', '--mode', 'test'], { rootDir, project }), [
      'pnpm',
      ['exec', 'vite', 'build', '--mode', 'test', '--outDir', '../dist', '--emptyOutDir'],
    ])
  })
})

test('micro app config uses localhost entries for dev and deployed paths for build', () => {
  withTempWorkspace((rootDir) => {
    const projectDir = makeProject(rootDir, 'application/css-app', 'css-app')
    fs.writeFileSync(path.join(projectDir, 'vite.config.ts'), 'const port = 60012\nexport default {}\n')
    const project = { name: 'css-app', dir: projectDir }

    assert.equal(readProjectPort(projectDir), '60012')
    assert.deepEqual(createMicroApps([project], 'dev'), [
      {
        name: 'css-app',
        entry: '//localhost:60012',
        container: '#qiankun-container',
        activeRule: '/css-app',
        props: {},
      },
    ])
    assert.deepEqual(createMicroApps([project], 'build'), [
      {
        name: 'css-app',
        entry: '/css-app/',
        container: '#qiankun-container',
        activeRule: '/css-app',
        props: {},
      },
    ])
  })
})

test('micro app config is written into main-app source', () => {
  withTempWorkspace((rootDir) => {
    fs.mkdirSync(path.join(rootDir, 'main-app/src'), { recursive: true })
    const projectDir = makeProject(rootDir, 'application/custom-comp-app', 'custom-comp-app')
    const project = { name: 'custom-comp-app', dir: projectDir }

    writeMicroApps(rootDir, [project], 'build')

    assert.equal(
      fs.readFileSync(path.join(rootDir, 'main-app/src/micro-apps.json'), 'utf-8'),
      `${JSON.stringify(createMicroApps([project], 'build'), null, 2)}\n`,
    )
  })
})
