---
title: 前端 SDK
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-frontend-sdk/package.json
  - sparktide-frontend-sdk/packages/ui-basic/package.json
  - sparktide-frontend-sdk/packages/ui-dashboard/package.json
  - sparktide-frontend-sdk/packages/ai-components/package.json
---

# 前端 SDK

业务页面使用 `@sparktide/frontend-sdk@0.2.0`。界面包和通用组件也是 `0.2.0`，并且 peer 精确依赖核心 `0.2.0`。四个包都是 `private`，尚未发布到 npm registry。本页保留为稳定入口，字段表在对应依赖章节。

安装见 [接入总览](../开发接入/接入总览.md)。页面步骤见 [前端接入](../开发接入/前端接入.md)。

## 入口

| 导入 | 章节 |
| --- | --- |
| `@sparktide/frontend-sdk` 以及 `/react`、`/vue`、`/vue2`、`/platform` | [前端核心](./SDK依赖/前端核心.md) |
| `@sparktide/ui-basic` 的 `/react`、`/vue`、`/vue2` 和 `style.css` | [基础界面](./SDK依赖/基础界面.md) |
| `@sparktide/ui-dashboard` 的同名子路径 | [大屏界面](./SDK依赖/大屏界面.md) |
| `@sparktide/ai-components` 及 `/react`、`/vue`、`/vue2`、`/vite` | [通用展示组件](./SDK依赖/通用展示组件.md) |

依赖 `eventsource-parser@4.1.3`。React peer 为 `>=18 <20`，Vue peer 为 `^2.6.0 || ^3.5.0`。Node 引擎是 `>=22 <23`。

## createClient

`baseUrl`、`auth`、`timeoutMs`、`identityKey`、`chat.run`、`createChat` 和 `registerComponents` 的约束在 [前端核心](./SDK依赖/前端核心.md)。TypeScript 与 JavaScript 的可检查源码在文档仓库 `examples/0.2.0/core-client`。

## 组件契约

`defineAiComponent` 与 `s` 由核心导出，用法见 [自定义界面](../开发接入/自定义界面.md)。通用合同 `common.genui`、`common.genui-form`、`common.genui-question`、`common.genui-icons` 见 [通用展示组件](./SDK依赖/通用展示组件.md)。视觉部件名单见 [基础界面](./SDK依赖/基础界面.md)。

## 错误边界

`SparkTideError` 的本地码和服务端机器码在 [前端核心](./SDK依赖/前端核心.md)。HTTP 外壳见 [HTTP 接入](../开发接入/HTTP接入.md)。
