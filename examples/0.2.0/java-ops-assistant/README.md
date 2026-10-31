# Java 业务助手

Java 17 与 Spring Boot 4 的最小声明：兼容协议 Provider、模型、只读工具、确认后才执行的写工具、按租户过滤的知识和主体映射。数据是本目录里的替身列表。

依赖 `dev.sparktide:sdk-spring-boot-starter:0.2.0` 与 `dev.sparktide:sdk-model-openai-compatible:0.2.0`。构建文件只写 Maven 坐标，并查找 `mavenLocal()`。维护者尚未把 `0.2.0` 发布到 Maven Central。先由维护者提供同版本 Jar，或在后端 SDK 仓库执行 `publishToMavenLocal` 之后，再在本目录编译：

```powershell
gradle compileJava
```

本说明没有把上述命令在公网仓库上的成功当作已验证结果。平台地址、应用凭据和模型密钥只从环境变量读取，仓库里不放真实值。
