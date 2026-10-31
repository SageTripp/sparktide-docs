---
title: "HTTP 接口"
productVersion: "0.2.0"
updated: "2026-10-31"
source: "sparktide-platform/contracts；scripts/generate-reference.mjs；scripts/reference-errors.mjs；scripts/reference-fields.mjs"
---

# HTTP 接口


::: warning 合同与开放范围
本页是本版本随附机器合同的字段参考，合同包含预留操作，不代表每个接口都已开放。调用前先查[当前能力与限制](../能力与限制.md)。失败时请结合本页错误表与[公共错误码](../公共错误码.md)处理。
:::

平台协议版本为 `1.0.0`，文档对应平台版本为 `0.2.0`，两者用途不同。机器下载与生成页一起保存在本版本命名空间。

## 按任务查询

- [身份与应用](身份与应用.md)
- [能力与知识](能力与知识.md)
- [聊天与任务](聊天与任务.md)
- [治理与运维](治理与运维.md)
- [业务聊天接口](业务聊天接口.md)
- [数据结构](数据结构.md)
- [业务数据结构](业务数据结构.md)

## 错误码

操作页说明各 HTTP 状态和入口错误。认证、限流、容量、运行与领域错误码见[公共错误码](../公共错误码.md)。

## 下载机器合同

- [openapi.json](/版本/0.2.0/openapi.json)
- [business-chat.openapi.json](/版本/0.2.0/business-chat.openapi.json)
- [agent-event.schema.json](/版本/0.2.0/agent-event.schema.json)
- [knowledge-callback.schema.json](/版本/0.2.0/knowledge-callback.schema.json)
- [remote-model.schema.json](/版本/0.2.0/remote-model.schema.json)

## 调用前确认

1. 浏览器调用业务后台聊天网关；管理与平台客户端按平台合同调用。
2. 身份来自受信认证边界，不能用 appId 或普通 context 代替授权。
3. 创建请求保留同一业务意图的幂等键；未知结果先读取原记录，不自动重发写操作。
4. HTTP 成功不等于任务成功；按事件或任务终态判断执行结果。
