---
title: "业务后台 SDK（Java / Kotlin）"
productVersion: "开发候选 0.1.1-auth.20261023-6"
updated: "2026-10-23"
status: "本地完整构建通过，公共发行另记"
owner: "SparkTide 维护者"
source: "Kotlin 共享核心、两类 Starter、独立模型适配器与认证桥"
---

# 业务后台 SDK（Java / Kotlin）

常规接入使用[类型化注解教程](SDK简化接入.md)：@AiProvider 管连接/密钥，@AiModel 管模型行为，@Agent 用类数组关联模型、工具和知识。SDK 实现语言为 Kotlin，Java 使用者直接调用公开 API，无需迁移业务语言。

## 安装

以下候选只在内部制品仓库提供，**尚未在公开 Maven 地址发行**。公开 0.1.0 属于[旧固定版本教程](../教程/README.md)，不能混用本页 API。

| 场景 | 坐标（group 为 dev.sparktide） |
| --- | --- |
| Java 17 核心 | sdk-java:0.1.1-auth.20261023-6 |
| Java 8 核心 | sdk-java8:0.1.1-auth.20261023-6 |
| Java 17 / Boot 4.0.8 | sdk-spring-boot-starter:0.1.1-auth.20261023-6 |
| Java 8 / Boot 2.6.6 | sdk-spring-boot2-starter:0.1.1-auth.20261023-6 |
| Kotlin 协程/DSL | sdk-kotlin，与 Java 17 核心配套 |
| 模型适配器 | sdk-model-deepseek / sdk-model-opencode-go / sdk-model-openai / sdk-model-openai-compatible / sdk-model-ollama，同候选版本 |

Boot 2 Maven 工程添加依赖前由维护者提供内部仓库地址；不要把个人机器的文件路径当成公共安装地址。

```xml
<properties>
  <sparktide.sdk.version>0.1.1-auth.20261023-6</sparktide.sdk.version>
  <kotlin.version>2.3.20</kotlin.version>
</properties>
<dependencies>
  <dependency>
    <groupId>dev.sparktide</groupId>
    <artifactId>sdk-spring-boot2-starter</artifactId>
    <version>${sparktide.sdk.version}</version>
  </dependency>
  <dependency>
    <groupId>dev.sparktide</groupId>
    <artifactId>sdk-model-opencode-go</artifactId>
    <version>${sparktide.sdk.version}</version>
  </dependency>
</dependencies>
```

Boot 2 父 BOM 会管理 Kotlin 依赖版本，需检查依赖树确实对齐 stdlib、reflect 与 jdk7/jdk8 拆分包。SDK 本身已验证原生 Java 8 字节码与消费；业务仍需运行验证。同一业务应用只选择一套 Java 核心，不同时依赖两个 Starter。

## 选择模型适配器

只添加实际使用的依赖；以下模块均为同轮内部候选，不表示新的公共发行。模型父类选协议，`@AiModel.provider` 选已有配置的 Provider 子类。

| 模块 | 模型声明父类 | 适用协议 |
| --- | --- | --- |
| sdk-model-deepseek | DeepSeekProvider.Model | DeepSeek 官方 Chat Completions |
| sdk-model-opencode-go | OpenCodeGoProvider.Model | OpenCode Go 的模型服务 |
| sdk-model-openai | OpenAIProvider.Model | OpenAI |
| sdk-model-openai-compatible | OpenAICompatibleProvider.Model | OpenAI 兼容 Chat Completions |
| sdk-model-ollama | OllamaProvider.Model | Ollama |

DeepSeek 接入将上例的适配器依赖改为 `sdk-model-deepseek`，分别声明连接和模型：

```java
import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.annotation.AiModel;
import dev.sparktide.sdk.provider.DeepSeekProvider;

// 两个 public 类分别放入同名文件；地址默认使用 https://api.deepseek.com。
@AiProvider(apiKey = "${business.ai.deepseek.api-key}")
public class BusinessDeepSeekProvider extends DeepSeekProvider {}

@AiModel(model = "deepseek-flash", provider = BusinessDeepSeekProvider.class)
public class BusinessDeepSeekModel extends DeepSeekProvider.Model {}
```

API Key、连接地址和 HTTP 超时属于 Provider。`DeepSeekModelOptions(thinking=false)` 属于 Model，默认关闭思考；当前平台不保留跨轮 `reasoning_content`，显式启用思考会在创建适配器时返回 `UNSUPPORTED`，不先发送请求。SDK 将平台输出上限转换为 `max_tokens` 并发送 `thinking: {type: "disabled"}`，业务不需要实现请求体转换。自定义 Provider 可以继承预设覆盖连接或密钥来源；如需改变协议行为，使用自定义适配器 SPI。

## 配置与身份

