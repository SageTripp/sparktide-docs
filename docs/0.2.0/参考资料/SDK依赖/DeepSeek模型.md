---
title: DeepSeek 模型
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-model-deepseek/build.gradle.kts
  - sparktide-backend-sdk/sdk-model-deepseek/src/main/kotlin/dev/sparktide/sdk/provider/DeepSeekProvider.kt
---

# DeepSeek 模型

`dev.sparktide:sdk-model-deepseek:0.2.0` 提供 `DeepSeekProvider`。默认协议根是 `https://api.deepseek.com`，再拼接 `/chat/completions`。适配器把统一请求里的 `max_completion_tokens` 改写成 DeepSeek 的 `max_tokens`，并发送 `thinking.type=disabled`。

字节码目标 Java 8，传递 [OpenAI 兼容模型](./OpenAI兼容模型.md)。共享注解见 [模型声明](./模型声明.md)，传输上限见 [模型 HTTP 传输](./模型HTTP传输.md)。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-model-deepseek:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-deepseek</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

与当前 Starter 使用同一 `0.2.0`。不要再引入一份兼容模块来重复声明同一模型。

## 本适配器的参数

地址和密钥与[模型声明](./模型声明.md)相同。Provider 的 `options()` 必须保持默认的 `DefaultProviderOptions`。模型行为只有 `DeepSeekModelOptions`。

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| 默认协议根 | `https://api.deepseek.com` | `baseUrl` 与 `endpoint` 都空时使用 | 官方协议根，适配器再拼接 `/chat/completions` | 直连该默认根时留空 |
| `DeepSeekModelOptions.thinking` | false | 构造时可以写 true，但创建适配器时会以不支持失败 | 是否请求思考输出。当前平台不保留跨轮 `reasoning_content` | 保持 false。不要为了打开思考去写 true |

供应商若仍返回非空 `reasoning_content`，该次结果会被拒绝，避免静默丢掉推理内容。缺失用量保持未知。已发送请求不自动重试。转发字段与兼容页相同，只是输出上限改走 `max_tokens`。

下面的能力和 Token 数是示例里的演示声明，不是厂商规格。`example-chat-model` 换成该宿主已经核对的真实模型标识。

## 关闭思考的模型

::: code-group

```java [Java]
package dev.example.ops.deepseek;

import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.provider.DeepSeekModelOptions;
import dev.sparktide.sdk.provider.DeepSeekProvider;

/** 使用默认协议根和整段环境变量占位符；Spring 宿主也支持其自身的属性占位符规则。 */
@AiProvider(apiKey = "${DEEPSEEK_API_KEY}")
public class OpsDeepSeek extends DeepSeekProvider {}

@AiModel(
    name = "ops-deepseek-model",
    model = "example-chat-model",
    provider = OpsDeepSeek.class,
    // 未做实网核对时保持 UNKNOWN，不要照抄成 SUPPORTED。
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
public class OpsDeepSeekModel extends OpsDeepSeek.Model {
    public OpsDeepSeekModel() {}

    @Override
    public DeepSeekModelOptions options() {
        // true 要到创建适配器时才失败。值班助手保持关闭。
        return super.options().copy(false);
    }
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.deepseek

import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.annotation.Support
import dev.sparktide.sdk.provider.DeepSeekModelOptions
import dev.sparktide.sdk.provider.DeepSeekProvider

@AiProvider(apiKey = "\${DEEPSEEK_API_KEY}")
class OpsDeepSeek : DeepSeekProvider()

@AiModel(
    name = "ops-deepseek-model",
    model = "example-chat-model",
    provider = OpsDeepSeek::class,
    toolCalling = Support.UNKNOWN,
    streaming = Support.UNKNOWN,
    structuredOutput = Support.UNKNOWN,
    contextWindow = 0,
    maxOutputTokens = 1024)
class OpsDeepSeekModel : DeepSeekProvider.Model() {
    override fun options(): DeepSeekModelOptions = super.options().copy(thinking = false)
}
```

:::

不覆盖 `options()` 时，模型父类已经返回 `thinking=false`。覆盖是为了把这个字段写清楚。

## 改协议根

只在默认根不适用时写 `baseUrl`。它与 `endpoint` 的互斥规则见[模型声明](./模型声明.md)。

::: code-group

```java [Java]
package dev.example.ops.deepseek.gateway;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.DeepSeekProvider;

@AiProvider(baseUrl = "${DEEPSEEK_BASE_URL}", apiKey = "${DEEPSEEK_API_KEY}")
public class GatewayDeepSeek extends DeepSeekProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.deepseek.gateway

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.DeepSeekProvider

@AiProvider(baseUrl = "\${DEEPSEEK_BASE_URL}", apiKey = "\${DEEPSEEK_API_KEY}")
class GatewayDeepSeek : DeepSeekProvider()
```

:::
