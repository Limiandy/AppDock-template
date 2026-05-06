import fs from 'fs'
import type { Plugin } from 'vite'
import prettier from 'prettier'
import * as t from '@babel/types'
import * as parser from '@babel/parser'
import _traverse from '@babel/traverse'
import type traverseType from '@babel/traverse'
import { moduleType } from 'node-module-type'

const type = moduleType()
const traverse = (
  typeof _traverse === 'function' || type === 'commonjs' ? _traverse : (_traverse as any).default
) as typeof traverseType

function astToValue(node: t.Node): any {
  // console.log('astToValue:', t.isObjectExpression(node) ? 'Object' : node.type)
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    for (const prop of node.properties) {
      if (t.isObjectProperty(prop)) {
        const key = t.isIdentifier(prop.key)
          ? prop.key.name
          : t.isStringLiteral(prop.key)
            ? prop.key.value
            : '[UnknownKey]'

        obj[key] = astToValue(prop.value)
      }
    }
    return obj
  }

  if (t.isArrayExpression(node)) {
    return node.elements.map((el) => (el ? astToValue(el) : null))
  }

  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return node.value
  if (t.isBooleanLiteral(node)) return node.value
  if (t.isNullLiteral(node)) return null

  if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
    if (
      t.isCallExpression(node.body) &&
      t.isImport(node.body.callee) &&
      node.body.arguments.length === 1 &&
      t.isStringLiteral(node.body.arguments[0])
    ) {
      return `import(${node.body.arguments[0].value})`
    }
    return '[Function]'
  }

  if (t.isCallExpression(node)) {
    if (t.isImport(node.callee) && node.arguments.length === 1 && t.isStringLiteral(node.arguments[0])) {
      return `import(${node.arguments[0].value})`
    }
    return '[CallExpression]'
  }

  if (t.isIdentifier(node)) return node.name

  return '[Unknown]'
}

export async function loadRoutes(path: string) {
  const sourceCode = fs.readFileSync(path, 'utf-8')
  // 解析 ts/tsx 代码，支持 typescript
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  let routesNode = null
  // 遍历 AST，找到变量 routes 的初始化表达式
  traverse(ast, {
    VariableDeclarator(path) {
      if (path.node.id.type === 'Identifier' && path.node.id.name === 'routes') {
        routesNode = path.node.init
        path.stop()
      }
    },
    ExportNamedDeclaration(path) {
      // 有时 routes 是直接导出的
      const decl = path.node.declaration
      if (decl && t.isVariableDeclaration(decl)) {
        for (const d of decl.declarations) {
          if (t.isIdentifier(d.id) && d.id.name === 'routes') {
            routesNode = d.init
            path.stop()
            break
          }
        }
      }
    },
  })
  // console.dir(astToValue(routesNode!), { depth: 10 }) // 打印完整结构，包含所有 children
  return astToValue(routesNode!)
}

function generateMicroAppRoutes(routes: any[]): string {
  const formatRoutes = JSON.stringify(routes, null, 2).replace(/null/g, 'MicroAppLoader')
  return `
import MicroAppLoader from '@/layout/MicroAppLoader.vue'

export default ${formatRoutes}
  `
}

function transformRoute(route: any, parentName = ''): any {
  const name = parentName ? `${parentName}${route.name}` : route.name

  const newRoute: any = {
    path: route.path.replace(/^\//, ''),
    name,
    component: null,
    meta: route.meta || {},
  }

  if (route.children && Array.isArray(route.children)) {
    newRoute.children = route.children.map((child: any) => transformRoute(child, name))
  }

  return newRoute
}

export default function MicroAppRoutePlugin(source: string, target: string): Plugin {
  return {
    name: 'vite-plugin-sync-router',
    apply: 'serve',
    async configureServer(server) {
      const update = async () => {
        try {
          const routes = await loadRoutes(source)
          const transformed = routes.map((r: any) => transformRoute(r))

          const code = generateMicroAppRoutes(transformed)

          const formatted = await prettier.format(code, {
            parser: 'babel-ts',
            trailingComma: 'all',
            singleQuote: true,
            semi: false,
            printWidth: 80,
            arrowParens: 'always',
            proseWrap: 'always',
            endOfLine: 'auto',
            experimentalTernaries: false,
            tabWidth: 2,
            useTabs: false,
            quoteProps: 'consistent',
            jsxSingleQuote: false,
            bracketSpacing: true,
            bracketSameLine: false,
            vueIndentScriptAndStyle: false,
            singleAttributePerLine: true,
          })

          fs.writeFileSync(target, formatted, 'utf-8')
          console.log(`[microapp-routes] ✅ 微应用路由文件已更新`)
        } catch (e) {
          console.error('[microapp-routes] ❌ 生成失败', e)
        }
      }
      if (!source || !target) return
      server.watcher.add(source)

      server.watcher.on('change', async (file) => {
        if (file === source) {
          await update()
        }
      })

      await update()
    },
  }
}
