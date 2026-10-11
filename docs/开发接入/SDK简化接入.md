---
title: "新版 SDK：从声明到聊天（开发版）"
productVersion: "开发源码；公开 0.1.0 不含此 API"
updated: "2026-10-11"
status: "分阶段实现与本地验证"
owner: "SparkTide 维护者"
source: "AiModule / IdentityResolver / AiClient / React 与 Vue 适配器"
topic: "SDK 参考 · 开发版"
docGoal: "按顺序声明业务能力、接入现有登录，再使用完整聊天组件和任务 API。"
---

# 新版 SDK：从声明到聊天

先在业务后台声明模型和助手，再接入已有登录，最后在前端放入聊天组件。工具、知识、审批、引用和业务组件都沿用这条接入路径；需要定制时，直接使用相同客户端和状态 API。

::: warning 当前版本
本页介绍开发源码中已经实现的 API，公开的 **0.1.0 安装包不包含这些新 API**。使用已发布版本请走[连续教程](../教程/README.md)。新版尚未完成附件、模型目录及正式发行，不能把本页当作新版本发布公告。
:::

## 你需要完成哪些事

| 顺序 | 写在哪里 | 完成后得到什么 |
| --- | --- | --- |
| 1 | 业务后台 AiModule Bean | 一组可共享模型、知识、工具的助手 |
| 2 | 平台一次性授权、后台 IdentityResolver | 已登录用户可直接聊天，无需第二套用户登录 |
| 3 | 后台 application.yml | 声明部署和 `/api/ai` 标准 HTTP API |
| 4 | 前端应用入口与聊天页面 | 流式消息、会话、审批、引用和业务组件 |
| 5 | 独立发布步骤 | 生产只验证已发布定义，再挂载业务回调 |

底座仍管理会话与运行；业务后台处理登录和业务能力；前端只访问业务后台。

## 1. 声明模型和助手

Java 和 Kotlin 生成同一份能力图。提供商、模型各声明一次，多个助手可直接复用这些对象，无需自己拼接底层绑定和引用。

::: code-group

```java [Java]
import dev.sparktide.sdk.*;
import org.springframework.context.annotation.Bean;

@Bean
AiModule aiModule() {
    var company = Provider.openAICompatible("company")
        .baseUrl("https://models.example/v1")
        .credential(Credential.env("MODEL_API_KEY"))
        .build();
    var chat = company.model("chat")
        .remoteId("your-model-id")
        .capabilities(c -> c
            .supports(ModelCapabilities.Feature.STREAMING, true)
            .supports(ModelCapabilities.Feature.TOOL_CALLING, true))
        .build();
    var assistant = Agent.builder("assistant")
        .instructions("你是业务助手，请用中文回答。")
        .model(chat)
        .build();
    return AiModule.builder("orders")
        .defaultAgent(assistant)
        .build();
}
```

```kotlin [Kotlin]
import dev.sparktide.sdk.*
import dev.sparktide.sdk.kotlin.aiModule
import org.springframework.context.annotation.Bean

@Bean
fun aiModule(): AiModule = aiModule("orders") {
    val company = provider("company") {
        baseUrl = "https://models.example/v1"
        credential = Credential.env("MODEL_API_KEY")
    }
    val chat = model("chat", company) {
        remoteId = "your-model-id"
        capabilities { streaming = true; toolCalling = true }
    }
    val assistant = agent("assistant") {
        instructions = "你是业务助手，请用中文回答。"
        model(chat)
    }
    defaultAgent(assistant)
}
```

:::

将地址、模型标识和能力改成实际供应商配置。`MODEL_API_KEY` 是业务后台部署环境中的变量名，不能把真实 Key 写进代码。开发同步或受控部署时，SDK 将值交给底座加密托管；声明只有应用及目标地址绑定的引用。底座需先配置托管主密钥和出站允许列表，见下面的密钥部署步骤。已有底座环境变量方式仍可使用 `Credential.reference(name)`。模型能力需符合供应商实际支持，SDK 不自行推测。

### 同一个模块放多个助手、多个知识源

