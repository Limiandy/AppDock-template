#!/usr/bin/env node
/**
 * 构建 main-app 的两套产物：
 * - dist/      生产包：oxc 压缩 + javascript-obfuscator 混淆
 * - dist-debug/ 调试包：不压缩、不混淆、带 sourcemap
 *
 * 用法：node scripts/build-app.mjs [mode] [--prod-only|--debug-only]
 */
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const mode = args.find((arg) => !arg.startsWith('--')) ?? 'production'
const only = args.includes('--debug-only') ? 'debug' : args.includes('--prod-only') ? 'prod' : 'both'

function build(label, env) {
  console.log(`\n▶ 构建${label}（mode: ${mode}）`)

  const result = spawnSync('pnpm', ['--filter', 'main-app', 'exec', 'vite', 'build', '--mode', mode], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (only !== 'debug') {
  build('生产包 dist/', { APP_DEBUG_BUNDLE: '0' })
}

if (only !== 'prod') {
  build('调试包 dist-debug/', { APP_DEBUG_BUNDLE: '1' })
}
