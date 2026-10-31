---
title: Kotlin 扩展
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-kotlin/build.gradle.kts
  - sparktide-backend-sdk/sdk-kotlin/src/main/kotlin/dev/sparktide/sdk/kotlin/ChatDsl.kt
  - sparktide-backend-sdk/sdk-kotlin/src/main/kotlin/dev/sparktide/sdk/kotlin/BusinessProviders.kt
---

# Kotlin 扩展

`dev.sparktide:sdk-kotlin:0.2.0` 在已选核心之上提供协程和 DSL。它 `api` 依赖 `sdk-java`，因此 Java 17 进程直接加这一坐标即可。Java 8 进程应先依赖 `sdk-java8` 或 Boot 2 Starter，不要让这一坐标再把 `sdk-java` 带进同一个进程。常规 Spring 声明不需要本模块；需要挂起工具、`chatAs` 或 Kotlin 权限端口时再加入。

Kotlin 插件版本是 `2.3.20`。运行时使用 `kotlinx-coroutines-core:1.10.2`，由本模块传递。制品尚未发布到 Maven Central。

## 安装与配套

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-kotlin:0.2.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-kotlin</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

Java 8 线把 Starter 换成 `sdk-spring-boot2-starter`，并排除或避免再解析到 `sdk-java`。

## 关键入口

| 入口 | 含义 | 何时用 |
| --- | --- | --- |
| `PlatformClient.chatAs(user, credential) { }` | 用业务凭据函数建立用户作用域后提交聊天。取消协程只取消本地等待，不自动撤销平台运行 | 后台按已认证用户发起一次聊天 |
| `message` / `agent` / `idempotencyKey` / `context` | `ChatBuilder` 上的字段。`agent(id, version)` 使用精确版本 | 写在 `chatAs` 块里 |
| `PermissionProvider` | `dev.sparktide.sdk.kotlin` 里的挂起端口，`asJavaProvider()` 转成核心接口 | 权限判定本身要挂起 |
| `AgentContextProvider` | 挂起生成 `TrustedContext`，键不能覆盖 `appId`、`subjectId`、`tenantId`、`role`、`permissions` | 要给运行附加业务上下文 |
| 挂起的 `@Tool` 方法 | 与普通工具相同的注解，方法可以是 `suspend` | 工具要调用挂起的业务 API |

`credential` 必须从业务认证结果解析。不能把请求正文里的用户编号当成凭据。

## 最小示例

::: code-group

```java [Java]
CompletionStage<Map<String, Object>> pending = client.forUser(() -> userCredential)
    .chat(ChatRequest.builder("查询设备").agent("main", "1.0.0").build());
```

```kotlin [Kotlin]
val receipt = client.chatAs(user, { userCredential }) {
    message("查询设备")
    agent("main", "1.0.0")
}
```

:::

Java 没有 `chatAs`，等价调用是 `forUser` 加 `chat`。完整 Kotlin 应用在 `examples/0.2.0/kotlin-ops-assistant`。

Spring MVC 控制器使用 `suspend` 方法时，还需引入 `org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2`，供 Spring 调用挂起函数。只写普通同步控制器或仅调用 SDK 协程扩展时，不因本 SDK 自动要求 MVC 适配。
