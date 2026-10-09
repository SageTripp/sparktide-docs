---
title: "API 参考"
productVersion: "0.1"
updated: "2026-09-29"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 实现
---

# API 参考

本区主要记录**底座 HTTP 契约**，供平台集成、非标准客户端与回调实现查询。第一次接入优先使用[双 SDK 教程](../教程/README.md)，无需手写这些请求。

推荐浏览器访问业务后台 `/api/ai`，对应的 11 个聊天操作由后台 Starter 提供、前端 SDK 封装，见[后台标准 HTTP API](../开发接入/业务后台SDK.md#http-与方法)和[前端方法](../开发接入/前端SDK.md#方法层)。**下列 `/v1` 地址是底座接口，不是浏览器推荐连接的地址。**

底座接口以 `/v1` 开头，采用 Bearer 身份；匿名 `/actuator/health` 是部署健康检查。请求和响应使用 UTF-8 JSON，事件可使用 SSE。

## 按任务查找

- [身份与应用](./身份与应用.md)：应用创建、身份查询、凭据签发撤销、默认入口。
- [能力注册](./能力注册.md)：应用八类 Registry、公共模型、固定版本发布和撤销。
- [聊天与任务](./聊天与任务.md)：聊天、Run、会话、事件、确认与取消。
- [运维接口](./运维接口.md)：活动、指标、审计、托管文档、租约和归档。
- [数据结构](./数据结构.md)：请求、定义、Run、错误的完整字段。
- [事件协议](./事件协议.md)：事件类型、游标和消费规则。
- [错误处理](./错误处理.md)：HTTP 错误和运行失败的处理策略。

## 机器契约

[下载 OpenAPI JSON](/downloads/openapi.json) · [下载 AgentEvent Schema](/downloads/agent-event.schema.json)

[下载业务聊天 HTTP 契约](/downloads/business-chat.openapi.json)：标准前缀 `/api/ai`，由业务后台接入认证，与底座共用 Run / 事件语义。

这些文件与平台 protocol 模块的当前契约同步。运行中的平台也通过 `/v1/openapi` 与 `/v1/schemas/agent-event` 提供，需要有效凭据。

## 通用请求头

| 请求头 | 何时使用 |
| --- | --- |
| Authorization: Bearer … | 所有 /v1 调用 |
| Content-Type: application/json | 有 JSON 请求正文 |
| Accept: application/json | 普通响应、chat 受理、事件快照 |
| Accept: text/event-stream | chat 直接流式或 events 订阅 |
| If-Match: "revision" | 更新草稿、切换默认入口；含双引号 |
| Idempotency-Key | 创建同一次聊天任务；业务工具回调中为 callId |
| Last-Event-ID: runId:sequence | 只读取该序号之后的事件 |

## 请求示例

```bash
curl --fail-with-body "$SPARKTIDE_BASE_URL/v1/me" \
  -H "Authorization: Bearer $SPARKTIDE_USER_TOKEN" \
  -H 'Accept: application/json'
```

应用身份不能访问其他应用；用户不能读取 Registry 定义。客户端应保留 traceId 用于排障，不暴露完整服务内部错误。JSON 定义拒绝未知字段，省略与显式 null 不能随意互换。

外部业务知识 1.0 提供 [Knowledge 回调 Schema](/downloads/knowledge-callback.schema.json)，以及[接入说明](../开发接入/知识接入/外部知识协议与权限过滤.md)。该回调地址由业务系统提供。
