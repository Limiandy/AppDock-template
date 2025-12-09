// vite.config.ts
import ts from 'typescript'

export default function rawJSPlugin() {
  return {
    name: 'vite-plugin-rawJs',
    transform(code: string, id: string) {
      if (id.endsWith('?rawJs')) {
        // 用 TypeScript 官方编译器编译成 JS
        const js = ts.transpile(code, {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
        })

        return `export default ${JSON.stringify(js)}`
      }
    },
  }
}