`defaultAgent` 指定唯一默认入口，`expose` 开放其他入口。只被 `delegateTo` 引用的助手保持内部可调用，浏览器不能直接调用它。托管知识集合先声明，内容通过[知识库接口](../使用指南/知识库.md)导入；远程业务知识可以使用方法适配。

::: code-group

```java [Java]
// 以下接在模型 chat 声明之后。
var handbook = KnowledgeCollection.builder("handbook")
    .description("员工业务手册").build();
var returns = KnowledgeCollection.builder("returns")
    .description("退款政策").build();
var refund = Agent.builder("refund")
    .instructions("依据退款政策给出建议。")
    .model(chat).knowledge(handbook, returns).build();
var support = Agent.builder("support")
    .instructions("回答业务问题，退款问题委托专门助手。")
    .model(chat).knowledge(handbook).delegateTo(refund).build();
return AiModule.builder("orders")
    .defaultAgent(support)
    .expose(refund) // 删除这一行，refund 就只有内部委托入口。
    .build();
```

```kotlin [Kotlin]
// 以下位于 aiModule 块中，复用上面声明的 chat。
val handbook = knowledgeCollection("handbook") {
    description = "员工业务手册"
}
val returns = knowledgeCollection("returns") {
    description = "退款政策"
}
val refund = agent("refund") {
    instructions = "依据退款政策给出建议。"
    model(chat)
    knowledge(handbook, returns)
}
val support = agent("support") {
    instructions = "回答业务问题，退款问题委托专门助手。"
    model(chat)
    knowledge(handbook)
    delegateTo(refund)
}
defaultAgent(support)
expose(refund) // 删除这一行，refund 就只有内部委托入口。
```

:::

同名同版本资源内容必须一致，共享对象会去重。多个 AiModule Bean 可以共存，但整个应用只能有一个默认助手。助手、工具、知识和模型的版本由模块部署版本统一指定；显式外部资源可继续使用精确版本。

## 2. 接入已有业务登录

由业务安全框架先认证请求，再让 SDK 从 Principal 得到业务用户。没有已认证 Principal 时直接拒绝，不从浏览器 Context 读取 userId 或 tenantId。

::: code-group

```java [Java]
import dev.sparktide.sdk.UserIdentity;
import dev.sparktide.sdk.spring.IdentityResolver;

@Bean
IdentityResolver aiIdentity() {
    // 本例是已由业务服务确定的单租户系统。
    return principal -> UserIdentity.of(principal.getName(), "tenant-a");
}
```

```kotlin [Kotlin]
import dev.sparktide.sdk.UserIdentity
import dev.sparktide.sdk.spring.IdentityResolver

@Bean
fun aiIdentity() = IdentityResolver { principal ->
    UserIdentity.of(principal.name, "tenant-a")
}
```

:::

多租户系统从服务端用户目录读取租户，替换示例中的常量。平台管理员还需一次性授予应用后台的签发主体和租户范围，随后后台 SDK 自动换取短期 USER 凭据并缓存，浏览器不会获得该凭据。

一次性部署授权可通过 Java SDK 执行，无需逐用户操作管理页面：

```java
var admin = new PlatformClient(platformUrl, "orders", adminCredentialSupplier);
var policy = admin.identityDelegationPolicy().toCompletableFuture().join();
admin.configureIdentityDelegation(
    true, List.of("orders-backend"), List.of("tenant-a"), 900,
    ((Number) policy.get("revision")).longValue(), "开通订单后台身份委托"
).toCompletableFuture().join();
```

`orders-backend` 必须等于后台 APP_ADMIN 凭据的 subjectId。上述管理程序使用平台管理员凭据；业务应用只配置自己的 APP_ADMIN 凭据。默认委托关闭，策略变更或父凭据撤销会使旧委托失效。原有 ChatCredentialResolver 仍兼容。

## 3. 配置后台连接与部署

```yaml
sparktide:
  application: orders
  platform:
    url: ${SPARKTIDE_URL}
    credential: ${SPARKTIDE_APP_CREDENTIAL}
  http:
    path: /api/ai
  deployment:
    mode: development
    version: 1.0.0
```

