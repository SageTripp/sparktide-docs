---
title: 模型 HTTP 传输
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-model-http/build.gradle.kts
  - sparktide-backend-sdk/sdk-model-http/src/main/kotlin/dev/sparktide/sdk/model/http/HttpModelAdapter.kt
  - sparktide-backend-sdk/sdk-model-spi/src/main/kotlin/dev/sparktide/sdk/model/ProviderSettings.kt
  - sparktide-backend-sdk/sdk-model-spi/src/main/kotlin/dev/sparktide/sdk/model/ModelAdapter.kt
---

# 模型 HTTP 传输

`dev.sparktide:sdk-model-http:0.2.0` 是模型适配器共用的 HTTP 基类，字节码目标 Java 8。公开类型是 `HttpModelAdapter`。官方供应商模块已经传递它。业务声明 Provider 和模型时不要直接依赖本坐标。

只有在编写另一套 HTTP 供应商适配器、需要继承 `HttpModelAdapter` 时才加入，并与核心使用同一版本 `0.2.0`。制品尚未发布到 Maven Central。传输限制按模型适配器实例生效，并非整个应用的全局配额。四个传输上限写在 Provider 的 `httpOptions()` 上，这个方法来自 `sdk-model-spi` 的 `ProviderDefinition`，随所选供应商模块传递。

## 安装与配套

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-model-http:0.2.0")
    implementation("dev.sparktide:sdk-model-spi:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-http</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

它 `api` 依赖 `sdk-model-spi`，并使用 HttpClient `4.5.14`。不要把它当成聊天入口；聊天入口在 Starter。地址、密钥和智能体额度见 [模型声明](./模型声明.md)。

## HttpTransportOptions

子类覆盖 `httpOptions()`，并用 `super.httpOptions().copy(...)` 只改需要的项。四个字段会在 Provider 绑定到模型时读取。任一字段越界会在此时拒绝。

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| `connectTimeoutMillis` | 10000 | 1 到 60000，单位毫秒 | 建立连接的上限 | 受控网关应当更快失败时调小 |
| `readTimeoutMillis` | 30000 | 1 到 60000，单位毫秒 | 相邻两次读取的上限 | 流式回答间隙较长时再加大，仍受本次调用的绝对截止时间限制 |
| `maxConcurrentCalls` | 4 | 1 到 32 | 每个模型适配器实例同时执行的模型调用数。连接池总连接和每路由连接也用这个数 | 账号并发额度较小时调小 |
| `maxQueuedCalls` | 16 | 1 到 256 | 工作线程都忙时还能排队的调用数 | 短时突发多于这个数时应尽快拒绝，而不是无界等待 |

实际连接超时和读取超时取「配置值」和「距离本次调用截止还剩的时间」中的较小者。从连接池取连接的等待使用剩余截止时间，没有第五个超时参数。队列或线程已满时该次调用失败，错误类别为限流。已发送的请求不自动重试，也不跟随重定向。

密钥非空时，传输层添加 `Authorization: Bearer`。业务代码不要自己拼这个头。Ollama 可以在没有密钥时省略它，见 [Ollama 模型](./Ollama模型.md)。

DNS 固定使用两个解析线程和十六个排队位置，取消时不等待系统 DNS 返回。这不是 `HttpTransportOptions` 的字段。自定义适配器可以覆盖受保护的地址解析方法，业务声明不需要覆盖它。

构造适配器时的 `provider`、`settings`、`services` 分别是连接与传输、模型标识和能力、平台提供的模型辅助服务。`services` 不含业务 token。这些是适配器构造参数，不是 `@AiProvider` 字段。

## 覆写示例

值班网关希望连接在 5 秒内失败，相邻读取不超过 20 秒，同时只打两路，再允许 8 个调用排队。模型类仍按 [模型声明](./模型声明.md) 编写，并把 `provider` 指向这个子类，否则覆写不会生效。

Java 的 `copy` 参数顺序是 `connectTimeoutMillis`、`readTimeoutMillis`、`maxConcurrentCalls`、`maxQueuedCalls`。

::: code-group

```java [Java]
package dev.example.ops.http;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.model.HttpTransportOptions;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

@AiProvider(baseUrl = "${OPS_MODEL_BASE_URL}", apiKey = "${OPS_MODEL_API_KEY}")
public class BoundedOpsProvider extends OpenAICompatibleProvider {
    @Override
    protected HttpTransportOptions httpOptions() {
        // 5 秒连接、20 秒读间隔、2 路并发、8 个排队。
        // 剩余截止时间更短时，连接和读取还会被再截短。
        return super.httpOptions().copy(5_000, 20_000, 2, 8);
    }
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.http

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.model.HttpTransportOptions
import dev.sparktide.sdk.provider.OpenAICompatibleProvider

@AiProvider(baseUrl = "\${OPS_MODEL_BASE_URL}", apiKey = "\${OPS_MODEL_API_KEY}")
class BoundedOpsProvider : OpenAICompatibleProvider() {
    override fun httpOptions(): HttpTransportOptions = super.httpOptions().copy(
        connectTimeoutMillis = 5_000,
        readTimeoutMillis = 20_000,
        maxConcurrentCalls = 2,
        maxQueuedCalls = 8)
}
```

:::

选择现成供应商时使用对应章节，例如 [OpenAI 兼容模型](./OpenAI兼容模型.md) 或 [Ollama 模型](./Ollama模型.md)。那些适配器已经继承这里的传输。
