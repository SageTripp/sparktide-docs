<!-- 自动生成；修改 docs/0.2.0/参考资料/SDK依赖/OpenAI兼容模型.md 后执行 docs:skills。 -->

# OpenAI 兼容模型

`dev.sparktide:sdk-model-openai-compatible:0.2.0` 提供 `OpenAICompatibleProvider`。它走 Chat Completions 形状的 HTTP，没有统一默认地址。`@AiProvider` 必须给出 `baseUrl` 或完整 `endpoint`，二者互斥。`baseUrl` 是协议根，SDK 再拼接 `/chat/completions`；不要把已经含有 `/chat/completions` 的地址写进 `baseUrl`。`endpoint` 则原样使用。

字节码目标 Java 8，两套核心都可以配合。它传递 [模型 HTTP 传输](模型HTTP传输.md)。共享注解见 [模型声明](模型声明.md)。官方 OpenAI、DeepSeek 和 OpenCode Go 若有自己的预设，用对应章节。本适配器不接受 `OpenAIOptions` 或其他专属选项，不要覆盖 `options()`。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-model-openai-compatible:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-openai-compatible</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

Boot 2 把 Starter 换成 `sdk-spring-boot2-starter`。版本仍是 `0.2.0`。

## 会转发的请求字段

这些字段来自平台已经发出的模型请求，不能写进 `@AiModel`。不在下表中的供应商参数不会进入正文。请求也不发送 `appId`、`subjectId`、`runId` 或业务认证。

| 字段 | 适配器行为 |
| --- | --- |
| `model`、`messages`、`tools` | 原样保留在允许列表内 |
| `max_completion_tokens` | 协议要求 1 到 10000000。智能体侧由模型声明的输出上限写入运行配置，见[模型声明](模型声明.md) |
| `temperature` | 出现时须为有限数，0 到 2 |
| `top_p` | 出现时须为有限数，大于 0 且不超过 1 |
| `seed` | 出现时须为 0 到 `Long.MAX_VALUE` 的整数 |
| `tool_choice` | 在允许列表内则转发，本适配器不再加范围 |
| `response_format` | 出现时须是对象，然后原样转发 |
| `stream` | 由本次调用是否流式决定，业务注解不填写 |
| `stream_options` | 仅流式调用时由适配器写成 `include_usage=true` |

流式响应按 SSE 解析。缺失用量保持未知，不补成零。已发送的请求不自动重试。结束原因为长度时，该次非流式调用会拒绝，避免把截断结果当成完成。

## 可用声明

能力保持 `UNKNOWN`，表示本示例还没有把该网关模型核对成已支持。输出上限 1024 是助手自己的演示上限。`example-chat-model` 换成供应商侧已经存在的标识。

::: code-group

```java [Java]
package dev.example.ops.compatible;

import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

/** 协议根加配置占位符密钥。不要在这里写 endpoint。 */
@AiProvider(baseUrl = "${OPS_MODEL_BASE_URL}", apiKey = "${OPS_MODEL_API_KEY}")
public class OpsCompatible extends OpenAICompatibleProvider {}

@AiModel(
    name = "ops-compatible-model",
    model = "example-chat-model",
    provider = OpsCompatible.class,
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    // 窗口未知就保持 0，不要填一份未核对的厂商数字。
    contextWindow = 0,
    // 演示输出上限，给智能体用时须在 1 到 32768。
    maxOutputTokens = 1024)
public class OpsCompatibleModel extends OpsCompatible.Model {
    public OpsCompatibleModel() {}
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.compatible

import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.annotation.Support
import dev.sparktide.sdk.provider.OpenAICompatibleProvider

@AiProvider(baseUrl = "\${OPS_MODEL_BASE_URL}", apiKey = "\${OPS_MODEL_API_KEY}")
class OpsCompatible : OpenAICompatibleProvider()

@AiModel(
    name = "ops-compatible-model",
    model = "example-chat-model",
    provider = OpsCompatible::class,
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
class OpsCompatibleModel : OpenAICompatibleProvider.Model()
```

:::

另一种密钥来源见[模型声明](模型声明.md)，不要和 `apiKey` 写在同一个类上。可运行应用在 `examples/0.2.0/java-ops-assistant`。

## 完整请求地址

网关路径已经包含具体接口时，用 `endpoint`，不要同时写 `baseUrl`。

::: code-group

```java [Java]
package dev.example.ops.compatible.endpoint;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

@AiProvider(endpoint = "${OPS_MODEL_ENDPOINT}", apiKey = "${OPS_MODEL_API_KEY}")
public class OpsCompatibleEndpoint extends OpenAICompatibleProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.compatible.endpoint

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAICompatibleProvider

@AiProvider(endpoint = "\${OPS_MODEL_ENDPOINT}", apiKey = "\${OPS_MODEL_API_KEY}")
class OpsCompatibleEndpoint : OpenAICompatibleProvider()
```

:::
