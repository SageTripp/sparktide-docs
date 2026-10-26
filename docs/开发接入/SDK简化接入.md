---
title: "SDK 接入步骤"
productVersion: "开发候选；公开 0.1.0 不含新 API"
updated: "2026-10-26"
status: "本轮本机隔离候选验收完成；公共发行与生产容量另记"
owner: "SparkTide 维护者"
source: "双 SDK 类型化声明、BusinessAuthenticationRelay、AiClient 与 ChatStore"
---

<span id="sdk-接入-注解声明与现有业务认证"></span>

# SDK 接入步骤

在现有业务工程中完成六步：选择依赖、声明助手、连接业务能力、复用登录、创建前端客户端，最后验证完整调用链。平台与双 SDK 的分工见[接入规划](接入流程.md)。

::: warning 这条路线需要配套内部候选
后台使用 **`0.1.1-auth.20261023-6`**，前端使用同轮候选 tgz，平台需要支持 `business-auth/1.0`。这些构件由维护者提供，**尚未公开发行**。公开 0.1.0 不含本页 API；只有公开下载包时，请走[固定版本教程](../教程/README.md)。
:::

## 开始前

准备好已有业务工程、登录方式、平台应用与接入信息，以及实际模型服务。以下是接入片段，不是独立可运行工程：`OrderService`、登录状态和业务 DTO 均来自你的项目。

| 你需要准备 | 用在哪里 |
| --- | --- |
| 配套平台、应用范围与授权 | 后台连接和能力注册 |
| 模型地址、标识与服务端密钥 | Provider / Model 声明 |
| 原有登录与可信用户主体 | 业务身份、租户与权限 |
| 业务 API 前缀与允许来源 | 前端客户端及网关 |

不要先重建 SSE、回调服务或权限系统。先接通聊天闭环，再逐项增加工具、知识和卡片。

## 1. 安装按需依赖

根据宿主选择一套 Starter，再加入需要的模型适配器：

| 宿主 | Starter |
| --- | --- |
| Java 17 / Spring Boot 4 | `sdk-spring-boot-starter` |
| Java 8 / Spring Boot 2.6.6 | `sdk-spring-boot2-starter` |

