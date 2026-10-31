---
title: OpenCode Go 模型
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-model-opencode-go/build.gradle.kts
  - sparktide-backend-sdk/sdk-model-opencode-go/src/main/kotlin/dev/sparktide/sdk/provider/OpenCodeGoProvider.kt
---

# OpenCode Go 模型

`dev.sparktide:sdk-model-opencode-go:0.2.0` 提供 `dev.sparktide.sdk.provider.OpenCodeGoProvider`。默认协议根是 `https://opencode.ai/inference/go/openai/v1`，再拼接 `/chat/completions`。请求固定附带 `thinking.type=disabled`，并添加 SDK 从可信模型辅助服务取得的 `x-opencode-session`。业务不要自己拼这个头。

字节码目标 Java 8，传递 [OpenAI 兼容模型](./OpenAI兼容模型.md)。共享注解见 [模型声明](./模型声明.md)，传输上限见 [模型 HTTP 传输](./模型HTTP传输.md)。模型名不能用来猜测能力。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-model-opencode-go:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-opencode-go</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

与 Starter 同版本。导入的是 `dev.sparktide.sdk.provider.OpenCodeGoProvider`。核心包 `dev.sparktide.sdk.OpenCodeGoProvider` 是另一套需要构造参数的历史类型，声明式接入不要使用那一个。

## 本适配器的参数

没有可打开的思考开关，也没有组织头或模型专属 `options()`。Provider 与模型的 `options()` 都必须保持各自的默认对象，覆盖成其他类型会在创建适配器时拒绝。

| 项 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| 默认协议根 | `https://opencode.ai/inference/go/openai/v1` | 两个地址都空时使用 | Go 的 OpenAI 协议根，不含 `/chat/completions` | 使用该默认端点时留空 |
| `apiKey` | 空 | 见[模型声明](./模型声明.md)。端点要求密钥时三种来源仍只能留一种 | 调用时读取的供应商密钥 | 端点要求认证时 |
| 思考 | 固定关闭 | 没有业务可写的开关。响应里出现 `thinking`、`reasoning` 或非空 `reasoning_content` 时，该次调用失败 | 适配器始终发送 `thinking.type=disabled` | 不要再找一个布尔字段去打开它 |
| 会话头 | SDK 填写 | 16 到 128 位字母、数字、下划线或连字符 | `x-opencode-session`，来自可信模型辅助服务 | 业务代码不填写。不符合格式时该次调用认证失败 |

正文允许列表与[兼容模型](./OpenAI兼容模型.md)相同，另外固定加上关闭思考。`example-chat-model` 换成已核对的真实标识。能力保持 `UNKNOWN`，Token 数只是演示上限。

## 默认端点

::: code-group

```java [Java]
package dev.example.ops.opencode;

import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.provider.OpenCodeGoProvider;

/** 默认协议根。不要改用 dev.sparktide.sdk 包里的同名历史类型。 */
@AiProvider(apiKey = "${OPENCODE_GO_API_KEY}")
public class OpsGo extends OpenCodeGoProvider {}

@AiModel(
    name = "ops-go-model",
    model = "example-chat-model",
    provider = OpsGo.class,
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
public class OpsGoModel extends OpsGo.Model {
    /** 不要覆盖 options()。思考由适配器固定关闭。 */
    public OpsGoModel() {}
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.opencode

import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.annotation.Support
import dev.sparktide.sdk.provider.OpenCodeGoProvider

@AiProvider(apiKey = "\${OPENCODE_GO_API_KEY}")
class OpsGo : OpenCodeGoProvider()

@AiModel(
    name = "ops-go-model",
    model = "example-chat-model",
    provider = OpsGo::class,
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
class OpsGoModel : OpenCodeGoProvider.Model()
```

:::

## 改协议根

`baseUrl` 仍是协议根，不要写成已经包含 `/chat/completions` 的地址。会话头继续由 SDK 填写。

::: code-group

```java [Java]
package dev.example.ops.opencode.gateway;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenCodeGoProvider;

@AiProvider(baseUrl = "${OPENCODE_GO_BASE_URL}", apiKey = "${OPENCODE_GO_API_KEY}")
public class GatewayGo extends OpenCodeGoProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.opencode.gateway

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenCodeGoProvider

@AiProvider(baseUrl = "\${OPENCODE_GO_BASE_URL}", apiKey = "\${OPENCODE_GO_API_KEY}")
class GatewayGo : OpenCodeGoProvider()
```

:::
