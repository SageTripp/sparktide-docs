---
title: Java 核心
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-java/build.gradle.kts
  - sparktide-backend-sdk/common-core/src/main/kotlin/dev/sparktide/sdk/Annotations.kt
  - sparktide-backend-sdk/common-core/src/main/kotlin/dev/sparktide/sdk/IdentityContracts.kt
  - sparktide-backend-sdk/sdk-java/src/main/kotlin/dev/sparktide/sdk/PlatformClient.kt
---

# Java 核心

`dev.sparktide:sdk-java:0.2.0` 是 Java 17 公开客户端和合同。它传递 `sdk-document-spi` 与 `sdk-model-spi`。Spring 应用不要单独依赖它来代替 Starter；无 Spring、自行管理 HTTP 时才直接使用。同一进程不能再依赖 `sdk-java8`。

制品尚未发布到 Maven Central。安装到本机仓库的做法见 [接入总览](../../开发接入/接入总览.md)。

## 安装与配套

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-java:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-java</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

有 Spring Boot 4 时改依赖 [Spring Boot 4 启动器](./SpringBoot4启动器.md)。协程和 `chatAs` 再加 [Kotlin 扩展](./Kotlin扩展.md)。供应商适配器另选模型章节。

## 关键类型

| 类型 | 含义 | 何时用 |
| --- | --- | --- |
| `PlatformClient` | 应用作用域客户端。构造参数是平台根地址、应用标识、每次读取的凭据 | 注册、发布，或在没有 Starter 时自己发平台 HTTP |
| `@Tool` | 方法。`confirmation` 为 `NONE` 或 `REQUIRED`。`effect` 为 `READ`、`COMPUTE`、`WRITE`、`DANGEROUS`。`roles` 默认 `USER` 与 `APP_ADMIN` | 把一个 Spring 方法暴露给智能体 |
| `@Knowledge` | 方法。`topK` 默认 3 | 按当前用户检索，过滤写在业务查询里 |
| `@RenderWith` | 组件标识、可选版本、`fallback` 默认「请查看文字结果。」 | 成功结果要显示卡片时 |
| `ToolContext` | `appId`、`userId`、`tenantId`、`callId`、`runId`、`deadline`、`trustedContext`、`authentication` | 工具方法的第二个参数 |
| `UserIdentity.of` | `of(subjectId)` 或 `of(subjectId, tenantId)`。subject 非空，两者最长 128 | 自定义主体映射的返回值 |
| `BusinessAuthentication` | `header(name)`、`token()`、`headers()`、`expiresAt()`。只在回调执行期内可读 | 工具要调用原业务远程 API 时 |

`@AgentTool` 与 `@AgentKnowledge` 是类级旧式声明。新代码用方法注解，并由 [模型声明](./模型声明.md) 里的 `@Agent` 引用 Bean 类型。

`PlatformClient` 的公开构造是 `(URI base, String appId, Supplier<String> token)`。`forUser` 换上用户凭据并复用连接。写请求不自动重发。取消阶段会取消底层请求。

## 最小示例

::: code-group

```java [Java]
@Tool(name = "equipment-status", description = "查询机组当前状态，只读")
public Output execute(Input input, ToolContext context) {
    BusinessAuthentication auth = context.authentication();
    return equipmentService.status(input.equipmentId(), auth.token());
}
```

```kotlin [Kotlin]
@Tool(name = "equipment-status", description = "查询机组当前状态，只读")
fun execute(input: Input, context: ToolContext): Output {
    val auth = context.authentication()
    return equipmentService.status(input.equipmentId, auth.token())
}
```

:::

可编译的 Spring 用法在 `examples/0.2.0/java-ops-assistant`。无 Spring 的 `PlatformClient` 不代替浏览器聊天入口；页面仍走业务后台的 `/api/ai`，见 [HTTP 接入](../../开发接入/HTTP接入.md)。
