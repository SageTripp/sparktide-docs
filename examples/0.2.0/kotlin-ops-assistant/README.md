# Kotlin 业务助手

与 `java-ops-assistant` 等价的类型化声明，使用 Kotlin 类、`data class` 和挂起工具。另外演示三件 Kotlin 扩展里的事情：挂起权限判定、可信上下文，以及 `PlatformClient.chatAs`。

依赖：

- `dev.sparktide:sdk-spring-boot-starter:0.2.0`
- `dev.sparktide:sdk-kotlin:0.2.0`
- `dev.sparktide:sdk-model-openai-compatible:0.2.0`

坐标尚未发布到 Maven Central。把维护者提供的同版本 Jar 安装到本机 Maven 仓库后，在本目录执行 `gradle compileKotlin`。不要改成 SDK 仓库里的 `project` 依赖。

`chatAs` 使用的用户对照来自环境变量 `OPS_USER_CREDENTIALS`，格式为 `用户=凭据`，多项用逗号分隔。仓库和示例配置都不写真实凭据。请求头里的用户名只是本地替身的查找键，不能代替业务系统已经完成的登录。
