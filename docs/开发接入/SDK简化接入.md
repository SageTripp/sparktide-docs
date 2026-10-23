---
title: "SDK 接入：注解声明与现有业务认证"
productVersion: "开发候选；公开 0.1.0 不含新 API"
updated: "2026-10-23"
status: "本轮本机隔离候选验收完成；公共发行与生产容量另记"
owner: "SparkTide 维护者"
source: "双 SDK 类型化声明、BusinessAuthenticationRelay、AiClient 与 ChatStore"
---

# SDK 接入：注解声明与现有业务认证

后台声明 Provider、Model、Agent 和业务工具，前端创建一个客户端，再放入聊天面板。SDK 负责模型协议、依赖注册、认证传递、回调和事件恢复；业务保留已有登录、授权、事务与数据权限。

::: warning 版本边界
本页为本轮已实现的开发候选 API。后台验证候选 `0.1.1-auth.20261023-6` 只在内部隔离 Maven 文件仓库提供；前端使用同轮打包的候选 tgz。必须配套支持 business-auth/1.0 的平台。公开 0.1.0 不含这些 API，尚未发布新的公共版本；旧固定版本下载示例见[连续教程](../教程/README.md)。
:::

## 1. 安装按需依赖

SDK 生产实现使用 Kotlin，Java 业务可直接调用公开 API。Java 17 / Boot 4 使用 sdk-spring-boot-starter；Java 8 / Boot 2.6.6 使用 sdk-spring-boot2-starter。同一应用只选一套核心。模型适配器独立加入 sdk-model-deepseek、sdk-model-opencode-go、sdk-model-openai、sdk-model-openai-compatible 或 sdk-model-ollama，group 均为 dev.sparktide。

Boot 2 / Maven 的父 BOM 可能覆盖传递依赖，需将 kotlin.version 统一到 **2.3.20**，核对 stdlib、reflect 及旧 jdk7/jdk8 拆分包依赖树。编译成功不能代替运行验证。配置与安装见[后台 SDK](业务后台SDK.md)。

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

Provider 的 baseUrl 是协议基础地址，endpoint 是完整请求地址，互斥。apiKey 支持直接字符串与宿主配置占位符，apiKeyEnv 支持环境变量，也可覆盖 Provider 的 apiKey() 接入已有密钥服务；同一层只选一个来源。直接真实字符串会进入 class 文件。供应商特有连接与推理选项分别通过强类型 ProviderOptions / ModelOptions 扩展，不混装成无约束参数表。

Model 父类选择适配器协议；配置过的 Provider 用类引用明确关联。Java 静态嵌套 BusinessProvider.Model 不会自动绑定外层子类配置。Model 不再放 API Key 或 HTTP 连接参数。多个模型使用类型数组，首项为主模型，其余为显式候选，不意味着工具自动重试。knowledge 引用已有知识 Bean 类型，delegates 引用其他 Agent 类型；缺 Bean、重复名称或循环委派在启动时拒绝。

