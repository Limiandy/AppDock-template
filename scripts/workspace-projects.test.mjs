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
import {
  createApplicationFiles,
  createApplicationFileMap,
  deleteApplicationFiles,
  getNextApplicationPort,
  toKebabCase,
  toPascalCase,
  validateAppName,
} from './scaffold-application.mjs'

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

test('application scaffold normalizes names and validates project names', () => {
  assert.equal(toKebabCase('Demo App'), 'demo-app')
  assert.equal(toPascalCase('demo-app'), 'DemoApp')
  assert.doesNotThrow(() => validateAppName('demo-app'))
  assert.throws(() => validateAppName('1-demo'), /子项目名称/)
})

test('application scaffold picks the next available port', () => {
  withTempWorkspace((rootDir) => {
    const firstDir = makeProject(rootDir, 'application/first-app', 'first-app')
    const secondDir = makeProject(rootDir, 'application/second-app', 'second-app')
    fs.writeFileSync(path.join(firstDir, 'vite.config.ts'), 'const port = 60011\nexport default {}\n')
    fs.writeFileSync(path.join(secondDir, 'vite.config.ts'), 'const port = 60015\nexport default {}\n')

    assert.equal(getNextApplicationPort(rootDir), 60016)
  })
})

test('application scaffold creates a runnable micro app skeleton', () => {
  withTempWorkspace((rootDir) => {
    const result = createApplicationFiles(rootDir, {
      name: 'Demo App',
      title: '演示应用',
      port: 60020,
    })

    assert.equal(result.name, 'demo-app')
    assert.equal(result.port, 60020)
    assert.deepEqual(result.files, Object.keys(createApplicationFileMap({ name: 'demo-app', title: '演示应用', port: 60020, pascalName: 'DemoApp' })).sort())
    const packageJson = JSON.parse(fs.readFileSync(path.join(result.dir, 'package.json'), 'utf-8'))
    assert.equal(packageJson.name, 'demo-app')
    assert.equal(packageJson.scripts.build, 'vite build')
    assert.match(fs.readFileSync(path.join(result.dir, 'vite.config.ts'), 'utf-8'), /const port = 60020/)
    assert.match(fs.readFileSync(path.join(result.dir, 'src/router/index.ts'), 'utf-8'), /path: '\/demo-app'/)
  })
})

test('application scaffold deletes app folder and generated route module', () => {
  withTempWorkspace((rootDir) => {
    const result = createApplicationFiles(rootDir, {
      name: 'delete-me',
      title: '删除验证',
      port: 60021,
    })
    const routeModuleDir = path.join(rootDir, 'main-app/src/router/modules')
    const routeModulePath = path.join(routeModuleDir, 'delete-me.ts')
    fs.mkdirSync(routeModuleDir, { recursive: true })
    fs.writeFileSync(routeModulePath, 'export default []\n')

    const deleted = deleteApplicationFiles(rootDir, { name: 'delete-me' })

    assert.equal(deleted.name, 'delete-me')
    assert.equal(fs.existsSync(result.dir), false)
    assert.equal(fs.existsSync(routeModulePath), false)
    assert.throws(() => deleteApplicationFiles(rootDir, { name: 'delete-me' }), /子项目不存在/)
  })
})
