#!/usr/bin/env node

import { run } from '../src/index.mjs'

run(process.argv.slice(2)).catch((error) => {
  console.error(`创建 AppDock 项目失败：${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