内置适配器包含 DeepSeek、OpenCode Go、OpenAI、OpenAI 兼容与 Ollama，按独立依赖选择。DeepSeek 业务模型继承 `DeepSeekProvider.Model`，配置过的 Provider 继承 `DeepSeekProvider`；供应商密钥仍配置在 Provider，`DeepSeekModelOptions` 属于模型。SDK 默认关闭思考并封装 `max_tokens` 与 `thinking` 参数差异；当前显式启用思考返回 `UNSUPPORTED`。见[适配器依赖与示例](业务后台SDK.md#选择模型适配器)。

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

例如在原有安全配置中加入以下 Bean。`SysUserVO` 是 safeOps 原业务用户类型，租户值使用该系统原有部署边界；多租户业务应映射原主体中已验证的租户字段。

```java
import dev.sparktide.sdk.UserIdentity;
import dev.sparktide.sdk.spring.BusinessPrincipalMapper;
import com.zmd.modules.sys.pojo.vo.SysUserVO;
import org.springframework.context.annotation.Bean;

@Bean
BusinessPrincipalMapper sparkTideUserMapping() {
    return principal -> UserIdentity.of(((SysUserVO) principal).getId(), "safeops-it");
}
```

Starter 自动注册 SDK 路径的精确 Origin/CORS、URL 凭据拒绝、原认证捕获、回调重认证和错误响应。默认权限回调在同一原认证主体上调用 Shiro `isPermitted`、Spring Security authorities 或容器角色，不查询业务表、不推断数据范围。Agent/Tool/Knowledge 声明使用业务已有权限名。业务查询继续经原 Service 和数据权限入口，不再复制角色 SQL 或为 AI 单建 scope/read 层。特殊资源授权可以扩展既有 PermissionProvider，但常规接入无需手写它。

同源默认无需配置来源。跨源部署才在 `sparktide.chat.security.allowed-origins` 声明完整来源，跨域 Cookie 才开启 `allow-credentials` 并沿用原 CSRF。SDK 防止下游全局 CORS 覆盖其响应；普通业务 API 继续原有安全策略。宿主过滤器如果会改写 JSON，可用 `SdkHttpRequest.isManaged(request)` 让 SDK 协议请求保持原文。此标记只由服务端设置，不接受客户端头或 Context，也不授予认证或数据权限。

SDK 在 MVC 执行前捕获白名单认证头，封装短期加密胶囊；平台在独立私有表绑定运行。工具、知识和业务权限回调经固定本机 Servlet HTTP 桥重新执行原 Spring Security、Shiro 或容器认证，核对主体与期限后才调用业务方法。注销、撤销和过期会拒绝后续回调，已完成幂等结果重放也先认证。取消是协作式的，不能强制终止已经开始的同步业务事务，业务仍需管理自己的事务边界。

认证头白名单与寿命属于 sparktide.authentication，默认 600 秒、上限 3600 秒，不延长原登录。Cookie 写请求复用现有 CSRF token；无该设施时要求同源 Origin 与 SDK 自动添加的 X-Requested-With。原生 Servlet TLS 继续使用标准证书及 localhost 主机名验证；桥不可用时失败关闭。token 不进入普通 context、模型、工具参数、组件 props、事件、历史或日志。

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

SDK 从工具返回类型生成服务端结果校验合同并注册组件引用，不要求业务在后台再定义 props Schema、UiCatalog Bean 或 ai/ui-catalog.json，也不需要 autoSelectUi=true。前端组件完整声明、后端业务结果类型分别承担渲染和业务数据职责，不手工维护第二套 UI 定义。safeOps 两张卡片与后台 @RenderWith 已统一为 **1.1.0**；已发布的 1.0.0 不覆盖。

`exportComponentCatalog` 仅为可选诊断导出。需要额外的独立 UI 能力时可显式导入 UiCatalog 或使用 autoSelectUi 高级方式；常规“工具结果显示卡片”无需导出、复制 JSON、上传 API 或新增协议。版本不支持/渲染失败按文字 fallback，模型不能发送任意可执行界面代码。

开发模式显式同步草稿，生产只核验已发布定义；发布作业独立执行。当前 -6 候选本地完整构建 542 项：517 通过、25 条件跳过、0 失败，12 模块隔离安装通过；包括 Boot2 原生 Java8 53/53、Boot4 Starter 68 项中 1 项既有条件跳过、真实 Servlet HTTP 与 Spring/Shiro 协程。前端本地 95 项及 React/Vue3/Vue2 样例通过，本轮 safeOps 前端固定包消费的 24 项与 Vue2/Webpack4 构建通过。safeOps 原生 Java8 消费者 clean/package 24/24 通过，所有 SDK 依赖为 -6，最终 Jar 不含 ui-catalog.json；前轮认证链路证据保留，不作为本轮 1.2.1 重测结论。

safeOps 本轮接入源码从 33 个 Java 文件、3197 行收敛到 6 个文件、408 行，计入新增公共业务代码的保守全接入口径仍净减至少 2073 行：Assistant、Provider、Model、Tools、Knowledge 和必要工具输入。已删除手工 Origin、AI 配置以及专属 scope/read/permission/web；工具直接调用 `ProjectInfoService`、`ProjectProgressService`、`WarnService` 和 `SafetyCheckService`。缺少的业务摘要补进这些公共服务，继续使用原 MyBatis 数据权限，并修正原权限入口的确定缺陷；不是把旧 AI 查询层整体搬到 SDK。

后端 -6 / 业务声明 1.2.1 / UI 1.1.0 的真实浏览器进度、预警、知识三场景均成功，23 项运行检查全部通过，6 次模型调用共 12483 Tokens。两张业务卡片各渲染一次，数据按原企业 AND 项目范围独立 SQL 核对；知识核验及 1.2.1 来源预览通过。原生认证专项 32/32、六工具真实 HTTP/数据库 10 项检查也通过。

浏览器 UI 20/20 通过，reload 后三类历史、卡片、核验和 1.2.1 预览恢复；原退出、back/reload 均保持登录页。专用测试夹具已 CAS 还原，新增 Run 恰 3 个，后续读取/改名/注销无额外模型调用。本轮本机候选验收完成。前轮 -4/1.1.1 的模型及历史证据保留原批次，-5 的长知识超时/503 不改写成成功；Go HTTP 402 不借 DeepSeek 结果标为通过。见[本轮范围](../产品支持/版本说明.md#基础设施下沉与业务服务复用)。

迁移时成套更新双 SDK 和平台，移除业务手写 Provider HTTP/SSE、注册图、回调服务、createChatClient 与旧 hook overload。恢复旧构件也需配套，不混用两代状态 API，不重放未知工具副作用。
