---
title: "SDK 简化接入（开发版）"
productVersion: "开发源码；公开 0.1.0 不含此 API"
updated: "2026-10-09"
status: "本地实现与验证"
owner: "SparkTide 维护者"
source: "AssistantDeclaration / AssistantDsl、ChatController 与 React/Vue useChat"
topic: "SDK 参考 · 开发版"
docGoal: "查看简化后的接入方式；使用公开 0.1.0 安装包时仍走现有教程。"
---

# SDK 简化接入（开发版）

::: warning 版本范围
以下 API 已在本地开发源码实现，**公开的 0.1.0 安装包尚不包含它们**。当前正式安装仍使用[连续教程](../教程/README.md)。这里单独展示新的接入入口与边界，发行新版本后再切换默认教程。
:::

## 1. 后台只声明一个助手

Spring 的 `@Bean` 返回 `RegistrationManifest`，Starter 按原有流程注册。SDK 为一个助手生成提供商、模型、应用绑定、调用配置和智能体，业务代码不再手工拼接五层引用。Java / Kotlin 共用相同产物。

::: code-group

```java [Java]
import dev.sparktide.sdk.*;
import java.net.URI;
import org.springframework.context.annotation.Bean;

@Bean
RegistrationManifest assistant() {
    return AssistantDeclaration.builder("main", "1.0.0")
        .managedBy("orders-service")
        .openAI(URI.create("https://models.example/v1/chat/completions"),
            "your-model-id", "MODEL_API_KEY")
        .systemPrompt("你是业务助手，请用中文回答。")
        .capabilities(c -> c.supports(ModelCapabilities.Feature.STREAMING, true)
            .supports(ModelCapabilities.Feature.TOOL_CALLING, true))
        .profile(p -> p.maxOutputTokens(1024))
        .tool("find-order")
        .knowledge("manual", "2.0.0")
        .build();
}
```

```kotlin [Kotlin]
import dev.sparktide.sdk.RegistrationManifest
import dev.sparktide.sdk.kotlin.assistant
import java.net.URI
import org.springframework.context.annotation.Bean

@Bean
fun assistant(): RegistrationManifest = assistant("main", "1.0.0") {
    managedBy = "orders-service"
    openAI(URI.create("https://models.example/v1/chat/completions"),
        "your-model-id", "MODEL_API_KEY")
    systemPrompt = "你是业务助手，请用中文回答。"
    capabilities { streaming = true; toolCalling = true }
    profile { maxOutputTokens = 1024 }
    tool("find-order")
    knowledge("manual", "2.0.0")
}
```

:::

从最小聊天开始时删去 `tool`、`knowledge`；需要业务能力时再添加相应注解或 Provider。引用省略版本时使用助手版本。`main@1.0.0` 在五种资源类型中分别生成，内部引用保持精确版本；已使用其他资源 ID 的项目不能直接用相同版本替换，需要保留高级声明或显式迁移到新版本。

模型地址及 modelId 换成自己的真实配置，`MODEL_API_KEY` 是底座环境变量名称，不是实际 Key。能力需与模型实际支持一致；未声明保持未知，SDK 不自动开启工具调用或流式。共享提供商、多模型路由和复杂智能体继续使用已有 `ModelDeclarations`、`ModelProfile` 等高级接口。

## 2. Spring 保留清晰的启用与发布步骤

