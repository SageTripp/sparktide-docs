---
title: Docker 部署
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - Dockerfile
  - compose.yaml
  - scripts/container/health.mjs
  - apps/server/src/cli/initialize-database.ts
---

# Docker 部署

根 `Dockerfile` 与 `compose.yaml` 是 Node 服务的容器入口。默认目标 `runtime` 不含 Java。初始化服务固定使用 `runtime`，并且只有 `--profile setup` 才会出现。


下面的命令供目标环境使用。阅读或构建文档时不要执行它们。

## 范围

容器用户、卷和健康检查以仓库文件为准。变量表见 [环境变量](./环境变量.md)。恢复见 [升级与恢复](./升级与恢复.md)。

## 步骤

在仓库根目录、已经确认目标机器和端口之后执行。

1. 注入编排必填变量。`compose.yaml` 使用 `:?`，缺失会直接失败，文件内没有口令或令牌默认值。

```powershell
$env:SPARKTIDE_DB_PASSWORD = Read-Host 'SPARKTIDE_DB_PASSWORD'
$env:SPARKTIDE_ADMIN_TOKEN = Read-Host 'SPARKTIDE_ADMIN_TOKEN'
```

2. 只初始化数据库。`initialize` 会设置 `SPARKTIDE_ALLOW_DATABASE_INITIALIZATION=true`，连到健康的 `database` 后执行 `dist/apps/server/src/cli/initialize-database.js`。

```powershell
docker compose --profile setup run --rm initialize
```

3. 确认初始化日志出现表结构已安装的说明，并且没有把生产口令打进终端记录。然后启动主服务。默认构建目标是 `runtime`。

```powershell
docker compose up -d main
```

4. 需要解析器时，先明确这是另一次构建，再启动。该目标追加 Temurin `17.0.16` JRE 和解析器 JAR，不安装 OCR。

```powershell
$env:SPARKTIDE_NODE_BUILD_TARGET = 'runtime-parser'
docker compose up -d main
```

5. 用完后从当前进程删除口令：

```powershell
Remove-Item Env:SPARKTIDE_DB_PASSWORD
Remove-Item Env:SPARKTIDE_ADMIN_TOKEN
```

宿主只应通过 `127.0.0.1` 和 `SPARKTIDE_NODE_HOST_PORT`（缺省 `18092`）访问。容器内绑定 `0.0.0.0` 是为了让端口映射生效，不表示要对公网监听。

## 配置

| 项 | 文件中的值 |
| --- | --- |
| 项目名 | `sparktide-node-candidate` |
| 数据库 | `postgres:17`，库 `sparktide`，用户 `sparktide`，数据卷 `node-postgres-data` |
| 数据库健康 | `pg_isready -U sparktide -d sparktide`，间隔 5 秒，超时 3 秒，重试 20 次 |
| 主服务命令 | `node dist/apps/server/src/main.js` |
| 镜像用户 | uid/gid `10001`，名称 `sparktide` |
| 暴露端口 | 容器 `18092` |
| 健康检查 | 每 30 秒，超时 5 秒，启动宽限 90 秒，重试 3 次。执行 `node scripts/container/health.mjs` |
| 停止 | `SIGTERM`，编排 `stop_grace_period` 为 30 秒 |
| 日志 | `json-file`，单文件 50MB，保留 5 个 |
| 解析器临时目录 | `/var/lib/sparktide/parser-tmp`，模式 `0700`，属主 `10001` |
| 解析器入口 | `/usr/local/bin/sparktide-node-entrypoint` 写入四项 `SPARKTIDE_NODE_PARSER_*` 后执行原 Node 命令 |

默认 `runtime` 不设置任何 `SPARKTIDE_NODE_PARSER_*`。不要在编排文件里给 `runtime` 补一套猜测的 classpath。

口令含特殊字符时，不要依赖编排拼接出来的 URL。改为显式设置已经正确编码的 `SPARKTIDE_NODE_DATABASE_URL`。用户名和库名仍须与目标库一致。

`initialize` 的构建目标写死为 `runtime`。它不需要 Java 才能建表。

## 结果

- 初始化成功时进程打印日志、控制、治理和执行结构已初始化，然后退出。`restart` 为 `no`。
- 主服务健康检查先请求 `/actuator/health/readiness`，要求 JSON 中 `status` 为 `UP` 且 `implementation` 为 `nodejs`。控制台启用时再请求 `/console/`，要求 HTML。
- 未初始化或执行器锁丢失时，就绪为 503，容器变为 unhealthy。
- 第二个 `main` 连同一数据库会在启动阶段失败，不能把副本数调到 2 来获得多活。

## 相关页

- [部署准备](./部署准备.md)
- [独立进程部署](./独立进程部署.md)
- [环境变量](./环境变量.md)
- [升级与恢复](./升级与恢复.md)
- [监控与排障](./监控与排障.md)
- [版本与发布](../能力指南/版本与发布.md)
