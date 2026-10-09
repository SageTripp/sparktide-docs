---
title: "TypeScript 与前端 SDK"
productVersion: "0.1"
updated: "2026-10-09"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 实现
topic: "SDK 参考"
docGoal: "查 JS/TS 客户端方法、认证、会话与事件参数。"
---

# TypeScript 与前端 SDK

前端聊天 SDK 负责与业务后台交互，提供 JS/TS 方法、React/Vue 状态层和可用聊天组件。浏览器只配置业务后台地址与业务登录认证。

## 安装

直接安装 GitHub Release 的固定版本安装包，无需访问私有源码仓库，也无需手写 HTTP / SSE API 方法。选择业务项目的包管理器：

::: code-group

```sh [npm]
npm install https://github.com/SageTripp/sparktide-docs/releases/download/v0.1.0/sparktide-frontend-sdk-0.1.0.tgz
```

```sh [pnpm]
pnpm add https://github.com/SageTripp/sparktide-docs/releases/download/v0.1.0/sparktide-frontend-sdk-0.1.0.tgz
```

```sh [Yarn]
yarn add https://github.com/SageTripp/sparktide-docs/releases/download/v0.1.0/sparktide-frontend-sdk-0.1.0.tgz
```

:::

按使用的入口安装对应框架，JS/TS 核心不要求安装 React 或 Vue：

::: code-group

```sh [npm]
npm install react react-dom
# 使用 Vue 时：npm install vue
```

```sh [pnpm]
pnpm add react react-dom
# 使用 Vue 时：pnpm add vue
```

```sh [Yarn]
yarn add react react-dom
# 使用 Vue 时：yarn add vue
```

:::

## 接入边界


JS/TS核心、框架状态层、ChatPanel三层可独立使用。默认只连接业务后台 `/api/ai`，后台SDK负责认证和标准HTTP封装；底座保存权威状态。旧 SparkTideClient 直连模式保留给兼容和受控工具，常规浏览器使用 createChatClient。

## 方法层

```ts
import {createChatClient} from '@sparktide/frontend-sdk';
const client=createChatClient({
  baseUrl:'/api/ai',
  token:async()=>businessLogin.currentAccessToken(),
});
const run=await client.chat('查询设备');
for await(const event of client.events(run.id)) console.log(event.event);
```

不需要 appId、平台地址、管理员或模型密钥。token函数每次请求执行，可调用业务既有刷新方法；401/403原样抛出，不隐式重发消息。Cookie接入省略token，credentials默认same-origin；通过authHeaders返回现有CSRF头，后台同时提供ChatRequestVerifier。跨域使用credentials:include需要业务后台显式同源/CORS策略。

| 配置 | 类型、默认与约束 |
| --- | --- |
| baseUrl | 必填string，业务完整前缀；支持同源相对路径，浏览器解析location.origin |
| token | 可选()=>string或`Promise<string>`；为空则Cookie路径，不保存到localStorage |
| authHeaders | 可选返回`Record<string,string>`；仅业务认证/CSRF头，拒绝覆盖协议头和CRLF |
| credentials | 可选RequestCredentials；默认same-origin |
| timeoutMs | 普通请求默认30000；流650000，AbortSignal可提前结束 |
| fetch、traceparent | 可选注入；traceparent仅关联元数据，不能授权 |

| 方法 | 入参与结果 |
| --- | --- |
| createConversation(title='',{signal?}) | title最长128；返回空Conversation，不是发送前置要求 |
| conversations({limit?,offset?,signal?}) | 默认20/0；ConversationPage.items+nextOffset(null为末页) |
| conversation(id,{signal?}) | 最近最多20条Conversation.messages |
| renameConversation(id,title,{signal?}) | 返回`{id,title}` |
| deleteConversation(id,{signal?}) | 返回`{id,deleted:true}`；活动运行409保留本地会话 |
| chat(content,{conversationId?,agentId?,agentVersion?,context?,uiCapabilities?,idempotencyKey?,signal?}) | content非空、最长16384；agentId/version成对；返回Run.id/status/conversationId |
| run(id) | 查询权威状态 |
| events(id,{after?,retries?,signal?}) | after默认0；retries默认3，401/403/410不重连；按sequence去重，缺口报错 |
| cancel(id) | 显式取消运行 |
| confirm(id,confirmationId,'approve'或'reject') | 只对当前待确认动作响应 |
| previewCitation(runId,citationId) | 按实时业务权限读取引用 |

SparkTideError含status:number、code:string、message:string。协议事件复用底座1.0；不再另定义一套序号。断线只停止订阅，运行继续。写请求不自动重试；用稳定idempotencyKey重复提交可恢复同一Run。expired游标410后提示用户查看权威状态或创建新会话，不伪造缺失事件。

## 框架与组件

::: code-group

```tsx [React]
import {ChatPanel} from '@sparktide/frontend-sdk/react';
const client=createChatClient({baseUrl:'/api/ai',token:()=>businessToken});
// client实例在页面生命周期内保持稳定
<ChatPanel client={client} label="业务助手" className="assistant" />
```

```ts [Vue]
import {defineComponent,h} from 'vue';
import {ChatPanel} from '@sparktide/frontend-sdk/vue';
export default defineComponent({setup:()=>()=>h(ChatPanel,{client,label:'业务助手'})});
```

:::

组件包括会话列表、分页、历史、新会话、发送、停止、确认批准/拒绝、标题修改、删除、错误提示和恢复连接。普通文本安全渲染，带标签/键盘按钮/aria-live，窄屏使用可换行布局。组件卸载只断开流，不取消业务运行。切换业务账号时以key重新挂载，避免旧主体历史留在界面。

自定义业务卡片可复用 UIRendererRegistry、ChatSession、useChatSession；更完整的自定义布局使用ChatWorkspace和useChatWorkspace。这些入口不强制使用默认组件。Vue入口只依赖Vue，React入口只依赖React，JS核心不加载任何框架。宿主自行安装相应peer dependency。

## 迁移、验证与回滚

示例默认使用业务后台入口；React App和Vue createChatApp无需手写fetch/SSE方法。AdvancedApp保留已有卡片渲染组合能力。npm test包含核心行为、类型、框架示例和SSR安全控制；安装包已经在独立 React/Vue 消费项目中验证；端到端记录维护在平台仓库的双 SDK 实施记录中。演示模型为回环合同夹具，不代表厂商实网质量。

回滚前端包与业务后台部署即可恢复旧版本；会话和事件仍在底座。不自动将浏览器切到公网平台，也不删除数据或重新启用被治理停用的资源。