声明注册与标准 HTTP API 共享连接配置；前端不需要知道底座地址或 appId。旧配置仍可用，同义新旧键冲突会报错。

| 环境 | 启动行为 |
| --- | --- |
| 显式 development | 注册与同步声明；冲突、已发布内容变化或未经确认的入口切换会失败 |
| 默认 production | 只核对完全一致且已发布的声明和默认入口，然后挂载回调、续租；不自动发布 |

有业务工具、远程知识、权限或上下文提供器时，再添加回调配置：

```yaml
sparktide:
  callbacks:
    url: ${SPARKTIDE_CALLBACK_URL}
    credential: ${SPARKTIDE_CALLBACK_TOKEN}
    secret-reference: ORDERS_CALLBACK_TOKEN
    ledger-directory: ./data/ai-tool-ledger
    port: 8089
```

与上一段合并为一个 `sparktide` 节点。底座必须能访问回调 URL，并将凭据引用绑定到此应用及目标 origin。当前回调运行在 Starter 独立端口；工具幂等账本目录必须持久化。

### 模型密钥的环境与发布

1. 底座运维通过 Secret 注入 `SPARKTIDE_CREDENTIAL_KEYRING`（keyId → 32 字节随机 AES 密钥的 Base64，JSON 对象）与 `SPARKTIDE_CREDENTIAL_ACTIVE_KEY`；在出站允许列表中配置模型 origin。未配置主密钥时拒绝托管。
2. 业务后台部署环境设置 `MODEL_API_KEY`。开发环境 auto-sync 开启时会同步值；生产 VERIFY 启动只检查元数据，不读取或上传模型密钥。
3. 正式发布前，在受控部署程序调用模块准备结果的 `synchronizeCredentials`，再执行草稿注册与显式发布。写请求包含已观察的修订，冲突会失败，不盲目覆盖。

```java
var prepared = module.prepare(version, callbackBase, callbackSecretReference);
prepared.synchronizeCredentials(client, "发布前同步模型凭据")
    .toCompletableFuture().join();
```

密钥不进入模型定义、清单、审计或日志。上传要求 HTTPS（本机字面量回环地址可使用 HTTP）。底座 GET 只返回元数据；跨应用、跨 origin、密文篡改和已撤销引用都会拒绝。主密钥轮换时保留旧 key，重新同步后用新 key 加密；全部迁移完成前不能删除旧 key。

带业务回调的生产发布流程：先同步凭据，再显式使用 `deployment.startup: REGISTER` 注册草稿并启动回调/租约，通过 `SparkTideRegistration.release(reason)` 发布，后续正常启动恢复 VERIFY。默认生产 VERIFY 不会自动创建新版本或替你完成首次发布。

## 4. 前端一次连接，直接使用完整聊天组件

先创建稳定客户端，整个已登录会话复用它。以下是业务 Bearer 登录示例：

```ts
import {createClient} from '@sparktide/frontend-sdk';

export const ai = createClient({
  baseUrl: '/api/ai',
  auth: {type: 'bearer', token: () => businessLogin.currentAccessToken()}
});
```

`businessLogin` 是已有登录模块。Cookie 登录可改为 `auth: {type: 'cookie', csrfToken: () => businessLogin.csrfToken()}`，默认 CSRF 头为 `X-CSRF-TOKEN`；后台必须接入现有 CSRF 验证，不可无条件放行。

::: code-group

```tsx [React]
import {SparkTideProvider, ChatPanel} from '@sparktide/frontend-sdk/react';
import {ai} from './ai';

export function App() {
  return <SparkTideProvider client={ai}>
    <ChatPanel />
  </SparkTideProvider>;
}
```

```ts [Vue]
import {createApp} from 'vue';
import {SparkTidePlugin, ChatPanel} from '@sparktide/frontend-sdk/vue';
import {ai} from './ai';

createApp(ChatPanel)
  .use(SparkTidePlugin, {client: ai})
  .mount('#app');
```

:::

