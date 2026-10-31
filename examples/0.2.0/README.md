# 0.2.0 公开示例

这些目录是文档仓库里的示例应用，只包含业务侧源码和独立构建文件。它们不包含启澜 SDK 实现、平台源码、凭据或构建缓存。

制品版本固定为 `0.2.0`。后端坐标是 `dev.sparktide`，前端包名是 `@sparktide/frontend-sdk`、`@sparktide/ui-basic`、`@sparktide/ui-dashboard`、`@sparktide/ai-components`。这些坐标来自当前源码的版本字段，维护者尚未把它们发布到 Maven Central 或 npm registry。示例构建文件使用版本号，不使用 SDK 仓库的 `project` 依赖，也不使用指向私有源码目录的 `file:` 依赖。

在维护者提供同版本 Jar 或 tarball 之前，直接执行 `npm install` 或只打开 Maven Central 不能装到这些包。本目录的说明不把公网安装写成已经验证通过。

示例源码随文档仓库维护：

https://github.com/SageTripp/sparktide-docs/tree/master/examples/0.2.0/

已经克隆文档仓库时，直接复制本目录。不要从业务产品仓库再拷一份实现来代替这些示例。

## 目录

| 目录 | 覆盖的用途 |
| --- | --- |
| [java-ops-assistant](./java-ops-assistant/) | Java 17、Spring Boot 4：Provider、模型、只读工具、需确认的写工具、按租户过滤的知识、主体映射 |
| [kotlin-ops-assistant](./kotlin-ops-assistant/) | 与上一目录等价的 Kotlin 声明，另含挂起工具、权限、可信上下文和 `chatAs` |
| [core-client](./core-client/) | 无界面的 TypeScript 与 JavaScript 客户端：`createClient`、`createChat`、`chat.run`、跟进提交 |
| [react-chat](./react-chat/) | React：`ChatPanel`、`useChat`、业务卡片、通用组件、跟进；大屏组件在 `dashboard.tsx` |
| [vue3-chat](./vue3-chat/) | Vue 3：插件、`ChatPanel`、`useChat`、业务卡片、通用组件 |
| [vue2-chat](./vue2-chat/) | Vue 2：插件、`ChatPanel`、`createChatMixin`、业务卡片、通用组件 |

机组、工单和用户对照表都是本地替身，不代表真实设备或已经完成的登录。
