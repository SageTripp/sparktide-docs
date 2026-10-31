---
title: Java 8 核心
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-java8/build.gradle.kts
  - sparktide-backend-sdk/build.gradle.kts
---

# Java 8 核心

`dev.sparktide:sdk-java8:0.2.0` 与 `sdk-java` 使用同一套包名，字节码目标是 Java 8。公开方法和 [Java 核心](./Java核心.md) 相同，包括 `PlatformClient`、`@Tool`、`ToolContext` 和 `UserIdentity`。一个应用只选其中一套。

Boot 2 业务优先依赖 [Spring Boot 2 启动器](./SpringBoot2启动器.md)，由它传递本模块。只有不用 Starter、又必须跑在 Java 8 上时才直接依赖本坐标。

构建 SDK 仓库本身使用 JDK 17。消费本制品的业务进程可以运行在 JDK 8。制品尚未发布到 Maven Central。

## 安装与配套

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-java8:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-java8</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

Maven 若同时管理旧的 Kotlin 版本，把 `kotlin.version` 对齐到 `2.3.20`。不要再声明 `sdk-java`。模型适配器的字节码也是 Java 8，版本仍写 `0.2.0`。

## 关键差异

| 项 | Java 8 核心 | Java 17 核心 |
| --- | --- | --- |
| 字节码 | 不超过 52 | Java 17 |
| 传递核心 | 无第二套 | 无第二套 |
| 注解与客户端包名 | `dev.sparktide.sdk` | 相同 |
| GraphQL 模块 | 不配套，该模块要求 Java 17 | 可另加 |

## 最小示例

写法与 Java 17 核心相同。Boot 2 进程把 Starter 坐标换成 `sdk-spring-boot2-starter`，见 [后端接入](../../开发接入/后端接入.md)。

::: code-group

```java [Java]
PlatformClient client = new PlatformClient(
    URI.create(platformUrl), appId, () -> applicationCredential);
```

```kotlin [Kotlin]
val client = PlatformClient(
    URI.create(platformUrl), appId, Supplier { applicationCredential })
```

:::

应用凭据只留在后台。这个客户端不是浏览器里的登录。
