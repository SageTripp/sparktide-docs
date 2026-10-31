---
title: HTTP 接入
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/shared-spring/src/main/kotlin/dev/sparktide/sdk/spring/SparkTideChatController.kt
  - sparktide-backend-sdk/shared-spring/src/main/kotlin/dev/sparktide/sdk/spring/SdkHttpErrors.kt
  - sparktide-backend-sdk/shared-spring/src/main/kotlin/dev/sparktide/sdk/spring/ChatSecurityFilter.kt
  - sparktide-frontend-sdk/src/client.ts
  - sparktide-frontend-sdk/src/ai-client.ts
  - sparktide-frontend-sdk/src/follow-ups.ts
  - sparktide-platform/contracts/business-chat.openapi.json
  - sparktide-platform/packages/governance/src/conversations/execution-follow-ups.ts
---

# HTTP 接入

业务页面和自建客户端调用业务后台的聊天前缀，默认 `/api/ai`。这条路由由后端 SDK 的 `SparkTideChatController` 提供，合同标记为响应头 `X-SparkTide-Contract: business-chat/v1`。平台根地址和应用凭据只配置在业务后台。浏览器不直接调用平台管理接口。

已使用前端 SDK 时不需要手写这些请求，行为以 [前端接入](./前端接入.md) 为准。本章给不能依赖该包的 HTTP 客户端。路径相对 `sparktide.http.path`。平台侧的字段说明在 `sparktide-platform/contracts/business-chat.openapi.json`，事件结构在 `sparktide-platform/contracts/agent-event.schema.json`。下面的路径、状态码和错误外壳以控制器和 `SdkHttpErrors` 为准。

## 请求如何认证

沿用调用业务系统其他 API 的方式：Cookie 加现有 CSRF，或 `Authorization: Bearer`，或业务自定义头。查询串里不要放 token。跨源时 Origin 必须落在 `sparktide.chat.security.allowed-origins`，或与业务站点同源。

写操作的幂等：

| 操作 | `Idempotency-Key` |
| --- | --- |
| `POST /chat` | 可以省略，省略时服务端为这一次生成，不会自动重发 |
| 跟进提交、摘要、标题、后续意图 | 必须由调用方提供。结果未知时用同一键和同一请求再读，不换键重发 |
| 跟进编辑、删除、控制 | 使用修订号：编辑在正文，删除用 `If-Match`，控制放在 JSON 的 `revision` |

成功的 JSON 响应带 `Cache-Control: no-store`。

## 发送一条消息

`POST /api/ai/chat`，正文只允许这些字段：`protocolVersion`、`appId`、`message`、`conversationId`、`agentId`、`agentVersion`、`context`、`client`。

```http
POST /api/ai/chat HTTP/1.1
Content-Type: application/json
Authorization: Bearer <现有业务令牌>
Idempotency-Key: 3f1c0b1e-6a4a-4e0a-9c2e-0b5a9a1d7e11

{
  "message": {"role": "user", "content": "查询 pump-01 的状态"},
  "agentId": "main",
  "agentVersion": "1.0.0",
  "context": {"projectId": "p-17"},
  "client": {"uiCapabilities": ["equipment.status@1.0.0"]}
}
```

约束：

- `message.role` 必须是 `user`。`content` 由前端 SDK 限制为 1 到 16384 个字符；自建客户端保持同一范围。
- 写了 `protocolVersion` 时必须是 `1.0`。
- 写了 `appId` 时必须等于后台的 `sparktide.application`，否则 403 `PERMISSION_DENIED`。可以省略，由后台固定应用范围。
- `agentId` 与 `agentVersion` 成对出现，版本是已发布的精确版本。名称解析用下一节的入口，失败时不要改叫默认智能体。
- `context` 是 JSON 对象。前端 SDK 限制深度 32、编码后 64KiB。不要放令牌。
- `client` 里目前只认 `uiCapabilities`，元素是字符串。

提交成功返回运行对象。之后用 `GET /api/ai/runs/{id}/events` 订阅 SSE，`Accept: text/event-stream`。恢复时带已经确认的 `Last-Event-ID`。另一条 `GET /api/ai/runs/{id}/stream` 是原生流读取。两条都占用聊天流配额，默认最多 32 路，单路时限默认 650000 毫秒。配额用尽返回 429 `QUOTA_EXCEEDED`。事件帧过大或上游中断时连接结束，已提交的运行不会因此重放。

取消是单独的 `POST /api/ai/runs/{id}/cancel`。关闭 SSE 只停止本地读取。

## 路由

