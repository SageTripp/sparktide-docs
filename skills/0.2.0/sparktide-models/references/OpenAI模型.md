<!-- 自动生成；修改 docs/0.2.0/参考资料/SDK依赖/OpenAI模型.md 后执行 docs:skills。 -->

# OpenAI 模型

`dev.sparktide:sdk-model-openai:0.2.0` 提供 `OpenAIProvider`。默认协议根是 `https://api.openai.com/v1`，适配器再拼接 `/chat/completions`。这是官方 OpenAI Chat Completions 适配器，不表示 Responses 或其他协议。

字节码目标 Java 8。它传递 [OpenAI 兼容模型](OpenAI兼容模型.md)。地址、密钥、`@AiModel` 和 `@Agent` 的全部字段见 [模型声明](模型声明.md)。四个传输上限见 [模型 HTTP 传输](模型HTTP传输.md)。自建网关若只是一条兼容地址、又不需要组织头和项目头，改用兼容模块。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-model-openai:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-model-openai</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

与 Starter 使用同一版本。

## 完整参数

下面覆盖本适配器的全部连接、模型声明和传输参数。互斥字段用后面的替代示例演示；智能体业务配置另见[模型声明](模型声明.md)。

### 连接与凭据

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| `baseUrl` | 空 | 空，或字面协议根，或整段 `${NAME}` | 协议根。适配器再拼接自己的路径 | 覆盖官方默认根，或该提供器没有默认根时 |
| `endpoint` | 空 | 同上，且与 `baseUrl` 互斥 | 完整请求地址，原样使用，不再拼接路径 | 网关路径不符合该适配器的拼接规则时 |
| `apiKey` | 空 | 空，或整段 `${NAME}`。字面密钥会进 class 文件 | 调用时解析的供应商密钥 | 密钥放在宿主配置时 |
| `apiKeyEnv` | 空 | 空，或 `[A-Za-z_][A-Za-z0-9_]{0,127}`，且与 `apiKey` 互斥 | 环境变量名 | 密钥只存在于环境变量时 |
| `apiKey()` | 返回 null | 与上面两种注解来源合计只留一种 | 每次调用读取密钥的 `Supplier` | 密钥要轮换，或来自自有密钥服务时 |

`baseUrl` 与 `endpoint` 互斥；同层只选一个密钥来源。地址在绑定时解析，密钥在实际调用时读取。默认系统解析器只支持整段 `${NAME}`，Spring Starter 使用 Spring 占位符规则。

### 模型声明

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| `model` | 必填 | 非空白，最长 128。不解析 `${}`，不推断能力 | 供应商模型标识 | 每个模型类。换成该环境已经核对过的真实标识 |
| `name` | 空 | 空则由简单类名转成小写连字符名。最终须匹配 `[a-z][a-z0-9-]{0,63}` | 平台资源名 | 想要稳定名字，或类名转换结果不合法时 |
| `provider` | `DefaultModelProvider` | 一个 Provider 类 | 使用哪个配置类上的地址、密钥和 `options()` | 配置写在子类上时必须指向该子类。省略时用模型父类自带的官方提供器，不会自动选中外层子类 |
| `toolCalling` | `UNKNOWN` | `UNKNOWN`、`SUPPORTED`、`UNSUPPORTED` | 工具调用能力声明 | 该环境核对之后再改。`UNKNOWN` 不能当成已支持 |
| `streaming` | `UNKNOWN` | 同上 | 流式能力声明 | 同上 |
| `structuredOutput` | `UNKNOWN` | 同上 | 结构化输出声明 | 同上 |
| `contextWindow` | 0 | 0 到 10000000。大于 0 时，`maxOutputTokens` 不能超过它 | 上下文窗口声明。0 表示未知，不写入能力 | 只填写本环境核对后的真实值 |
| `maxOutputTokens` | 0 | 0 到 10000000，且不能超过已填写的窗口。经 `@Agent` 写入运行配置时，`ModelProfile` 只接受 1 到 32768 | 输出上限声明。0 表示未知，不写入运行配置 | 智能体要限制回答长度时，写 1 到 32768 内的业务上限 |

