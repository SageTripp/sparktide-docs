---
title: 后端 SDK
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/build.gradle.kts
  - sparktide-backend-sdk/settings.gradle.kts
---

# 后端 SDK

本组坐标是 `dev.sparktide`，版本 `0.2.0`。一个应用只依赖 `sdk-java` 或 `sdk-java8` 其中一套。参数表已按依赖拆开，本页保留为稳定入口。制品尚未发布到 Maven Central。

接入步骤见 [后端接入](../开发接入/后端接入.md)。下表按依赖坐标进入对应章节。开发 Agent 可使用 [后端接入 Skill](../开发接入/Agent技能.md)。

## 模块

| 模块 | 章节 |
| --- | --- |
| `sdk-java` | [Java 核心](./SDK依赖/Java核心.md) |
| `sdk-java8` | [Java 8 核心](./SDK依赖/Java8核心.md) |
| `sdk-kotlin` | [Kotlin 扩展](./SDK依赖/Kotlin扩展.md) |
| `sdk-spring-boot-starter` | [Spring Boot 4 启动器](./SDK依赖/SpringBoot4启动器.md) |
| `sdk-spring-boot2-starter` | [Spring Boot 2 启动器](./SDK依赖/SpringBoot2启动器.md) |
| `sdk-model-spi` | [模型声明](./SDK依赖/模型声明.md) |
| `sdk-model-http` | [模型 HTTP 传输](./SDK依赖/模型HTTP传输.md) |
| `sdk-model-openai-compatible` | [OpenAI 兼容模型](./SDK依赖/OpenAI兼容模型.md) |
| `sdk-model-openai` | [OpenAI 模型](./SDK依赖/OpenAI模型.md) |
| `sdk-model-deepseek` | [DeepSeek 模型](./SDK依赖/DeepSeek模型.md) |
| `sdk-model-ollama` | [Ollama 模型](./SDK依赖/Ollama模型.md) |
| `sdk-model-opencode-go` | [OpenCode Go 模型](./SDK依赖/OpenCodeGo模型.md) |
| `sdk-document-spi` | [文档合同](./SDK依赖/文档合同.md) |
| `sdk-document-pdf` | [PDF 文档](./SDK依赖/PDF文档.md) |
| `sdk-query-graphql` | [GraphQL 只读查询](./SDK依赖/GraphQL只读查询.md) |

Kotlin 插件版本是 `2.3.20`。Boot 4 Starter 按 Spring Boot `4.0.8` 编译。Boot 2 Starter 按 `2.6.6` 编译，字节码目标 Java 8。

## 注解

`@AiProvider`、`@AiModel`、`@Agent` 和额度在 [模型声明](./SDK依赖/模型声明.md)。`@Tool`、`@Knowledge`、`@RenderWith`、`ToolContext` 和 `UserIdentity` 在 [Java 核心](./SDK依赖/Java核心.md)。Java 8 核心使用同一包名。

## 配置

配置前缀、新旧键对齐和默认值在 [Spring Boot 4 启动器](./SDK依赖/SpringBoot4启动器.md)。Boot 2 使用同一组键，见 [Spring Boot 2 启动器](./SDK依赖/SpringBoot2启动器.md)。

## 注册生命周期

`SparkTideRegistration` 的方法和发布规则在 [Spring Boot 4 启动器](./SDK依赖/SpringBoot4启动器.md)。聊天路径见 [HTTP 接入](../开发接入/HTTP接入.md)。

## 错误边界

聊天控制器和业务认证转发的状态码在 [Spring Boot 4 启动器](./SDK依赖/SpringBoot4启动器.md)。浏览器看到的路径和正文外壳见 [HTTP 接入](../开发接入/HTTP接入.md)。
