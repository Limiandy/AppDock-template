import fs from 'node:fs'
import path from 'node:path'

export const requiredBuildProjectNames = ['main-app']

export function readPackageName(projectDir) {
  const packagePath = path.join(projectDir, 'package.json')
  if (!fs.existsSync(packagePath)) return null

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'))
  return typeof pkg.name === 'string' && pkg.name.trim() ? pkg.name : null
}

export function readProjectPort(projectDir) {
  const viteConfigPath = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs']
    .map((fileName) => path.join(projectDir, fileName))
    .find((filePath) => fs.existsSync(filePath))

  if (!viteConfigPath) return null

  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8')
  const portMatch = viteConfigContent.match(/const\s+port\s*=\s*(\d+)/)
  return portMatch ? portMatch[1] : null
}

export function hasViteConfig(projectDir) {
  return ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].some((fileName) =>
    fs.existsSync(path.join(projectDir, fileName)),
  )
}

export function getApplicationProjects(rootDir) {
  const applicationDir = path.join(rootDir, 'application')
  if (!fs.existsSync(applicationDir)) return []

  return fs
    .readdirSync(applicationDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(applicationDir, entry.name)
      return {
        dir,
        label: entry.name,
        name: readPackageName(dir) ?? entry.name,
      }
    })
    .filter((project) => hasViteConfig(project.dir))
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function getRequiredBuildProjects(rootDir) {
  return requiredBuildProjectNames.map((label) => {
    const dir = path.join(rootDir, label)
    return {
      dir,
      label,
      name: readPackageName(dir) ?? label,
    }
  })
}

function normalizeReferencePath(value) {
  return value.replaceAll('\\', '/')
}

function sortReferencePaths(paths) {
  const priority = (value) => {
    if (value === './common/tsconfig.json') return 0
    if (value === './main-app/tsconfig.json') return 1
    if (value.startsWith('./application/')) return 2
    if (value === './tsconfig.node.json') return 3
    return 4
  }

  return [...paths].sort((left, right) => priority(left) - priority(right) || left.localeCompare(right))
}

export function getApplicationTsConfigReferences(rootDir) {
  return getApplicationProjects(rootDir)
    .filter((project) => fs.existsSync(path.join(project.dir, 'tsconfig.json')))
    .map((project) => `./${path.relative(rootDir, project.dir).split(path.sep).join('/')}/tsconfig.json`)
}

/**
 * 让根 tsconfig 的 application 引用与 application/* 实际项目保持一致。
 * 只替换 application 引用，保留 common、main-app、tsconfig.node 等其他引用。
 */
export function syncRootTsConfigReferences(rootDir) {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) return null

  const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
  const referencePaths = new Set(
    (config.references ?? [])
      .map((reference) => normalizeReferencePath(reference.path))
      .filter((referencePath) => !referencePath.startsWith('./application/')),
  )

  for (const referencePath of getApplicationTsConfigReferences(rootDir)) {
    referencePaths.add(referencePath)
  }

  const references = sortReferencePaths(referencePaths)
  config.references = references.map((referencePath) => ({ path: referencePath }))

  // 保持引用对象单行输出，与 Prettier 对 tsconfig.json 的格式化结果一致。
  const content = JSON.stringify(config, null, 2).replace(
    /\{\n(\s*)"path": ("(?:[^"\\]|\\.)*")\n\s*\}/g,
    '{ "path": $2 }',
  )
  fs.writeFileSync(tsconfigPath, `${content}\n`)
  return config
}

export function getDevProjects(rootDir) {
  return [
    {
      dir: path.join(rootDir, 'main-app'),
      label: 'main-app',
      name: readPackageName(path.join(rootDir, 'main-app')) ?? 'main-app',
    },
    ...getApplicationProjects(rootDir),
  ].filter((project) => hasViteConfig(project.dir))
}

export function parseSelection(input, projects, { defaultAll = false } = {}) {
  const value = input.trim().toLowerCase()

  if (!value) {
    return defaultAll ? projects : []
  }

  if (value === 'all' || value === '*') {
    return projects
  }

  if (value === 'none' || value === '-') {
    return []
  }

  const selectedIndexes = new Set()
  for (const part of value.split(/[\s,，]+/).filter(Boolean)) {
    const index = Number(part)
    if (!Number.isInteger(index) || index < 1 || index > projects.length) {
      throw new Error(`无效选择: ${part}`)
    }
    selectedIndexes.add(index - 1)
  }

  return [...selectedIndexes].sort((left, right) => left - right).map((index) => projects[index])
}

export function uniqueProjects(projects) {
  const visited = new Set()
  return projects.filter((project) => {
    const key = project.dir
    if (visited.has(key)) return false
    visited.add(key)
    return true
  })
}

export function getProjectDistDir(rootDir, project) {
  if (project.name === 'main-app') {
    return path.join(rootDir, 'dist')
  }

  return path.join(rootDir, 'dist', project.name)
}

export function getProjectDistArgs(rootDir, project) {
  return ['--outDir', path.relative(project.dir, getProjectDistDir(rootDir, project)), '--emptyOutDir']
}

export function createMicroApps(projects) {
  return projects.map((project) => {
    const port = readProjectPort(project.dir)

    return {
      name: project.name,
      port: port === null ? null : Number(port),
      container: '#qiankun-container',
      activeRule: `/${project.name}`,
      props: {},
    }
  })
}

export function writeMicroApps(rootDir, projects) {
  const microAppsPath = path.join(rootDir, 'main-app/src/micro-apps.json')
  const microApps = createMicroApps(projects)

  fs.writeFileSync(microAppsPath, `${JSON.stringify(microApps, null, 2)}\n`)
  return microApps
}

export function createViteCommand(task, viteArgs = [], options = {}) {
  const viteCommand = task === 'build' ? ['vite', 'build'] : ['vite']
  const normalizedArgs = normalizeForwardedArgs(viteArgs)
  const buildArgs =
    task === 'build' && options.rootDir && options.project ? getProjectDistArgs(options.rootDir, options.project) : []
  return ['pnpm', ['exec', ...viteCommand, ...normalizedArgs, ...buildArgs]]
}

export function normalizeForwardedArgs(args = []) {
  return args[0] === '--' ? args.slice(1) : args
}
