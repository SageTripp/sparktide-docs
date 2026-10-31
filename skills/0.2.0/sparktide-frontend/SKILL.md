---
name: sparktide-frontend
description: 使用启澜 SparkTide 0.2.0 前端核心 SDK、基础或大屏组件，在 React、Vue 3、Vue 2、JavaScript 或 TypeScript 页面接入业务助手，处理登录隔离与生命周期。
metadata:
  product: SparkTide
  product-version: "0.2.0"
  status: development
---

# 启澜前端接入

本 Skill 对应 **0.2.0 开发版本**。先读项目已有框架、版本、登录方式和组件库，保持用户选择的技术栈。不要为展示聊天面板迁移框架。

## 选择包与入口

| 需求 | 依赖或入口 |
| --- | --- |
| 请求、会话状态，无视觉 | `@sparktide/frontend-sdk` |
| React 状态 | `@sparktide/frontend-sdk/react` |
| Vue 3 状态 | `@sparktide/frontend-sdk/vue` |
| Vue 2 状态 | `@sparktide/frontend-sdk/vue2` |
| 普通聊天界面 | `@sparktide/ui-basic` 的相应框架子路径 |
| 大屏聊天界面 | `@sparktide/ui-dashboard` 的相应框架子路径 |
| 通用业务展示组件 | 可选 `@sparktide/ai-components` |

四个包均为 `0.2.0`，组件要求同版本核心。包目前未公开发行，取得维护者提供的 tarball 后再安装，不把公网 npm 安装当作可用。核心声明 Node `>=22 <23`；React peer 为 `>=18 <20`，Vue 为 `^2.6.0 || ^3.5.0`。不要把平台 Node 24 的要求机械套给消费 SDK 的前端工程，也不要修改其他项目的全局运行时。

先读[前端接入](references/前端接入.md)里的框架完整组合，准确参数查[前端核心](references/前端核心.md)。组合视觉或卡片时读[自定义界面](references/自定义界面.md)，不要凭组件名字猜 props。

## 实施

1. `createClient({baseUrl: '/api/ai', auth: ...})` 连接业务后台的聊天前缀，不连接平台管理地址。`/platform` 是受控运维入口，不是业务聊天客户端。
2. 用已有 Cookie、Bearer 或自定义头配置 `auth`。`identityKey()` 返回用户、租户和登录代次对应的非秘密标识，注销返回 `null`；它不发送到服务端，也不授予权限。没有配置时，在注销/换用户时显式 `ai.reset()`。平台应用凭据不能进浏览器。
3. React 使用 `SparkTideProvider` / `useChat`；Vue 3 使用 `SparkTidePlugin` / `useChat`；Vue 2 使用插件 / `createChatMixin`。`ChatPanel` 从视觉包导入，并导入同一视觉包的 `style.css`。同一聊天区不要叠加 basic 与 dashboard 两套样式。
4. 无框架页面用客户端实例的 `ai.createChat(...)`；直接 `ai.chat.run` 取得任务句柄并不自动订阅。保持 SDK 的事件合并和恢复逻辑，不另写一个竞争的聊天状态机。
5. 业务卡片先 `defineAiComponent`，再在创建聊天前 `registerComponents`。组件 id/version、props 契约应与后台 `@RenderWith` 一致；前端注册不会向平台发布组件。
6. `reset()` 清本地身份相关状态，`dispose()` 释放客户端；它们不取消服务端运行。停止操作使用 `task.cancel()` 或聊天动作的取消接口。

## 验证

类型检查后，在真实页面检查发送、流式显示、切换身份后的清理、卸载释放和显式取消。审批、引用、文件、跟进只展示服务器声明可用的能力。`QUEUE` / `STEER` 或组件存在不代表部署已开启。错误的 `retryable` 标志不触发自动重放写请求。

代码交付注明验证到类型检查、浏览器交互还是实际平台终态，不把演示数据描述为真实业务结果。