能力应根据实际模型核验，不能从模型名称推断。

### HTTP 传输

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| `connectTimeoutMillis` | 10000 | 1 到 60000，单位毫秒 | 建立连接的上限 | 受控网关应当更快失败时调小 |
| `readTimeoutMillis` | 30000 | 1 到 60000，单位毫秒 | 相邻两次读取的上限 | 流式回答间隙较长时再加大，仍受本次调用的绝对截止时间限制 |
| `maxConcurrentCalls` | 4 | 1 到 32 | 每个模型适配器实例同时执行的模型调用数。连接池总连接和每路由连接也用这个数 | 账号并发额度较小时调小 |
| `maxQueuedCalls` | 16 | 1 到 256 | 工作线程都忙时还能排队的调用数 | 短时突发多于这个数时应尽快拒绝，而不是无界等待 |

### OpenAI 请求头


连接、密钥和模型声明与[模型声明](模型声明.md)相同。本模块额外只有 Provider 上的 `OpenAIOptions`。模型类不要覆盖 `options()`：创建适配器时要求模型选项仍是默认的 `DefaultModelOptions`。

| 参数 | 默认 | 范围 | 含义 | 何时用 |
| --- | --- | --- | --- | --- |
| 默认协议根 | `https://api.openai.com/v1` | `baseUrl` 与 `endpoint` 都空时使用 | 官方 Chat Completions 协议根 | 直连官方地址时两个地址都留空 |
| `OpenAIOptions.organization` | null | null，或 1 到 128 位字母、数字、下划线、连字符 | 请求头 `OpenAI-Organization`。null 不发送 | 账号要求组织头时，在 Provider 的 `options()` 里设置 |
| `OpenAIOptions.project` | null | 与组织相同，可同时设置 | 请求头 `OpenAI-Project`。null 不发送 | 账号要求项目头时 |

组织和项目可以同时设置。它们不是 API Key，不会按 `${}` 解析，也不要写进 `@AiProvider`。空字符串通不过格式校验，缺省时传 null。标识从环境变量读入，避免把账号标识写死在源码里；变量缺失就省略对应请求头。

官方适配器转发的正文见兼容页的允许列表。这里没有温度、惩罚项或价格注解。示例中的能力和 Token 数是值班声明，不是厂商规格。`example-chat-model` 换成该宿主已经核对、账号里实际存在的模型标识。

## 巡检记录交接助手

示例将用户提供的巡检记录整理成可复核的交接摘要，不依赖未实现的工具或知识 Bean。连接真实业务服务见完整示例（配套文档：/0.2.0/开发接入/完整示例.md）。Java 的每个 public 顶层类分别保存到同名文件。

这一组同时使用网关协议根、配置占位符密钥、组织头、项目头、四个传输上限，以及全部 `@AiModel` 字段。`endpoint` 和其他密钥来源在后面的代码组里。

::: code-group

