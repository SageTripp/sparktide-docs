# 无界面客户端

TypeScript 与 JavaScript 使用同一套 `@sparktide/frontend-sdk@0.2.0` 导出：`createClient`、`createChat`、`chat.run` 和 `followUps.submit`。这里没有 React 或 Vue。

包是 `private`，尚未发布到 npm registry。把维护者提供的 `sparktide-frontend-sdk-0.2.0.tgz` 装进本目录后再执行 `npm run check`。不要把依赖改成前端 SDK 仓库的源码路径。`npm install @sparktide/frontend-sdk` 对着公网 registry 的结果，本目录没有验证过。
