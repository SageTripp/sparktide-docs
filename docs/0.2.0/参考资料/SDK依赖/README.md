---
title: SDK 依赖
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/settings.gradle.kts
  - sparktide-backend-sdk/build.gradle.kts
  - sparktide-frontend-sdk/package.json
---

# SDK 依赖索引

依赖章节已分别归入[后端 SDK](../后端SDK.md)和[前端 SDK](../前端SDK.md)。本页保留依赖全表，便于已有链接继续访问。按实际要引入的制品选择章节。版本一律是 `0.2.0`。这些坐标来自当前源码，维护者尚未发布到 Maven Central 或 npm registry。各页里的安装片段说明坐标和配套关系，不表示已经从公网仓库安装成功。

一个业务进程只选 `sdk-java` 或 `sdk-java8` 其中一套。Spring 应用优先依赖对应的 Starter，由它传递核心。模型、PDF 和 GraphQL 按需要另加，版本与核心相同。前端根包没有视觉；界面和通用组件是可选的同版本包。

稳定入口仍是 [后端 SDK](../后端SDK.md) 与 [前端 SDK](../前端SDK.md)。接入步骤在 [开发接入](../../开发接入/README.md)。可复制的应用在文档仓库 `examples/0.2.0/`，说明见 [完整示例](../../开发接入/完整示例.md)。

## 后端运行时

| 章节 | 坐标 | 何时加入 |
| --- | --- | --- |
| [Java 核心](./Java核心.md) | `sdk-java` | Java 17，且不用 Starter 自己管理 HTTP |
| [Java 8 核心](./Java8核心.md) | `sdk-java8` | 字节码目标 Java 8，且不用 Boot 2 Starter |
| [Kotlin 扩展](./Kotlin扩展.md) | `sdk-kotlin` | 需要协程、DSL 或 `chatAs` |
| [Spring Boot 4 启动器](./SpringBoot4启动器.md) | `sdk-spring-boot-starter` | Java 17、Boot 4、Jakarta |
| [Spring Boot 2 启动器](./SpringBoot2启动器.md) | `sdk-spring-boot2-starter` | Java 8、Boot 2.6.6、javax |

## 模型

| 章节 | 坐标 | 何时加入 |
| --- | --- | --- |
| [模型声明](./模型声明.md) | `sdk-model-spi` | 使用注解；Starter 和核心已经传递 |
| [模型 HTTP 传输](./模型HTTP传输.md) | `sdk-model-http` | 只有自定义 HTTP 适配器才直接依赖 |
| [OpenAI 兼容模型](./OpenAI兼容模型.md) | `sdk-model-openai-compatible` | 自备 `baseUrl` 的兼容协议 |
| [OpenAI 模型](./OpenAI模型.md) | `sdk-model-openai` | 官方 `api.openai.com` |
| [DeepSeek 模型](./DeepSeek模型.md) | `sdk-model-deepseek` | 官方 DeepSeek |
| [Ollama 模型](./Ollama模型.md) | `sdk-model-ollama` | 本机或自建 Ollama |
| [OpenCode Go 模型](./OpenCodeGo模型.md) | `sdk-model-opencode-go` | OpenCode Go 的兼容端点 |

## 文档与查询

| 章节 | 坐标 | 何时加入 |
| --- | --- | --- |
| [文档合同](./文档合同.md) | `sdk-document-spi` | 只需要文件合同；核心已经传递 |
| [PDF 文档](./PDF文档.md) | `sdk-document-pdf` | 业务工具要生成 PDF |
| [GraphQL 只读查询](./GraphQL只读查询.md) | `sdk-query-graphql` | Java 17，把只读 GraphQL 做成工具 |

## 前端

| 章节 | 包 | 何时加入 |
| --- | --- | --- |
| [前端核心](./前端核心.md) | `@sparktide/frontend-sdk` | 任何业务页面 |
| [基础界面](./基础界面.md) | `@sparktide/ui-basic` | 基础聊天外观 |
| [大屏界面](./大屏界面.md) | `@sparktide/ui-dashboard` | 大屏外观，不与基础样式叠用 |
| [通用展示组件](./通用展示组件.md) | `@sparktide/ai-components` | 可选的 GenUI 合同 |