| 方法与路径 | 作用 |
| --- | --- |
| `POST /chat` | 提交用户消息 |
| `GET /agent-entries/{id}` | 解析已发布智能体的精确版本，不回退默认入口 |
| `POST /conversations` | 创建会话。正文可含 `title`，省略时为空字符串，成功 201 |
| `GET /conversations?limit&offset&archived` | 列出会话。控制器默认 `limit=20`、`offset=0`。`archived` 只能是单个 `true` 或 `false` |
| `GET /conversations/{id}?limit&before` | 读取会话和一页消息。省略 `limit` 时控制器使用 20。用响应里的 `nextBefore` 取更早一页 |
| `PATCH /conversations/{id}` | 正文 `{"title"}` 改名 |
| `POST /conversations/{id}/archive` 与 `/restore` | 归档或恢复，保留历史 |
| `DELETE /conversations/{id}` | 删除。活动会话由服务端拒绝，本调用不取消任务 |
| `POST /conversations/{id}/edits` | 原位编辑并重新生成，保留旧快照 |
| `GET /runs/{id}` | 读取当前身份可见的既有任务 |
| `POST /runs/{id}/cancel` | 请求取消 |
| `POST /runs/{id}/confirm` | 正文 `confirmationId`、`decision`。不自动重试 |
| `GET /runs/{id}/citations/{citation}/preview` | 重新授权后读取引用或业务查询快照 |
| `GET /runs/{runId}/artifacts/{artifactId}/content` | 下载平台托管文件，响应为 PDF 附件，不代理任意 URL |
| `GET /runs/{id}/events` 与 `/runs/{id}/stream` | SSE 与原生流 |
| `GET /streaming/capabilities` | 读取当前部署声明的流式能力 |
| `GET /follow-ups/capabilities` | 跟进合同。当前平台实现返回 `modes: ["QUEUE","STEER"]` 与 `maxItems: 32` |
| `GET /conversations/{id}/follow-ups` | 跟进回执投影，最大读取 4MiB |
| `POST /conversations/{id}/follow-ups` | 提交跟进，成功 202。必须带幂等键 |
| `PATCH /conversations/{id}/follow-ups/{inputId}` | 编辑未认领的 `QUEUE`，正文含当前 `revision` |
| `DELETE /conversations/{id}/follow-ups/{inputId}` | `If-Match` 为条目修订 |
| `POST /conversations/{id}/follow-ups/control` | 正文 `protocolVersion`、`revision`、`action`。`action` 为 `PAUSE`、`RESUME`、`STOP` |
| `GET /conversations/{id}/summary` | 读取已保存摘要，不调用模型 |
| `POST /conversations/{id}/summary` | 受理摘要生成，202，必须带幂等键。SDK 控制器不在这一跳里轮询 |
| `POST /conversations/{id}/suggestions` | 受理后续意图，不执行这些意图 |
| `POST /conversations/{id}/title/generate` | 受理标题生成。覆盖手工标题时才在正文带 `overwrite: true` |
| `GET /conversations/{id}/metadata-operations/{operationId}` | 读取已受理的摘要、标题或意图操作，不再次调用模型 |
| `POST /conversations/{id}/inputs/{inputId}/answer` | 提交待回答表单，202 |
| `POST /conversations/{id}/inputs/{inputId}/cancel` | 取消待回答输入 |

跟进、摘要、标题、后续意图、归档、恢复和取消待回答输入的正文都要带 `protocolVersion: "1.0"`。摘要生成只接受这个字段；后续意图还可以带 `count`，省略时控制器按 3 转发；标题生成还可以带布尔 `overwrite`，省略为 false。归档、恢复和取消待回答输入的正文只有协议版本。取消待回答输入不使用幂等键。`QUEUE` 禁止带 `runId`；`STEER` 必须带目标 `runId`，并且不能改 `agentId` 或 `uiCapabilities`。消息长度 1 到 16384。受理后的状态是 `ACCEPTED`、`APPLIED`、`REJECTED` 或 `CANCELLED`。`ACCEPTED` 只表示进入队列或等待安全点。

会话历史的单页消息在前端解析器中超过 20 条会视为非法响应。自建客户端按 `nextBefore` 翻页，编辑分支后从第一页重新读。

## 错误外壳

控制器上的 `PlatformException` 保留 400 到 599 的状态码和机器码，正文固定为：

```json
{"error": {"code": "UNAUTHENTICATED", "message": "SDK request could not be completed"}}
```

消息不包含上游正文、堆栈或凭据。状态码不在该范围时对外为 502，机器码仍是原码。非法 JSON 或参数是 400 `INVALID_REQUEST`。未分类异常是 503 `UPSTREAM_UNAVAILABLE`。Shiro 或 Spring Security 的认证失败映射为 401 `UNAUTHENTICATED`，授权失败映射为 403 `PERMISSION_DENIED`。

入口过滤器在请求尚未进入已认证 MVC 时，可能只返回 `{"error":{"code":"..."}}`。常见机器码：

| 状态 | 机器码 | 何时出现 |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | 没有可映射的登录，或查询串携带凭据 |
| 403 | `PERMISSION_DENIED` | 应用超出后台固定范围，或原框架拒绝功能权限 |
| 403 | `ORIGIN_REJECTED` | Origin 不在允许列表，也不是本站 |
| 403 | `CSRF_REQUIRED` | Cookie 写请求的 CSRF token 不一致；没有 Spring Security CSRF 时，又缺少同源 Origin 或 `X-Requested-With` |
| 400 | `INVALID_REQUEST` | 字段、类型或协议版本不被接受 |
| 412 | `REVISION_MISMATCH` | 跟进修订号缺失或不是合法整数 |
| 429 | `QUOTA_EXCEEDED` | 并发事件订阅达到 `sparktide.chat` 的 `maxStreams` |
| 503 | `UPSTREAM_UNAVAILABLE` | 控制器已关闭、流执行器不可用，或未分类内部错误 |

前端 SDK 把合法的机器码放进 `SparkTideError.code`，并保留 `status`。本地失败使用状态 0，例如 `CLIENT_RESET`、`CLIENT_DISPOSED`、`CLIENT_AUTH_INVALID`。`retryable` 即使为真，SDK 也不自动重发写请求。自建客户端同样只在调用方明确要求时，用原幂等键恢复同一次意图。

## 与平台 HTTP 的边界

`PlatformClient` 使用后台持有的应用凭据访问平台，适合注册、发布和运维，不嵌入页面。业务聊天的用户身份通过上一节的登录转发。页面如果需要平台上的会话或运行，走 `/api/ai` 下的对应路径，由后台换成用户委托后再请求平台。

直接拼接平台管理 URL、或把 `sparktide.platform.credential` 发到浏览器，都不在本接入路径里。运维接口见 [部署运维](../部署运维/README.md)。
