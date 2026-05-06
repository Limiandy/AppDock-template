import { createHmac, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const supabaseDir = path.join(rootDir, 'docker/supabase')
const envPath = path.join(supabaseDir, '.env.local')
const generatedDir = path.join(supabaseDir, '.generated')
const rolesSqlPath = path.join(generatedDir, 'zy-roles.sql')
const composePath = path.join(supabaseDir, 'docker-compose.yml')
const command = process.argv[2] || 'start'

function base64Url(input) {
  return Buffer.from(input).toString('base64url')
}

function createJwt(secret, role) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      iss: 'supabase',
      ref: 'vue-playground-local',
      role,
      iat: 1700000000,
      exp: 4102444800,
    }),
  )
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function parseEnv(content) {
  return Object.fromEntries(
    content
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(/=(.*)/s).filter(Boolean))
      .map(([key, value]) => [key, value]),
  )
}

function ensureEnv() {
  if (fs.existsSync(envPath)) return

  const jwtSecret = randomBytes(32).toString('hex')
  const postgresPassword = randomBytes(18).toString('base64url')
  const content = [
    `POSTGRES_PASSWORD=${postgresPassword}`,
    `POSTGRES_PORT=55432`,
    `SUPABASE_PORT=54321`,
    `SUPABASE_PUBLIC_URL=http://localhost:54321`,
    `SITE_URL=http://localhost:5173`,
    `JWT_SECRET=${jwtSecret}`,
    `JWT_EXP=3600`,
    `ANON_KEY=${createJwt(jwtSecret, 'anon')}`,
    `SERVICE_ROLE_KEY=${createJwt(jwtSecret, 'service_role')}`,
    '',
  ].join('\n')

  fs.writeFileSync(envPath, content)
  console.log(`已生成 ${path.relative(rootDir, envPath)}`)
}

function sqlString(value) {
  return String(value).replaceAll("'", "''")
}

function ensureGeneratedSql() {
  ensureEnv()
  const env = parseEnv(fs.readFileSync(envPath, 'utf-8'))
  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(
    rolesSqlPath,
    [
      `alter role authenticator with password '${sqlString(env.POSTGRES_PASSWORD)}';`,
      `alter role supabase_auth_admin with password '${sqlString(env.POSTGRES_PASSWORD)}';`,
      `alter role supabase_storage_admin with password '${sqlString(env.POSTGRES_PASSWORD)}';`,
      `alter role supabase_admin with password '${sqlString(env.POSTGRES_PASSWORD)}';`,
      `grant all on schema public to supabase_auth_admin;`,
      `grant all on schema public to supabase_storage_admin;`,
      `grant usage on schema public to anon, authenticated, service_role;`,
      `grant all on schema public to service_role;`,
      `alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;`,
      '',
    ].join('\n'),
  )
}

function runDockerCompose(args) {
  ensureGeneratedSql()
  const result = spawnSync(
    'docker',
    ['compose', '--env-file', envPath, '-f', composePath, '--project-name', 'vue-playground-supabase', ...args],
    {
      cwd: rootDir,
      stdio: 'inherit',
    },
  )

  return result.status ?? 1
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForGateway(env) {
  const url = `http://127.0.0.1:${env.SUPABASE_PORT}/health`
  for (let index = 0; index < 30; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // 容器启动中，继续等待。
    }
    await sleep(1000)
  }

  throw new Error(`Supabase gateway 未就绪：${url}`)
}

async function seedStorageBucket() {
  const env = parseEnv(fs.readFileSync(envPath, 'utf-8'))
  await waitForGateway(env)

  const response = await fetch(`http://127.0.0.1:${env.SUPABASE_PORT}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'apikey': env.SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'super-table-files',
      name: 'super-table-files',
      public: true,
      file_size_limit: 52428800,
    }),
  })

  if (!response.ok && response.status !== 400 && response.status !== 409) {
    throw new Error(`Storage bucket 初始化失败：${response.status} ${await response.text()}`)
  }
  console.log('已确认 Storage bucket：super-table-files')
}

if (command === 'start') {
  const status = runDockerCompose(['up', '-d'])
  if (status !== 0) process.exit(status)
  seedStorageBucket().catch((error) => {
    console.error(error)
    process.exit(1)
  })
} else if (command === 'stop') {
  process.exit(runDockerCompose(['down']))
} else if (command === 'reset') {
  process.exit(runDockerCompose(['down', '-v']))
} else if (command === 'status') {
  process.exit(runDockerCompose(['ps']))
} else {
  console.log('用法：pnpm supabase:start | supabase:stop | supabase:reset | supabase:status')
  process.exit(1)
}