连接 YAML 只描述平台地址、应用/回调凭据、回调 URL 及部署信息，模型和智能体不写入 YAML。完整最小示例见[连接平台](SDK简化接入.md#_4-连接平台并复用现有登录)。

SDK 提供标准 /api/ai 路由、注册图、模型/工具/知识回调与租约。原认证已产生 Principal 时，默认使用其 name 作为无租户业务用户；自定义用户对象或租户仅在原安全配置提供 `BusinessPrincipalMapper` 字段映射，直接复用原框架已认证对象。不要求开发者手写 Filter、Verifier、路由、登录、委托缓存、回调服务、UiCatalog Bean 或权限协议 Provider。

认证信息使用与普通 context 分开的私有通道。工具通过 context.authentication().token() 或 header(name) 读取本次原认证；回调重新经过业务原认证过滤器，再调用原服务判断权限。访问器随执行结束失效，不可保存认证值。平台只持有短期加密胶囊和可信运行关联，模型、消息、历史、事件和 UI 不接收认证材料。

Cookie 写请求复用业务现有 CSRF；没有该设施时要求同源 Origin 与 SDK 自动请求保护头。胶囊默认 600 秒，上限 3600 秒，原业务 token 过期或撤销更早生效。本机桥使用私有 HTTP 客户端，不继承进程全局 Cookie/Authenticator、不重定向、不重试；主 Servlet 原生 TLS 必须通过标准证书/localhost 主机名校验。

## 自动基础设施与业务边界

Starter 内置原 Shiro/Spring Security/Servlet 认证与功能权限适配，精确校验同一 app/user/tenant 后调用原框架权限。数据权限不搬入 SDK，业务工具必须调用已有 Service 的授权入口；权限名也复用原体系。需要参数级资源决策时可覆盖 PermissionProvider，不能以普通 Context 或客户端 appId 提供可信身份。

同源默认允许，跨源才配置 `sparktide.chat.security.allowed-origins` 的完整 http/https origin，拒绝通配符、null、路径或 query。`allow-credentials` 默认 false，显式跨域 Cookie 不替代 CSRF。SDK 路由拒绝 URL 凭据，自动防止下游全局 CORS 覆盖安全响应；原认证提前结束的 HTTP 200 错误会规范为 SDK 失败响应，正常 SSE 不等待缓冲。

宿主 XSS/正文过滤器可用 `SdkHttpRequest.isManaged(request)` 保持 SDK 校验过的 JSON/SSE 原文。标记由服务端设置，只对 SDK 自有路径生效，不是免认证或扩大数据权限的依据。safeOps 只在原 ShiroConfig 增加主体字段映射、原 XssFilter 增加这一判断，没有再建 AI 认证设施。

## UI、权限与扩展

@Agent.permissions 声明入口所需业务权限，原服务继续判定数据权限。常规卡片只写 @RenderWith 组件名/精确版本并返回已有业务 DTO，SDK 根据输出类型生成结果校验合同；前端一处声明 props/Renderer，不要求导出并复制 ai/ui-catalog.json、不需要 UiCatalog Bean、autoSelectUi 或手写 AiModule。显式目录导入仅保留为额外独立 UI 能力的高级选项。工具/知识是现有业务 Bean，模型/Provider 默认可公开无参构造，也支持从容器取得。

供应商的连接/账户选项属于 ProviderOptions，推理选项属于 ModelOptions。自定义适配器实现 sdk-model-spi 的 ModelAdapterFactory / ModelAdapter；工厂分别接收 ProviderSettings、ModelSettings 和 SDK 的可信辅助服务。保留低层客户端用于管理/特殊集成，不把手工注册图作为常规接入步骤。

## 生命周期、发布与验证

开发环境显式同步草稿；生产只验证现有发布定义。受控发布使用 SparkTideRegistration.release(reason)，不能由聊天触发隐式发布。工具写操作不自动重试，保留持久幂等账本和未知结果核对。同步业务事务只支持协作式取消，不能宣称强制终止已开始的业务操作。

-6 候选完整 clean build：542 项，517 通过、25 条件跳过、0 失败，12 模块隔离 Maven 安装通过；其中 Boot2 原生 Java8 53/53，Boot4 Starter 68 项中 1 项既有条件跳过。包含 Java 8/17、真实 Servlet HTTP、协程隔离与 DeepSeek 协议行为。本地测试不等同于供应商实网或业务生产验收，实际业务验证单独记录。回滚成套恢复匹配平台与两个 SDK，不把 token 降级到普通 context。

本轮 safeOps 声明推进为 1.2.1，接入目录剩 6 个 Java 文件、408 行，工具调用原公共业务 Service，前端已移除 AI bootstrap/projects 端点。最终原生 Java8 消费者 clean/package 24/24 通过，SDK 依赖统一为 -6；Jar 及其打包资源中没有 ui-catalog.json，不依赖前端目录复制。最终版本真实 DeepSeek 三场景、23 项运行检查、原认证专项 32/32 和六工具真实 HTTP/数据库 10 项检查通过；浏览器 UI 20/20、完整历史/退出通过且夹具已还原，本轮本机隔离候选验收完成。计入新增公共业务代码后，保守全接入口径仍净减至少 2073 行。safeOps 本轮 24 项不代表原业务全项目测试，7 项 DynamicDataSourceTest 仍受缺驱动环境限制；前轮 -4/1.1.1 的三场景和旧包浏览器证据仅按原批次保留，详细边界见[本轮范围](../产品支持/版本说明.md#基础设施下沉与业务服务复用)。
