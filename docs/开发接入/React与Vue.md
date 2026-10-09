---
title: "React 与 Vue 聊天界面"
productVersion: "0.1"
updated: "2026-10-09"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 实现
topic: "SDK 参考"
docGoal: "默认 ChatPanel 或自定义状态层二选一；首次接入用教程完整项目。"
---

# React 与 Vue 聊天界面

默认使用各自入口的 ChatPanel，提供会话列表、历史、发送、停止、确认、错误和恢复。客户端只配置业务后台地址与业务认证；组件卸载不取消运行。保持 client 实例稳定，切换主体时重新挂载。

## 默认组件

::: code-group

```tsx [React]
import {createChatClient} from '@sparktide/frontend-sdk';
import {ChatPanel} from '@sparktide/frontend-sdk/react';
const client=createChatClient({baseUrl:'/api/ai',token:()=>businessToken});
<ChatPanel client={client} />
```

```ts [Vue]
import {defineComponent,h} from 'vue';
import {createChatClient} from '@sparktide/frontend-sdk';
import {ChatPanel} from '@sparktide/frontend-sdk/vue';
const client=createChatClient({baseUrl:'/api/ai',token:()=>businessToken});
export default defineComponent({setup:()=>()=>h(ChatPanel,{client})});
```

:::

## 自定义状态层

下面保留已有 ChatSession 与 UI Renderer 的组合例子，用于定制布局。两种适配共享同一个 ChatSession。示例接收由业务层创建的 session，不包含管理员凭据；同源网关和用户 token 函数按[前端 SDK](./前端SDK.md)配置。

在页面生命周期内保持 session 实例稳定，例如在父组件 useMemo 中创建。下面组件支持发送、状态、错误、审批和取消：

::: code-group

```tsx [React]
import { useEffect, useState } from 'react'
import { ChatSession } from '@sparktide/frontend-sdk'
import { useChatSession } from '@sparktide/frontend-sdk/react'

export function AgentChat({ session }: { session: ChatSession }) {
  const state = useChatSession(session)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => session.disconnect(), [session])
  async function act(work: () => Promise<void>) {
    try { setError(''); await work(); return true }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false }
  }
  async function send() {
    if (!message.trim() || busy) return
    setBusy(true)
    try { if (await act(() => session.send(message))) setMessage('') }
    finally { setBusy(false) }
  }
  return <section aria-label="智能助手">
    <p role="status">{state.status}</p>
    <p style={{ whiteSpace: 'pre-wrap' }}>{state.text}</p>
    {(error || state.error) && <p role="alert">{error || state.error}</p>}
    {state.confirmations.map(c => <article key={String(c.confirmationId)}>
      <h3>确认执行 {String(c.toolId)}</h3>
      <pre>{JSON.stringify(c.arguments, null, 2)}</pre>
      <button onClick={() => void act(() => session.confirm(String(c.confirmationId), 'approve'))}>批准</button>
      <button onClick={() => void act(() => session.confirm(String(c.confirmationId), 'reject'))}>拒绝</button>
    </article>)}
    <form onSubmit={e => { e.preventDefault(); void send() }}>
      <label>消息<textarea value={message} onChange={e => setMessage(e.target.value)} disabled={busy}/></label>
      <button disabled={busy || !message.trim()}>发送</button>
      <button type="button" disabled={!state.runId || !busy} onClick={() => void act(() => session.cancel())}>取消任务</button>
    </form>
  </section>
}
```

```vue [Vue]
<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ChatSession } from '@sparktide/frontend-sdk'
import { useChatSession } from '@sparktide/frontend-sdk/vue'

const props = defineProps<{ session: ChatSession }>()
const state = useChatSession(props.session)
const message = ref('')
const busy = ref(false)
const error = ref('')
onUnmounted(() => props.session.disconnect())
async function act(work: () => Promise<void>) {
  try { error.value = ''; await work(); return true }
  catch (e) { error.value = e instanceof Error ? e.message : String(e); return false }
}
async function send() {
  if (!message.value.trim() || busy.value) return
  busy.value = true
  try { if (await act(() => props.session.send(message.value))) message.value = '' }
  finally { busy.value = false }
}
</script>

<template>
  <section aria-label="智能助手">
    <p role="status">{{ state.status }}</p>
    <p style="white-space: pre-wrap">{{ state.text }}</p>
    <p v-if="error || state.error" role="alert">{{ error || state.error }}</p>
    <article v-for="c in state.confirmations" :key="String(c.confirmationId)">
      <h3>确认执行 {{ c.toolId }}</h3>
      <pre>{{ JSON.stringify(c.arguments, null, 2) }}</pre>
      <button @click="act(() => props.session.confirm(String(c.confirmationId), 'approve'))">批准</button>
      <button @click="act(() => props.session.confirm(String(c.confirmationId), 'reject'))">拒绝</button>
    </article>
    <form @submit.prevent="send">
      <label>消息<textarea v-model="message" :disabled="busy" /></label>
      <button :disabled="busy || !message.trim()">发送</button>
      <button type="button" :disabled="!state.runId || !busy" @click="act(() => props.session.cancel())">取消任务</button>
    </form>
  </section>
</template>
```

:::

**React：** 这是界面接入模式；业务设计系统可替换展示组件。审批按钮保持可交互，即使 send 正在等待终态。

**Vue：** Vue 适配自动解除状态订阅，页面仍应调用 session.disconnect 关闭网络订阅。若多个组件共享 session，只由拥有其生命周期的页面负责断开。

## 接入后的完善项

把 citation.created 显示为可访问的引用，把 ui.created 交给[组件注册表](../使用指南/界面组件.md)。明确区分断线和执行失败；需要恢复时保存 runId 并提供 resume 入口。用户切换账号或租户时创建对应新客户端，避免继续显示上一身份的数据。


## 回答引用与来源

[引用核验与当前授权预览](./知识接入/回答引用与鉴权来源预览.md)提供编号核验、来源片段、所有权与实时撤权、SDK 方法及前端状态使用方法。
