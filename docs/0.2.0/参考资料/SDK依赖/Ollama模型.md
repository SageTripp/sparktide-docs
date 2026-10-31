---
title: Ollama 模型
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-model-ollama/build.gradle.kts
  - sparktide-backend-sdk/sdk-model-ollama/src/main/kotlin/dev/sparktide/sdk/provider/OllamaProvider.kt
---

# Ollama 模型

`dev.sparktide:sdk-model-ollama:0.2.0` 提供 `OllamaProvider`。它调用原生 `/api/chat`，默认协议根是 `http://127.0.0.1:11434`。本地默认不要求 API Key。这不是 OpenAI 兼容模块。

字节码目标 Java 8，传递 [模型 HTTP 传输](./模型HTTP传输.md)。共享注解见 [模型声明](./模型声明.md)。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-model-ollama:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-ollama</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

版本与 Starter 同为 `0.2.0`。SDK 不会替你拉取模型。`example-chat-model` 换成这台 Ollama 上已经存在的名字。

## 本适配器的参数

地址和可选密钥见[模型声明](./模型声明.md)。Provider 选项必须保持 `DefaultProviderOptions`。模型行为是 `OllamaModelOptions`。

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| 默认协议根 | `http://127.0.0.1:11434` | 两个地址都空时使用。适配器再拼接 `/api/chat` | 本机 Ollama | 服务就在本机回环地址时留空 |
| API Key | 不配置 | 一旦写了 `apiKey`、`apiKeyEnv` 或 `apiKey()`，调用时就不能是空白 | 前置代理要求密钥时才发送 `Authorization` | 本机无认证时三种来源都不要写 |
| `OllamaModelOptions.think` | false | 只能是 false。true 在构造选项时直接拒绝 | 思考输出。当前协议不接收思考文本 | 保持 false |
| `OllamaModelOptions.keepAlive` | null | null，或 `-1`、`0`，或没有前导零的 1 到 9 位正整数再加 `ms`、`s`、`m`、`h` | 模型保活时长。null 不发送 `keep_alive`，由服务端默认。SDK 只校验格式 | 交接班期间希望模型保持加载时，例如 `30m` |

请求里的 `temperature`、`top_p`、`seed` 若存在，会放进 Ollama 的 `options`，并带上 `num_predict`（来自输出上限）。`tool_choice` 只接受缺省或 `auto`，其他值会拒绝。`response_format.type` 为 `json_object` 时发送 `format=json`；为 `json_schema` 时发送其中的 `schema`。流式正文是 NDJSON。创建适配器时不连接服务。

能力默认未知。下面显式写成 `UNKNOWN`，避免把未核对的本机模型标成已支持。Token 数仍是演示上限。

## 本机模型与保活

本机默认根不写 `baseUrl`。保活写在模型的 `options()` 上，不写在 Provider 上。

::: code-group

```java [Java]
package dev.example.ops.ollama;

import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.provider.OllamaModelOptions;
import dev.sparktide.sdk.provider.OllamaProvider;

@AiModel(
    name = "ops-local-model",
    model = "example-chat-model",
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
public class OpsLocalModel extends OllamaProvider.Model {
    public OpsLocalModel() {}

    @Override
    public OllamaModelOptions options() {
        // think 必须是 false。30m 表示交接班这一段时间保持加载。
        // 要服务端默认保活时，不要改 keepAlive，沿用 null。
        return super.options().copy(false, "30m");
    }
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.ollama

import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.Support
import dev.sparktide.sdk.provider.OllamaModelOptions
import dev.sparktide.sdk.provider.OllamaProvider

@AiModel(
    name = "ops-local-model",
    model = "example-chat-model",
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
class OpsLocalModel : OllamaProvider.Model() {
    override fun options(): OllamaModelOptions = super.options().copy(think = false, keepAlive = "30m")
}
```

:::

## 共享实例

共享地址用整段 `${OLLAMA_BASE_URL}`。不要写成带默认值的 `${OLLAMA_BASE_URL:http://127.0.0.1:11434}`。代理要求密钥时再加 `apiKey`；模型类要把 `provider` 指向这个子类。`think` 与 `keepAlive` 仍写在模型的 `options()` 上，写法和上一组相同。

::: code-group

```java [Java]
package dev.example.ops.ollama.remote;

import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OllamaProvider;

@AiProvider(baseUrl = "${OLLAMA_BASE_URL}", apiKey = "${OLLAMA_API_KEY}")
public class SharedOllama extends OllamaProvider {}

@AiModel(name = "ops-shared-model", model = "example-chat-model",
    provider = SharedOllama.class, maxOutputTokens = 1024)
public class OpsSharedModel extends SharedOllama.Model {
    public OpsSharedModel() {}
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.ollama.remote

import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OllamaProvider

@AiProvider(baseUrl = "\${OLLAMA_BASE_URL}", apiKey = "\${OLLAMA_API_KEY}")
class SharedOllama : OllamaProvider()

@AiModel(name = "ops-shared-model", model = "example-chat-model",
    provider = SharedOllama::class, maxOutputTokens = 1024)
class OpsSharedModel : OllamaProvider.Model()
```

:::

## 完整的原生地址

与 `baseUrl` 互斥。这个地址会被原样调用，不会再拼接 `/api/chat`，所以它本身就要包含原生聊天路径。

::: code-group

```java [Java]
package dev.example.ops.ollama.endpoint;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OllamaProvider;

@AiProvider(endpoint = "${OLLAMA_CHAT_ENDPOINT}")
public class OllamaRawEndpoint extends OllamaProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.ollama.endpoint

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OllamaProvider

@AiProvider(endpoint = "\${OLLAMA_CHAT_ENDPOINT}")
class OllamaRawEndpoint : OllamaProvider()
```

:::