```java [Java]
package dev.example.ops.openai;

import dev.sparktide.sdk.annotation.Agent;
import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.model.HttpTransportOptions;
import dev.sparktide.sdk.provider.OpenAIOptions;
import dev.sparktide.sdk.provider.OpenAIProvider;

/**
 * 值班知识助手的官方适配器。
 * baseUrl 与 apiKey 可以同时使用；不要在这个注解里再写 endpoint 或 apiKeyEnv。
 */
@AiProvider(baseUrl = "${OPS_OPENAI_BASE_URL}", apiKey = "${OPENAI_API_KEY}")
public class OpsKnowledgeOpenAI extends OpenAIProvider {
    @Override
    public OpenAIOptions options() {
        // 两个头都可以同时发送。格式不符会在绑定 Provider 时拒绝。
        return super.options().copy(headerId("OPENAI_ORGANIZATION"), headerId("OPENAI_PROJECT"));
    }

    /** 环境变量缺省或空字符串时返回 null，对应请求头省略。 */
    private static String headerId(String variable) {
        String value = System.getenv(variable);
        return value == null || value.isEmpty() ? null : value;
    }

    @Override
    protected HttpTransportOptions httpOptions() {
        // 顺序：连接毫秒、读取毫秒、并发数、排队数。范围见模型 HTTP 传输。
        return super.httpOptions().copy(5_000, 20_000, 2, 8);
    }
}

@AiModel(
    // 平台资源名，最长 64，小写字母开头，可含数字和连字符。
    name = "ops-knowledge-model",
    // 换成已核对的真实模型标识。本字段不解析占位符，也不推断能力或价格。
    model = "example-chat-model",
    // 必须指向子类，否则地址、密钥、组织头和传输覆写都不会用上。
    provider = OpsKnowledgeOpenAI.class,
    // 演示声明：本环境核对过工具调用。没核对就保持 UNKNOWN。
    toolCalling = Support.SUPPORTED,
    // 演示声明：本环境核对过流式输出。
    streaming = Support.SUPPORTED,
    // 结构化输出尚未核对。
    structuredOutput = Support.UNKNOWN,
    // 演示窗口，不是厂商规格。0 表示未知；大于 0 时输出上限不能超过它。
    contextWindow = 8192,
    // 演示输出上限。交给 @Agent 时须在 1 到 32768 内。
    maxOutputTokens = 1024)
public class OpsKnowledgeModel extends OpsKnowledgeOpenAI.Model {
    /** 没有 Spring Bean 时使用公开无参构造。不要在模型上覆盖 options()。 */
    public OpsKnowledgeModel() {}
}

@Agent(
    name = "ops-knowledge",
    instructions = "根据用户提供的巡检记录整理交接摘要，分别列出异常、已完成处置与待确认事项；不要推测设备状态，不编造停机窗口或价格。",
    model = {OpsKnowledgeModel.class},
    // 本例只整理输入记录，不启用业务工具。其余额度见模型声明。
    maxToolCalls = 0,
    timeoutSeconds = 90,
    // 输入记录与输出的字符预算示例，不是供应商 Token。
    maxBudgetUnits = 32000)
public class OpsKnowledgeAssistant {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.openai

import dev.sparktide.sdk.annotation.Agent
import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.annotation.Support
import dev.sparktide.sdk.model.HttpTransportOptions
import dev.sparktide.sdk.provider.OpenAIOptions
import dev.sparktide.sdk.provider.OpenAIProvider

// 协议根追加 /chat/completions；密钥由宿主解析。不能同时写 endpoint / apiKeyEnv。
@AiProvider(baseUrl = "\${OPS_OPENAI_BASE_URL}", apiKey = "\${OPENAI_API_KEY}")
class OpsKnowledgeOpenAI : OpenAIProvider() {
    override fun options(): OpenAIOptions {
        // 组织头；未设置时省略，格式限制见参数表。
        val organization = System.getenv("OPENAI_ORGANIZATION")?.takeIf { it.isNotEmpty() }
        // 项目头，与组织头可同时设置；不属于模型正文。
        val project = System.getenv("OPENAI_PROJECT")?.takeIf { it.isNotEmpty() }
        return super.options().copy(organization = organization, project = project)
    }

    override fun httpOptions(): HttpTransportOptions = super.httpOptions().copy(
        // 建立连接上限，毫秒。
        connectTimeoutMillis = 5_000,
        // 相邻读取上限，仍受绝对截止时间约束。
        readTimeoutMillis = 20_000,
        // 每个模型适配器实例的最大并发数。
        maxConcurrentCalls = 2,
        // 并发满后最多排队的调用数。
        maxQueuedCalls = 8)
}

@AiModel(
    // 稳定的平台资源名，不是供应商模型标识。
    name = "ops-knowledge-model",
    // 换成账号真实可用的模型标识，不支持占位符。
    model = "example-chat-model",
    // 显式绑定带连接和选项覆写的 Provider 子类。
    provider = OpsKnowledgeOpenAI::class,
    // 演示能力声明，未验证应保持 UNKNOWN。
    toolCalling = Support.SUPPORTED,
    // 演示流式能力，须另行验证真实服务。
    streaming = Support.SUPPORTED,
    // 尚未核对结构化输出能力。
    structuredOutput = Support.UNKNOWN,
    // 演示窗口，并非厂商规格；0 表示未知。
    contextWindow = 8192,
    // 不超过已声明窗口；用于 @Agent 时须在 1..32768。
    maxOutputTokens = 1024)
class OpsKnowledgeModel : OpenAIProvider.Model()

@Agent(
    name = "ops-knowledge",
    instructions = "根据用户提供的巡检记录整理交接摘要，分别列出异常、已完成处置与待确认事项；不要推测设备状态，不编造停机窗口或价格。",
    model = [OpsKnowledgeModel::class],
    // 本例没有外部工具，只整理用户输入。
    maxToolCalls = 0,
    // 单次运行期限，秒。
    timeoutSeconds = 90,
    // 字符处理预算，不是 Token 数或费用。
    maxBudgetUnits = 32_000)
class OpsKnowledgeAssistant
```