模块 group 均为 `dev.sparktide`。模型适配器按需选择 `sdk-model-deepseek`、`sdk-model-opencode-go`、`sdk-model-openai`、`sdk-model-openai-compatible` 或 `sdk-model-ollama`，不要混装两套核心。安装配置见[后台 SDK](业务后台SDK.md#安装)。

SDK 生产实现使用 Kotlin，Java 业务可以调用公开 API。Boot 2 / Maven 的父 BOM 可能覆盖传递依赖：需将 `kotlin.version` 统一为 **2.3.20**，核对 stdlib、reflect 及旧 jdk7/jdk8 拆分包依赖树。编译成功后仍需运行验证。

## 2. 按配置归属声明

| 配置组 | 内容 |
| --- | --- |
| Provider | 连接地址、供应商 API Key、HTTP/账户选项 |
| Model | 模型标识、能力、上下文/输出限制、推理选项、Provider 类引用 |
| Agent | 提示词、模型类数组、工具/知识/委派类型、入口权限、运行预算 |
| YAML | 平台地址、应用和接入凭据、回调与部署对接信息 |

以下三个 Java public 类分别放在同名文件，并位于业务 Spring Boot 扫描包中。示例使用 OpenAI 兼容适配器；模型名和能力声明须按实际供应商验证。

```java
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

@AiProvider(baseUrl = "${business.ai.base-url}", apiKey = "${business.ai.api-key}")
public class BusinessProvider extends OpenAICompatibleProvider {}
```

```java
import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.annotation.Support;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

@AiModel(model = "your-model-id", provider = BusinessProvider.class,
    streaming = Support.SUPPORTED, toolCalling = Support.SUPPORTED)
public class BusinessModel extends OpenAICompatibleProvider.Model {}
```

```java
import dev.sparktide.sdk.annotation.Agent;

@Agent(name = "business-assistant", instructions = "classpath:ai/assistant.md",
    model = {BusinessModel.class}, tools = {BusinessTools.class},
    defaultAgent = true, permissions = {"ai:read"})
public class BusinessAssistant {}
```

Kotlin 对应的三个类型：

```kotlin
@AiProvider(baseUrl = "\${business.ai.base-url}", apiKey = "\${business.ai.api-key}")
class BusinessProvider : OpenAICompatibleProvider()

@AiModel(model = "your-model-id", provider = BusinessProvider::class,
    streaming = Support.SUPPORTED, toolCalling = Support.SUPPORTED)
class BusinessModel : OpenAICompatibleProvider.Model()

@Agent(name = "business-assistant", instructions = "classpath:ai/assistant.md",
    model = [BusinessModel::class], tools = [BusinessTools::class],
    defaultAgent = true, permissions = ["ai:read"])
class BusinessAssistant
```

这三个声明分别描述连接、模型和助手。密钥放 Provider 的服务端配置；Model 引用配置过的 Provider 类型；Agent 引用允许使用的模型与业务能力。示例中的 `BusinessTools` 在下一步定义。

<details>
<summary>模型配置与适配器的边界</summary>

Provider 的 baseUrl 是协议基础地址，endpoint 是完整请求地址，互斥。apiKey 支持直接字符串与宿主配置占位符，apiKeyEnv 支持环境变量，也可覆盖 Provider 的 apiKey() 接入已有密钥服务；同一层只选一个来源。直接真实字符串会进入 class 文件。供应商特有连接与推理选项分别通过强类型 ProviderOptions / ModelOptions 扩展，不混装成无约束参数表。

Model 父类选择适配器协议；配置过的 Provider 用类引用明确关联。Java 静态嵌套 BusinessProvider.Model 不会自动绑定外层子类配置。Model 不再放 API Key 或 HTTP 连接参数。多个模型使用类型数组，首项为主模型，其余为显式候选，不意味着工具自动重试。knowledge 引用已有知识 Bean 类型，delegates 引用其他 Agent 类型；缺 Bean、重复名称或循环委派在启动时拒绝。

内置适配器包含 DeepSeek、OpenCode Go、OpenAI、OpenAI 兼容与 Ollama，按独立依赖选择。DeepSeek 业务模型继承 `DeepSeekProvider.Model`，配置过的 Provider 继承 `DeepSeekProvider`；供应商密钥仍配置在 Provider，`DeepSeekModelOptions` 属于模型。SDK 默认关闭思考并封装 `max_tokens` 与 `thinking` 参数差异；当前显式启用思考返回 `UNSUPPORTED`。见[适配器依赖与示例](业务后台SDK.md#选择模型适配器)。

</details>

## 3. 只实现业务工具与知识

```java
import dev.sparktide.sdk.Tool;
import dev.sparktide.sdk.ToolContext;
import org.springframework.stereotype.Component;

@Component
public class BusinessTools {
    private final OrderService orders; // 业务已有服务
    public BusinessTools(OrderService orders) { this.orders = orders; }

    @Tool(name = "orders.status", description = "查询当前用户的订单状态")
    public String status(ToolContext context) {
        // 已重新经过原认证链；原业务服务继续判断数据权限。
        return orders.currentStatus();
    }
}
```

知识方法用 @Knowledge 和 KnowledgeContext 调用已有检索服务。需要转调旧业务 HTTP 服务时，使用 `context.authentication().header("token")`；`context.authentication().token()` 只返回 Authorization 中的 Bearer token，其它认证方式返回 null。访问器随执行结束失效，已经复制的字符串无法收回，不得缓存、记录或返回认证值。

## 4. 连接平台并复用现有登录

```yaml
sparktide:
  application: orders
  platform:
    url: ${SPARKTIDE_URL}
    credential: ${SPARKTIDE_APP_CREDENTIAL}
  http:
    path: /api/ai
  callbacks:
    url: ${BUSINESS_CALLBACK_URL}
    credential: ${BUSINESS_CALLBACK_CREDENTIAL}
    secret-reference: ${BUSINESS_CALLBACK_SECRET_REF}
  deployment:
    mode: development
    version: 1.0.0
```

平台一次性授权后台身份委托范围。原业务认证先产生可信 Principal，SDK 缺省把 Principal.name 映射为无租户用户，无需再实现认证设施。自定义用户对象或租户只提供 `BusinessPrincipalMapper` 字段映射，输入来自原 Shiro/Spring Security/Servlet 已认证主体；不再编写独立 IdentityResolver、登录校验或权限协议回调。

自定义映射只负责读取**原认证已经验证**的用户和租户字段，不重新校验登录，也不信任前端传入的身份。接口和配置说明见[后台身份配置](业务后台SDK.md#配置与身份)。

Starter 自动注册 SDK 路径的精确 Origin/CORS、URL 凭据拒绝、原认证捕获、回调重认证和错误响应。默认权限回调在同一原认证主体上调用 Shiro `isPermitted`、Spring Security authorities 或容器角色，不查询业务表、不推断数据范围。Agent/Tool/Knowledge 声明使用业务已有权限名。业务查询继续经原 Service 和数据权限入口，不再复制角色 SQL 或为 AI 单建 scope/read 层。特殊资源授权可以扩展既有 PermissionProvider，但常规接入无需手写它。

同源默认无需配置来源。跨源部署才在 `sparktide.chat.security.allowed-origins` 声明完整来源，跨域 Cookie 才开启 `allow-credentials` 并沿用原 CSRF。SDK 防止下游全局 CORS 覆盖其响应；普通业务 API 继续原有安全策略。宿主过滤器如果会改写 JSON，可用 `SdkHttpRequest.isManaged(request)` 让 SDK 协议请求保持原文。此标记只由服务端设置，不接受客户端头或 Context，也不授予认证或数据权限。

<details>
<summary>认证传递、撤销与取消的边界</summary>

SDK 在 MVC 执行前捕获白名单认证头，封装短期加密胶囊；平台在独立私有表绑定运行。工具、知识和业务权限回调经固定本机 Servlet HTTP 桥重新执行原 Spring Security、Shiro 或容器认证，核对主体与期限后才调用业务方法。注销、撤销和过期会拒绝后续回调，已完成幂等结果重放也先认证。取消是协作式的，不能强制终止已经开始的同步业务事务，业务仍需管理自己的事务边界。

认证头白名单与寿命属于 sparktide.authentication，默认 600 秒、上限 3600 秒，不延长原登录。Cookie 写请求复用现有 CSRF token；无该设施时要求同源 Origin 与 SDK 自动添加的 X-Requested-With。原生 Servlet TLS 继续使用标准证书及 localhost 主机名验证；桥不可用时失败关闭。token 不进入普通 context、模型、工具参数、组件 props、事件、历史或日志。

</details>

## 5. 前端只创建一个客户端

```ts
import {createClient} from '@sparktide/frontend-sdk';
export const ai = createClient({
  baseUrl: '/api/ai',
  auth: {
    type: 'bearer',
    token: () => loginStore.token,
    identityKey: () => loginStore.sessionRevision
  }
});
```

loginStore 使用业务原有登录状态。identityKey 是非秘密的主体/租户/登录代次，注销返回 null；仅 token 续期保持不变。SDK 每次请求和 SSE 重连读取最新认证，切换身份清理本地会话、引用和迟到响应。关闭本地连接不取消后台运行。

Cookie 使用 `auth: {type: 'cookie', csrfToken, identityKey}`；自定义头使用 `auth: {type: 'headers', headers: () => ({token: loginStore.token}), identityKey}`。认证只有 auth 一个入口，普通 context 仅放业务数据。见[前端 SDK](前端SDK.md)。

React / Vue 3 的 useChat(options) 和 ChatPanel 使用同一 ChatStore；Vue 2 从独立 `/vue2` 入口使用插件、面板或 createChatMixin。无框架使用 `ai.createChat({agent: 'business-assistant'})`，管理能力从 `/platform` 导入。见[框架接入](React与Vue.md)。

## 6. UI、发布与验收

前端通过 `defineAiComponent` 在一处声明组件名、精确版本、props、Renderer 和 fallback，运行时携带支持的组件版本。后台工具只引用同名同版本，并返回已有业务结果 DTO：

```java
@Tool(name = "orders.summary", description = "查询订单摘要")
@RenderWith(value = "business.order-summary", version = "1.1.0", fallback = "请查看文字中的订单摘要。")
public OrderSummary summary(OrderQuery input) {
    return orders.summary(input.id()); // 业务已有 DTO 与授权 Service
}
```

SDK 从工具返回类型生成服务端结果校验合同并注册组件引用。常规工具结果卡片不要求业务再定义后端 props Schema、`UiCatalog` Bean 或 `ai/ui-catalog.json`，也不要求 `autoSelectUi=true`。上面的 `1.1.0` 是该组件示例的版本，前后端需要使用同名同版本，不是 SDK 版本。

前端组件声明负责 props、Renderer 和 fallback，后端 DTO 负责业务结果。版本不支持或渲染失败时回退为文字，模型不能提供任意可执行界面代码。完整说明见[前端组件与校验](前端SDK.md#卡片无需复制目录到后端)和[框架组件](React与Vue.md#组件与错误)。

### 先验证闭环，再发布

开发模式显式同步草稿；生产只核验已经发布的定义，发布作业独立执行。开始验收时，至少确认：

- 原业务登录用户可以发送消息，事件持续到达，刷新后能恢复同一会话。
- 工具调用原业务 Service，结果仍受用户、租户和数据权限约束。
- 注销、过期或切换身份后，不泄露旧会话、引用或迟到响应。
- 取消、重复写入与失败重试符合业务事务和幂等要求。
- 卡片有文字回退，来源预览重新校验权限。

详细分工和清单见[联合验收](接入流程.md#平台与验收)。候选构建、实网与浏览器验证的历史证据集中保留在[版本说明](../产品支持/版本说明.md#基础设施下沉与业务服务复用)，不作为你当前业务或生产环境已经验收的结论。

### 从旧 API 迁移

成套更新平台和双 SDK，再按新职责移除业务手写的模型 HTTP/SSE、注册图、回调服务及旧 `createChatClient` / hook overload。恢复旧构件也要成套回退，不混用两代状态 API，不重放未知工具副作用。

## 下一步

- 加入业务能力：[工具](../使用指南/业务工具.md)、[知识](../使用指南/知识库.md)与[能力总览](../使用指南/README.md)。
- 查询方法和配置：[后台 SDK](业务后台SDK.md)、[前端 SDK](前端SDK.md)。
- 准备正式运行：[部署底座与上线](../部署运维/README.md)。
