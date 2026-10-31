---
title: "前端 SDK：统一客户端与聊天状态"
productVersion: "本轮开发候选，公开 0.1.0 不含此入口"
updated: "2026-10-23"
status: "已实现，本轮业务浏览器验收通过；生产另记"
owner: "SparkTide 维护者"
source: "ai-client.ts、chat-store.ts、run-handle.ts 与框架适配器"
---

# 前端 SDK：统一客户端与聊天状态

常规接入只用 createClient、一份 auth 和一个 ChatPanel。根入口只公开业务 API，平台管理功能在 `/platform`；旧 createChatClient、ChatSession/Workspace/Controller 和 hook overload 已从新公共入口删除，不混用两代状态层。框架接入见[React / Vue / Vue2](React与Vue.md)。

## 安装与版本

使用维护者提供、与本轮后台及平台配套的候选 tgz，在 npm/pnpm/Yarn 中按本地文件或内部制品 URL 安装。**尚无这些 API 的新公共发行包**，公开 0.1.0 下载地址仍只对应[旧固定版本教程](../教程/README.md)。不虚构候选下载 URL。

## 客户端与认证

```ts
import {createClient} from '@sparktide/frontend-sdk';
const ai = createClient({
  baseUrl: '/api/ai',
  auth: {
    type: 'bearer',
    token: () => loginStore.token,
    identityKey: () => loginStore.sessionRevision
  }
});
```

baseUrl 是原业务后台入口，不是平台管理地址。auth 支持三种模式，token/headers/CSRF 读取器支持 Promise，每次请求和 SSE 重连重新读取。

| 模式 | 配置 | Cookie 默认策略 |
| --- | --- | --- |
| Bearer | type: 'bearer', token | omit |
| 已有 Cookie | type: 'cookie', csrfToken?, csrfHeader?, credentials? | same-origin |
| Shiro/Basic/自定义头 | type: 'headers', headers, credentials? | omit |

```ts
// Shiro 等已有认证
const ai = createClient({baseUrl: '/api/ai', auth: {
  type: 'headers',
  headers: () => ({token: loginStore.token}),
  identityKey: () => loginStore.sessionRevision
}});
```

省略 auth 时使用同源 Cookie。Cookie 模式自动附加 X-Requested-With，CSRF 优先接业务现有机制；跨源 Cookie 仍需业务 CORS/CSRF 配置。禁止在认证头中覆盖协议头、SDK 私有传递头、重复头或换行。普通 context 仅放业务 JSON，不放 token、可信身份或权限。

identityKey 是本地隔离信号，不发给服务端，也不是身份依据。使用非秘密的主体/租户/登录代次，注销返回 null；token 续期但身份未变时保持不变。身份变化会关闭旧观察、清理消息/引用并拒绝迟到响应。reset() 可显式触发本地清理；dispose() 永久释放客户端。二者都不替代原业务注销，也不自动取消后台任务。

## 无框架聊天与任务 API

```ts
const chat = ai.createChat({agent: 'business-assistant'});
const off = chat.subscribe(() => render(chat.getState()));
chat.start();
// 页面卸载：off(); chat.dispose();
```

render 是业务自己的视图函数，框架组件会自动维护订阅与释放。ChatStore 统一管理 messages、parts、status、error、会话、审批、引用和恢复；业务无需解析原始 SSE 或拼接工具增量。每条历史助手消息的 runSnapshot 携带该任务自己的已授权来源与核验，无需另写 HistoryLoader、重放句柄或缓存。

失败、取消和超时的会话即使只保存了用户条目，SDK 也会通过其 runId 读取已授权事件，恢复已经产生的部分回答、卡片和终态错误；只读恢复不会重新发送问题。事件过期时保留已保存文本和终态说明，不补造卡片；授权拒绝关闭当前视图。业务可以按稳定 error.code 提供中文提示，内部诊断 message 不必直接作为产品文案。

```ts
const task = await ai.chat.run({message: '查询订单', agent: 'business-assistant'});
const run = await task.completed();
if (run.status === 'SUCCEEDED') display(task.getState().text);
```

