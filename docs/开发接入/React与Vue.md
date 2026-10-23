---
title: "React、Vue 3 与 Vue 2 聊天接入"
productVersion: "开发候选，公开 0.1.0 不适用"
updated: "2026-10-23"
status: "已实现，实际页面验收另记"
owner: "SparkTide 维护者"
source: "react-ai.ts、vue-ai.ts、vue2.ts 与 ChatStore"
---

# React、Vue 3 与 Vue 2 聊天接入

先按[前端 SDK](前端SDK.md)创建稳定的业务客户端 ai。三个框架使用同一 ChatStore：文本、业务卡片、会话历史、停止、审批、引用和错误共用状态。组件卸载只释放本地观察，不自动取消后台任务。

## 默认面板

::: code-group

```tsx [React]
import {SparkTideProvider, ChatPanel} from '@sparktide/frontend-sdk/react';
import {ai} from './ai';
export function App() {
  return <SparkTideProvider client={ai}>
    <ChatPanel agent="business-assistant" />
  </SparkTideProvider>;
}
```

```ts [Vue]
import {createApp} from 'vue';
import {SparkTidePlugin} from '@sparktide/frontend-sdk/vue';
import {ai} from './ai';
import App from './App.vue';
createApp(App).use(SparkTidePlugin, {client: ai}).mount('#app');
```

:::

Vue 3 页面组件：

```vue
<script setup lang="ts">
import {ChatPanel} from '@sparktide/frontend-sdk/vue';
</script>
<template><ChatPanel agent="business-assistant" /></template>
```

## Vue 2

```ts
import Vue from 'vue';
import {SparkTidePlugin} from '@sparktide/frontend-sdk/vue2';
import {ai} from './ai';
Vue.use(SparkTidePlugin, {client: ai});
```

插件自动注册 SparkTideChatPanel，页面写 `<SparkTideChatPanel agent="business-assistant" />` 即可。自定义 Vue 2 页面使用 createChatMixin，自动提供 chatState/chat 并在 beforeDestroy 释放；无需自己实现事件订阅和身份隔离。

```ts
import {createChatMixin} from '@sparktide/frontend-sdk/vue2';
export default {
  mixins: [createChatMixin({agent: 'business-assistant'})]
};
```

## 自定义状态层

React 使用 useChat(options)，client 可显式传入或由 Provider 提供；这是单一 API，不再接受旧 ChatClient/Session overload。

```tsx
import {useChat, MessageList, ChatInput} from '@sparktide/frontend-sdk/react';
export function BusinessChat() {
  const chat = useChat({agent: 'business-assistant'});
  return <>
    <MessageList messages={chat.messages} onCitation={chat.previewCitation} />
    <ChatInput chat={chat} />
  </>;
}
```

Vue 3 的 useChat(options 或 getter) 返回计算属性及相同动作；input 为可写计算属性，state 为完整只读快照。Provider/Plugin 可同时提供 components，单页也可显式覆盖同一组件清单。不要为 MessageList 和输入框各建一份聊天状态。

普通 context 支持 getter，在发送时复制 JSON；不能通过 context 传 token。identityKey 从原登录状态驱动账号/租户代次，旧响应不会更新新页面；无需靠重新挂载整页补救身份串线。宿主卸载应用时统一 dispose 客户端，局部面板由框架释放观察。

## 组件与错误

前端只在 defineAiComponent 声明 props Schema、精确版本、Renderer 与 fallback，交给 SDK 注册表分发。后台仅用 @RenderWith 引用组件名/版本并返回业务 DTO，SDK 自动生成结果校验合同；不要求导出、复制 ui-catalog.json 或再次定义 UI Schema。exportComponentCatalog 保留为可选调试工具，autoSelectUi/显式目录导入只用于额外独立 UI 的高级场景。无需在页面手写工具事件分派器；渲染失败和不支持的版本回退文字，知识引用预览仍由后端按当前认证重新授权。

401/403 先恢复原业务登录/权限，不能改用默认智能体或自动重发写入。连接中断可显式恢复同一任务；SDK 区分本地连接状态与后台 Run 终态。返回值和生命周期详见[前端 SDK](前端SDK.md)。