ChatPanel 已包含消息、会话、发送/停止、危险操作批准/拒绝、引用预览和业务组件渲染。未指定助手时使用应用默认入口；当前选择其他助手使用 `agent: {id: 'refund', version: '1.0.0'}`。入口别名和模型选择目录仍在后续实施范围。

退出或切换用户时调用 `ai.reset()`，清空本地身份相关状态并中断旧请求；它不会取消后台已提交任务。

### 自定义布局，无需重写状态管理

```tsx
import {useChat, MessageList, ChatInput} from '@sparktide/frontend-sdk/react';

export function MyChat() {
  const chat = useChat();
  return <section>
    <MessageList messages={chat.messages} onCitation={chat.previewCitation} />
    <ChatInput chat={chat} />
    {chat.error && <p role="alert">{chat.error.message}</p>}
  </section>;
}
```

需要危险操作、会话目录或引用详情的自定义页面也应展示对应状态和动作；完整界面可直接使用 ChatPanel。Vue useChat 返回同名 refs/computed，可在模板解包；JS/TS 无框架接入使用 `createChat(ai, options)`，挂载时 `start()`，卸载时 `dispose()`。

| 状态或动作 | 开发者使用方式 |
| --- | --- |
| input、canSend、sending | 输入草稿、可发送、HTTP 提交状态 |
| messages | 历史与当前消息，含文本、工具、组件、引用 parts |
| run、status、connection | 区分业务运行状态与网络连接状态 |
| pendingApprovals | 展示待确认操作，调用 approve(id) 或 reject(id) |
| send() / send(text) | 发送草稿 / 发送指定文本，界面动作返回 void |
| stop() / reconnect() | 取消任务 / 恢复既有任务事件流 |
| refresh(true) | 加载下一页会话 |
| selectConversation(id) / newConversation() | 选择历史 / 开始新的本地视图 |
| renameConversation(title) / deleteConversation() | 修改或删除当前会话 |
| previewCitation(id) | 经服务端重新授权后展示引用片段 |

发送失败保留草稿；用户在提交期间输入的新草稿也会保留。重连不会重发聊天。组件卸载关闭观察，不自动取消业务任务。需要等待业务结果时使用下面的任务 API，不要等待界面 send()。

### 在业务流程中等待结果

```ts
const task = await ai.chat.run({message: '查询订单进度'});
const off = task.on('textDelta', text => console.log(text));
try {
  const run = await task.completed();
  if (run.status === 'SUCCEEDED') {
    console.log(task.getState().text);
  }
} finally {
  off();
}
```

`completed()` 会等待终态；FAILED、CANCELLED、TIMED_OUT 也是终态，要检查 status。连接错误会拒绝 Promise；重新等待只恢复同一任务，不重新提交。工具需要确认时，应由界面展示详情后调用 `task.approve(id)` 或 `task.reject(id)`。

## 5. 业务组件如何被选择

前端组件声明名称、精确版本、能力描述、props Schema 和文本 fallback，导出 UiCatalog 供后台模块导入。后台助手启用 `autoSelectUi()`（Kotlin `ui { autoSelect() }`）后，模型可以从已授权且当前客户端支持的组件中选择，无需每个工具都写 RenderWith。

`@RenderWith` 保留用于确定性映射，例如订单查询结果固定显示订单卡片。整个经 Schema 验证的工具输出作为 props；客户端不支持该版本或渲染失败时显示 fallback。两种机制可以共存；模型不能发送任意可执行前端代码。

## 实施边界与下一步

已完成模块化模型/助手/知识声明、方法工具与知识适配、组件契约与自主/固定渲染、完整前端状态、可信登录委托和统一配置。模型环境密钥托管已实现；当前仍需完成附件、模型/入口目录、完整独立安装示例和新版正式发行。底座与 SDK 的本地测试不代表真实模型厂商或生产部署验收。

学习现有业务规则可继续阅读[业务工具](../使用指南/业务工具.md)、[知识库](../使用指南/知识库.md)、[界面组件](../使用指南/界面组件.md)。这些页面中的旧版本 API 仍属于公开 0.1.0；新版完整教程迁移将与已验证源码同步推进。
