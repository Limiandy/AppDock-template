import fs from 'fs'
import path from 'path'
import fg from 'fast-glob'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../src/icons')
const REPO_ROOT = path.resolve(__dirname, '../..')
const DEFAULT_OUT_DIR = path.resolve(REPO_ROOT, 'sql')

function parseArgs(argv) {
  const options = { dialect: 'all', outDir: DEFAULT_OUT_DIR }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--dialect') {
      options.dialect = argv[index + 1] ?? ''
      index += 1
    } else if (arg === '--out') {
      options.outDir = path.resolve(process.cwd(), argv[index + 1] ?? '')
      index += 1
    } else {
      throw new Error(`不支持的参数：${arg}`)
    }
  }

  if (!['all', 'postgres', 'mysql'].includes(options.dialect)) {
    throw new Error(`--dialect 只支持 all / postgres / mysql，收到：${options.dialect}`)
  }

  return options
}

function humanize(name) {
  return name
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ')
}

function scanIcons() {
  const files = fg.sync('**/*.svg', { cwd: ROOT }).sort()

  return files.map((file, index) => {
    const segments = file.split('/')
    const name = segments.pop().replace(/\.svg$/, '')
    const dir = segments[0] ?? ''
    const code = dir ? `${dir}:${name}` : name

    return {
      code,
      dir: dir || 'root',
      name,
      symbolId: `icon-${dir ? `${dir}-` : ''}${name}`,
      label: humanize(name),
      file,
      sort: index,
    }
  })
}

const escapeSql = (value) => String(value).replace(/'/g, "''")
const quote = (value) => `'${escapeSql(value)}'`

function renderInsertRows(icons) {
  const rows = icons.map(
    (icon) =>
      `  (${quote(icon.code)}, ${quote(icon.dir)}, ${quote(icon.name)}, ${quote(icon.symbolId)}, ${quote(icon.label)}, ${quote(icon.file)}, ${icon.sort})`,
  )

  // 分批插入，避免单条 SQL 过大
  const chunks = []
  for (let index = 0; index < rows.length; index += 200) {
    chunks.push(rows.slice(index, index + 200))
  }

  return chunks
}

function renderHeader(comment) {
  return `-- ${comment}
-- 由 common/scripts/gen-icon-sql.mjs 生成，请勿手工修改
-- 数据来源：common/src/icons（${'app'} / ${'solar'} / root）
-- 业务表（菜单等）保存 code，例如 app:workbench / solar:home-outline，前端用 <SvgIcon :name="code" />
`
}

function renderPostgres(icons) {
  const values = renderInsertRows(icons)
    .map(
      (rows) =>
        `insert into sys_icon (code, dir, name, symbol_id, label, file, sort) values\n${rows.join(',\n')}\non conflict (code) do update set\n  dir = excluded.dir,\n  name = excluded.name,\n  symbol_id = excluded.symbol_id,\n  label = excluded.label,\n  file = excluded.file,\n  sort = excluded.sort,\n  updated_at = now();\n`,
    )
    .join('\n')

  return `${renderHeader('图标字典（PostgreSQL / Supabase）')}
create table if not exists sys_icon (
  id         bigserial primary key,
  code       varchar(64)  not null unique,
  dir        varchar(16)  not null,
  name       varchar(64)  not null,
  symbol_id  varchar(80)  not null,
  label      varchar(80)  not null,
  file       varchar(160) not null,
  sort       integer      not null default 0,
  created_at timestamptz  not null default now(),
  updated_at timestamptz  not null default now()
);

comment on table sys_icon is '前端图标字典，业务表保存 code（如 app:workbench）';
comment on column sys_icon.code is '前端 <SvgIcon name="..."> 的取值';
comment on column sys_icon.symbol_id is 'app-icons.svg 中的 symbol id';
comment on column sys_icon.label is '展示名（用于图标选择器搜索）';

-- 菜单表示例：icon 字段存 sys_icon.code
-- alter table sys_menu add column if not exists icon varchar(64);
-- comment on column sys_menu.icon is '图标 code，引用 sys_icon.code';

${values}`
}

function renderMysql(icons) {
  const values = renderInsertRows(icons)
    .map(
      (rows) =>
        `insert into sys_icon (code, dir, name, symbol_id, label, file, sort) values\n${rows.join(',\n')}\non duplicate key update\n  dir = values(dir),\n  name = values(name),\n  symbol_id = values(symbol_id),\n  label = values(label),\n  file = values(file),\n  sort = values(sort);\n`,
    )
    .join('\n')

  return `${renderHeader('图标字典（MySQL 5.7+ / 8.x）')}
create table if not exists sys_icon (
  id         bigint unsigned not null auto_increment,
  code       varchar(64)  not null comment '前端 <SvgIcon name> 的取值，如 app:workbench',
  dir        varchar(16)  not null comment '图标目录：app / solar / root',
  name       varchar(64)  not null comment '文件名（不含 .svg）',
  symbol_id  varchar(80)  not null comment 'app-icons.svg 中的 symbol id',
  label      varchar(80)  not null comment '展示名',
  file       varchar(160) not null comment '相对 common/src/icons 的路径',
  sort       int          not null default 0,
  created_at timestamp    not null default current_timestamp,
  updated_at timestamp    not null default current_timestamp on update current_timestamp,
  primary key (id),
  unique key uk_sys_icon_code (code)
) engine = InnoDB default charset = utf8mb4 comment = '前端图标字典，业务表保存 code（如 app:workbench）';

-- 菜单表示例：icon 字段存 sys_icon.code
-- alter table sys_menu add column icon varchar(64) comment '图标 code，引用 sys_icon.code';

${values}`
}

const options = parseArgs(process.argv.slice(2))
const icons = scanIcons()

fs.mkdirSync(options.outDir, { recursive: true })

if (options.dialect === 'all' || options.dialect === 'postgres') {
  const file = path.join(options.outDir, 'icons.postgres.sql')
  fs.writeFileSync(file, renderPostgres(icons))
  console.log(`图标 SQL（PostgreSQL）→ ${path.relative(REPO_ROOT, file)}（${icons.length} 个图标）`)
}

if (options.dialect === 'all' || options.dialect === 'mysql') {
  const file = path.join(options.outDir, 'icons.mysql.sql')
  fs.writeFileSync(file, renderMysql(icons))
  console.log(`图标 SQL（MySQL）→ ${path.relative(REPO_ROOT, file)}（${icons.length} 个图标）`)
}