:::

`OPS_OPENAI_BASE_URL` 解析后的整段地址须是 `http` 或 `https` 协议根，不能以 `/chat/completions` 结尾。直连官方接口时删掉 `baseUrl`，默认根就是 `https://api.openai.com/v1`。

## 官方默认根

两个地址都留空才使用默认根。密钥仍然用占位符。

::: code-group

```java [Java]
package dev.example.ops.openai.official;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAIProvider;

@AiProvider(apiKey = "${OPENAI_API_KEY}")
public class OfficialOpenAI extends OpenAIProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.openai.official

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAIProvider

@AiProvider(apiKey = "\${OPENAI_API_KEY}")
class OfficialOpenAI : OpenAIProvider()
```

:::

## 完整请求地址

与 `baseUrl` 互斥。SDK 原样请求该地址，不再拼接 `/chat/completions`。

::: code-group

```java [Java]
package dev.example.ops.openai.endpoint;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAIProvider;

@AiProvider(endpoint = "${OPS_OPENAI_ENDPOINT}", apiKey = "${OPENAI_API_KEY}")
public class EndpointOpenAI extends OpenAIProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.openai.endpoint

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAIProvider

@AiProvider(endpoint = "\${OPS_OPENAI_ENDPOINT}", apiKey = "\${OPENAI_API_KEY}")
class EndpointOpenAI : OpenAIProvider()
```

:::

## 环境变量密钥

`apiKeyEnv` 写变量名。不要同时写 `apiKey`。

::: code-group

```java [Java]
package dev.example.ops.openai.envkey;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAIProvider;

@AiProvider(apiKeyEnv = "OPENAI_API_KEY")
public class EnvKeyOpenAI extends OpenAIProvider {}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.openai.envkey

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAIProvider

@AiProvider(apiKeyEnv = "OPENAI_API_KEY")
class EnvKeyOpenAI : OpenAIProvider()
```

:::

## 调用时读取密钥

同一个类上不要再写 `apiKey` 或 `apiKeyEnv`。地址可以继续用 `baseUrl`。

::: code-group

```java [Java]
package dev.example.ops.openai.rotating;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAIProvider;
import java.util.function.Supplier;

@AiProvider(baseUrl = "${OPS_OPENAI_BASE_URL}")
public class RotatingKeyOpenAI extends OpenAIProvider {
    @Override
    protected Supplier<String> apiKey() {
        return () -> {
            String key = System.getenv("OPENAI_API_KEY");
            return key == null ? "" : key;
        };
    }
}
```

```kotlin [Kotlin]
package dev.example.ops.kotlin.openai.rotating

import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAIProvider
import java.util.function.Supplier

@AiProvider(baseUrl = "\${OPS_OPENAI_BASE_URL}")
class RotatingKeyOpenAI : OpenAIProvider() {
    override fun apiKey(): Supplier<String> = Supplier {
        System.getenv("OPENAI_API_KEY").orEmpty()
    }
}
```

:::