仍按[后台教程](../教程/接入后台.md#_3-启用声明与聊天-http-api)配置底座地址、应用、能力注册及 `/api/ai`。默认入口设置为 `main@1.0.0`，`deployment.source` 与 `managedBy` 使用同一稳定标识。构建器只产生清单，**不会创建应用、签发凭据或自动发布**。

身份只接入一次已有业务登录：`ChatCredentialResolver` 将已验证 Principal 映射到平台 USER 凭据。聊天 Controller、会话转发、SSE 转发由 Starter 提供；生产发布仍显式执行，见[业务后台 SDK](业务后台SDK.md)。

## 3. 前端默认用组件，定制时用 useChat

无需定制布局时，继续用现有 `ChatPanel`。需要自己的页面时，先创建一个稳定客户端：

```ts
import {createChatClient} from '@sparktide/frontend-sdk';
const client = createChatClient({
  baseUrl: '/api/ai',
  token: () => businessLogin.currentAccessToken()
});
```

然后使用所属框架的 `useChat(client)`。消息已经合并历史与实时回答，无需手工创建 Session、订阅 SSE 或额外维护 busy/error。

::: code-group

```tsx [React]
import {useState} from 'react';
import type {ChatClient} from '@sparktide/frontend-sdk';
import {useChat} from '@sparktide/frontend-sdk/react';

export function MyChat({client}: {client: ChatClient}) {
  const chat = useChat(client);
  const [input, setInput] = useState('');
  return <section>
    {chat.messages.map((message, index) => <p key={index}>{message.content}</p>)}
    {chat.error && <p role="alert">{chat.error}</p>}
    <input value={input} onChange={e => setInput(e.target.value)} />
    <button disabled={chat.busy || !input.trim()}
      onClick={() => {void chat.send(input).then(ok => {if (ok) setInput('');});}}>发送</button>
    <button disabled={!chat.busy || !chat.runId}
      onClick={() => {void chat.cancel();}}>停止</button>
  </section>;
}
```

```vue [Vue]
<script setup lang="ts">
import {ref} from 'vue';
import type {ChatClient} from '@sparktide/frontend-sdk';
import {useChat} from '@sparktide/frontend-sdk/vue';

const props = defineProps<{client: ChatClient}>();
const {messages, busy, error, runId, send, cancel} = useChat(() => props.client);
const input = ref('');
async function submit() { if (await send(input.value)) input.value = ''; }
</script>

<template>
  <section>
    <p v-for="(message, index) in messages" :key="index">{{ message.content }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <input v-model="input" />
    <button :disabled="busy || !input.trim()" @click="submit">发送</button>
    <button :disabled="!busy || !runId" @click="cancel">停止</button>
  </section>
</template>
```

:::

这些是最小定制片段；有危险工具的页面还需渲染 `confirmations` 并提供批准/拒绝按钮，否则使用已包含完整确认交互的 `ChatPanel`。有引用和业务卡片时按需渲染 citations / events。JS / TS 无框架项目可用 `new ChatController(client)`、`getSnapshot()` 与 `subscribe()`；页面退出时调用 `dispose()`。

## 4. 常用动作与状态

| 接口 | 行为 |
| --- | --- |
| messages | 历史、当前用户消息与实时回答；直接渲染 |
| busy / error | 加载或活动运行 / 可展示错误，无需自己合并多处状态 |
| conversations / nextOffset | 会话列表与下一页游标，null 表示没有下一页 |
| send(text) | 发送并订阅本轮回答，不自动重试写请求 |
| newConversation() / selectConversation(id) | 开始新视图 / 加载历史并恢复活动运行 |
| refresh(true) | 读取下一页会话；挂载时自动加载首页 |
| renameConversation(title) / deleteConversation() | 操作当前会话，失败时保留可用历史 |
| cancel() / resume() | 显式取消运行 / 重新订阅已有运行，不重发输入 |
| confirm(id, 'approve' 或 'reject') | 处理危险工具确认 |

异步动作返回 `Promise<boolean>`：成功 true，失败 false，原因保存在 error。`send` 会等待本轮事件订阅结束，业务 Run 的成功/失败读取 `status`（React 的 `chat.status` / Vue 的 `status.value`），**true 不等于模型任务一定成功**。删除、权限失败和断线不会触发隐式重试。更细错误码或调用控制可继续使用 client / ChatWorkspace。

React 返回普通快照与动作；Vue 返回只读 state Ref、messages/busy/error 等 ComputedRef 和动作，模板自动解包。组件退出只关闭网络订阅，不自动取消底座运行；SSR 不发请求。切换用户/租户时创建新 client：React 传新实例，Vue 传 `() => props.client`。已有 token 函数支持刷新业务凭据。

## 下一步

本页先说明已实现的简化入口。应用初始化、凭据签发、生产发布及高级模型/工具/知识配置继续按当前规范执行；后续版本发行完成后，再同步默认教程与独立安装示例。不要在未发布的新 API 上承诺 0.1.0 消费兼容。
