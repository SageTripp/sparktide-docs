---
title: "HTTPS、网关与浏览器接入"
description: "HTTPS、网关与浏览器接入 · SparkTide 启澜产品文档"
productVersion: "0.1"
updated: "2026-09-29"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 源码及 HTTP 契约
topic: "部署与运维"
docGoal: "完成基础对话后，按需查阅本专题的配置、SDK 方法与行为约束。"
---

# HTTPS、网关与浏览器接入

正式用户入口使用 HTTPS。将网页与 `/v1` 放在同一 origin，可以让 SDK 使用当前站点地址，避免额外跨域和凭据配置。

## Nginx 配置示例

下面是宿主 Nginx 代理宿主回环平台的示例。证书、域名和限流策略由你的部署环境提供；替换实际文件路径后检查配置再加载。

```nginx
server {
    listen 443 ssl;
    server_name agent.example.com;
    ssl_certificate /etc/nginx/tls/fullchain.pem;
    ssl_certificate_key /etc/nginx/tls/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 650s;
        proxy_send_timeout 650s;
        client_max_body_size 256k;
    }
}
```

关闭缓冲以便及时交付 SSE 事件；`proxy_read_timeout` 是上游读取间隔超时，不是任务预算。配置语义见 [Nginx 代理模块](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)。

如果 Nginx 本身运行在容器中，`127.0.0.1` 指该容器，需改为同网络的平台服务地址。不要照抄宿主地址。

## 与已有网站共存

已有前端通常只需把 `/v1/` 转发给平台。管理控制台可以放在受限的独立域名。前端 SDK 的 `baseUrl` 是代理根地址，例如 `https://business.example.com`，SDK 会追加 `/v1/apps/{appId}`，不要再加一次 `/v1`。

不要把 CORS 的允许来源与 `SPARKTIDE_ALLOWED_ORIGINS` 混淆，后者仅限制平台出站。若必须跨域，由你的可信网关明确限制来源、方法和请求头，并测试 Authorization、Last-Event-ID 与 Idempotency-Key。

## 上线检查

1. HTTPS 证书有效，HTTP 按组织规范转向 HTTPS。
2. 管理接口及控制台受访问策略保护，平台仍执行自身鉴权。
3. 小文本请求可以收到 202，事件连接持续到终态且逐步到达。
4. 断线后按游标恢复，不重复创建任务。
5. 请求体、连接数和速率限制与业务使用范围一致。
