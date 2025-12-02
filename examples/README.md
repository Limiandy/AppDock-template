# 微应用新增示例
1. copy `first-app` 目录到 `application` 目录
2. 修改 目录名称为合理的名称，注意：这个名称很重要，要按规范命名，在基座中注册子应用时应用名称就是这个。
3. 修改`vite.config.ts` 文件中的 `port` 为合理的端口号
4. 修改 package.json 中的 `name` 属性与应用名称一至
5. 在根目录中运行 `npm run gen-micro-apps` 命令，会自动注册微应用至基座

## 路由规范
1. 文件命名必须是`router.ts`, 且必须放在 `src/router` 目录下
2. 在创建、修改路由时，会同步向基座注册路由信息表