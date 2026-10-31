---
title: Spring Boot 2 启动器
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-spring-boot2-starter/build.gradle.kts
---

# Spring Boot 2 启动器

`dev.sparktide:sdk-spring-boot2-starter:0.2.0` 面向 Spring Boot `2.6.6` 和 javax Servlet。它传递 `sdk-java8`。编译 SDK 使用 JDK 17，发布字节码目标是 Java 8。配置键、注册生命周期和错误边界与 [Spring Boot 4 启动器](./SpringBoot4启动器.md) 相同，差别是 Servlet 包和传递的核心。

不要和 `sdk-spring-boot-starter` 或 `sdk-java` 放进同一个进程。制品尚未发布到 Maven Central。

## 安装与配套

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-spring-boot2-starter:0.2.0")
    implementation("dev.sparktide:sdk-model-openai-compatible:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-spring-boot2-starter</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

Maven 的 Boot 2 BOM 需要把 `kotlin.version` 对齐到 `2.3.20`。业务进程可以运行在 JDK 8。模型模块版本同样是 `0.2.0`，它们的字节码也是 Java 8。

## 何时使用

现有应用已经锁定 Boot 2.6.6 和 javax 时使用本坐标。可以升级到 Boot 4 时改用 Boot 4 启动器，并换成 Jakarta 依赖，不要两套 Starter 并存。

## 最小示例

注解写法与 Java 17 相同，因为包名一致。把依赖坐标换成上面的 Boot 2 Starter 即可。主体映射、工具和知识见 [Java 核心](./Java核心.md)。
