#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncRootTsConfigReferences } from './workspace-projects.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const config = syncRootTsConfigReferences(rootDir)

console.log(`已同步根 tsconfig 引用，共 ${config.references.length} 个项目`)
