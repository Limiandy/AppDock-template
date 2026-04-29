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

export function createMicroApps(projects, target) {
  return projects.map((project) => {
    const port = readProjectPort(project.dir)
    const entry = target === 'build' ? `/${project.name}/` : `//localhost:${port}`

    return {
      name: project.name,
      entry,
      container: '#qiankun-container',
      activeRule: `/${project.name}`,
      props: {},
    }
  })
}

export function writeMicroApps(rootDir, projects, target) {
  const microAppsPath = path.join(rootDir, 'main-app/src/micro-apps.json')
  const microApps = createMicroApps(projects, target)

  fs.writeFileSync(microAppsPath, `${JSON.stringify(microApps, null, 2)}\n`)
  return microApps
}

export function createViteCommand(task, viteArgs = [], options = {}) {
  const viteCommand = task === 'build' ? ['vite', 'build'] : ['vite']
  const normalizedArgs = normalizeForwardedArgs(viteArgs)
  const buildArgs = task === 'build' && options.rootDir && options.project ? getProjectDistArgs(options.rootDir, options.project) : []
  return ['pnpm', ['exec', ...viteCommand, ...normalizedArgs, ...buildArgs]]
}

export function normalizeForwardedArgs(args = []) {
  return args[0] === '--' ? args.slice(1) : args
}