display 是业务展示函数。completed() 返回后台终态，FAILED、CANCELLED、TIMED_OUT 也是终态，需要检查 status。连接错误拒绝 Promise；重新等待只恢复同一任务，不重新提交。

| API | 含义 |
| --- | --- |
| agents.resolve(name) | 解析已发布的精确版本，失败不回退默认智能体 |
| chat.run(input) | 提交一次消息，返回共享 RunHandle |
| runs.get(id) | 读取既有任务并取得句柄，不重新聊天 |
| conversations.create/list/get/messages/send/rename/delete | 使用当前认证访问业务会话 |
| citations.preview(runId, id) | 使用当前请求认证重新授权预览，不借用旧缓存 |
| createChat(options) | 创建统一 ChatStore，手动环境自行 start/dispose |

中止提交、断开订阅或卸载组件不表示取消后台业务。显式停止使用状态层 stop() 或任务句柄 cancel()；确认由用户操作 approve/reject。普通 chat/confirm 等写入不自动重试，SSE 重连只恢复读取。

## 入口与业务筛选无需 AI 元数据层

入口可用性直接 `await ai.agents.resolve('business-assistant')`，复用同一认证并取得精确发布版本；拒绝时关闭入口，不回退另一智能体。业务不再为聊天创建 bootstrap、feature descriptor 或项目元数据 Controller。

项目、设备等筛选项调用已有业务 API，响应转换为页面自己的选项即可。safeOps 使用公共 `/project/info/options`，快捷项展示复用原导航权限，原后台 Service 判定真实数据范围。HTTP 200 仍可能包含业务拒绝码，必须遵守原业务响应合同；不要将返回状态当授权。身份切换期间的迟到业务筛选响应也需由现有页面生命周期丢弃。

## 卡片无需复制目录到后端

组件名、精确版本、props 和 Renderer 统一在前端 defineAiComponent 声明。后台只有 @RenderWith 名称/版本映射与原业务输出 DTO，SDK 自动生成服务端输出校验合同。普通接入不需要导出、上传、复制 ui-catalog.json 或后端再维护一套 UI Schema；exportComponentCatalog 仅保留为可选调试导出。safeOps 当前两组件升为 1.1.0，与业务声明 1.2.1 的工具映射精确一致，旧已发布 1.0.0 保留不覆盖。

## 权限与渲染边界

前端只把现有认证送到业务后台，后端封装的私有认证胶囊不会返回前端。业务服务决定实际数据权限；认证失败关闭旧授权视图。props Schema、组件精确版本与 fallback 由 SDK 校验，文本安全展示，不执行模型返回的任意脚本。

当前前端 SDK 本地 95 项回归与三个框架类型样例通过；本轮 safeOps Vue2/Webpack4 的固定 tgz 消费、24 项业务回归和生产构建通过；SDK 包仍为原 95 项已验证包，无 API 或依赖变化。最终 -6/业务 1.2.1/UI 1.1.0 已完成真实浏览器三场景和 UI 20/20 检查，23 项运行检查及原认证 32/32 通过；reload 恢复三类历史/卡片/核验/1.2.1 预览，原退出后 back/reload 仍在登录页。仅新增 3 个 Run，后续操作无额外模型调用，专用夹具已还原。以下实网与浏览器记录归前轮 -4/1.1.1，不替代本轮证据。前置候选的受控模型实 HTTP 9 项结果作为历史保留；当前 -history-auth 候选另有本机受控 HTTP 四场景通过，全部请求为 GET，未读取业务凭据或调用模型。初轮官方 DeepSeek `deepseek-flash` 三个真实业务 HTTP 场景全部成功、零跳过，前置 1687152E 包的实时浏览器三场景也均成功；它与 OpenCode Go 的 HTTP 402 分开记录。最终包的浏览器 GET/退出复验 9 项通过，部分回答、两张原始卡片、中文预算提示、成功会话和知识来源均恢复；原业务退出会清空视图，返回仍为登录页，没有新增运行或模型调用。生产验收单独记录，见[本轮验证范围](../产品支持/版本说明.md#本轮验证范围)。配套迁移路线见[类型化接入](SDK简化接入.md)。
