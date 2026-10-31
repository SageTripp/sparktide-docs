---
title: "使用 Docker 部署"
description: "使用 Docker 部署 · SparkTide 启澜产品文档"
productVersion: "0.1"
updated: "2026-10-09"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 源码及 HTTP 契约
topic: "部署与运维"
docGoal: "完成基础对话后，按需查阅本专题的配置、SDK 方法与行为约束。"
---

# 使用 Docker 部署

推荐在生产环境使用 PostgreSQL 持久化数据，将平台放在 HTTPS 网关之后。仓库 Compose 负责启动平台和数据库，不会自动创建模型或业务账号。

## 使用公开镜像

镜像为 Linux amd64，容器以 UID 10001 运行，内含中英文 Tesseract。准备 Docker、部署环境文件及数据库，不需要源码或 GitHub 登录。

```bash
docker pull ghcr.io/sagetripp/sparktide-platform:0.1.0
docker run -d --name sparktide-platform \
  --env-file platform.env \
  -e SPARKTIDE_BIND=0.0.0.0 \
  -p 127.0.0.1:8080:8080 \
  -v sparktide-data:/app/data \
  ghcr.io/sagetripp/sparktide-platform:0.1.0
curl --fail http://127.0.0.1:8080/actuator/health
```

`platform.env` 按[环境变量](./环境变量.md)配置管理员、模型密钥与出站 origin；只供服务进程使用。上面的命名卷持久化本机 H2，适合开发；生产在环境文件中配置 PostgreSQL 的 `SPARKTIDE_DB_URL`、用户与口令，并将底座置于 HTTPS 网关后。管理员凭据为空时管理 API 不接受访问。

容器内 `127.0.0.1` 指向容器自身。访问宿主机业务回调或模型服务时，使用可达的内网地址；Docker Desktop 可使用 `host.docker.internal`，并同步配置 origin 白名单。入门教程采用本机 Jar，避免初次接入时处理容器网络。

固定镜像 digest 见[0.1.0 发行页](https://github.com/SageTripp/sparktide-docs/releases/tag/v0.1.0)的 `platform-manifest.json`。已发布版本不覆盖。容量需以真实模型延迟、业务并发与数据量压测，不把默认并发 8 当作容量承诺。

## 从私有源码自行构建

取得源码权限的维护者仍可使用仓库 Dockerfile / Compose。先运行 `.\gradlew.bat clean build`，复制 `.env.example` 为 `.env` 并配置密钥，再执行 `docker compose config --quiet` 和 `docker compose up -d --build`。该开发构建默认使用 `0.1.0-SNAPSHOT`，与固定版本镜像的分发流程分开。

## 访问与持久化

- 控制台：`http://127.0.0.1:8080/console/index.html`。
- API：`http://127.0.0.1:8080/v1`。
- Compose 默认只映射宿主回环地址的 8080，适合宿主反向代理或安全隧道访问。
- PostgreSQL 数据存入 `postgres-data` 命名卷，Compose 项目名前缀由部署目录/项目名决定。
- 不通过删除卷进行升级或回滚。生产数据需独立备份。

首次健康检查通过后，继续[创建应用与 SDK 接入](../教程/创建应用.md)。如果需要手工管理已有资源，再读[控制台操作](../使用指南/控制台/README.md)。健康检查只验证服务存活；模型、业务工具与用户身份需要各自验证。

## 添加业务回调密钥

通过 `--env-file` 启动时，把实际变量写入环境文件即可。源码仓库的 Compose 模板只注入 `MODEL_API_KEY`。增加业务工具的 `TOOLS_API_KEY` 时，必须同时修改 Compose 的 platform.environment，不能仅在 `.env` 中增加变量。

```yaml
services:
  platform:
    environment:
      SPARKTIDE_ALLOWED_ORIGINS: https://model.example.com,https://business.example.com
      SPARKTIDE_SECRET_NAMES: MODEL_API_KEY,TOOLS_API_KEY
      SPARKTIDE_SECRET_ORIGINS: MODEL_API_KEY=https://model.example.com,TOOLS_API_KEY=https://business.example.com
      MODEL_API_KEY: ${MODEL_API_KEY}
      TOOLS_API_KEY: ${TOOLS_API_KEY}
```

把示例域名替换为实际 origin，将独立密钥注入部署环境后重新创建平台容器。工具定义仅填写 `secretRef: "TOOLS_API_KEY"`。

Compose 的变量替换与容器环境注入是两个步骤，见 [Docker 环境变量说明](https://docs.docker.com/compose/how-tos/environment-variables/set-environment-variables/)。

## 正式访问入口

使用[HTTPS 与网关](./HTTPS与网关.md)配置 TLS、SSE 和访问策略。镜像使用组织审核的固定版本或 digest。多实例不能直接增加当前 Compose 的副本数，需按[集群部署](./集群部署.md)统一模式并调整端口与网关。

## 文件解析与 OCR 镜像

Dockerfile 内含真实 Tesseract 和中英文语言包，不需要另启一个 OCR 服务。构建时需要访问 Ubuntu 的软件源；默认使用发行版源，网络受限时可显式使用已核实的 HTTPS Ubuntu 镜像：

```bash
docker build --build-arg UBUNTU_APT_MIRROR=https://mirrors.aliyun.com/ubuntu/ -t sparktide-platform:local .
```

该参数只影响构建时包下载位置，保留 Ubuntu 软件包签名验证；企业镜像选择仍由运维管理。完整原件容量、任务恢复和读取权限见[文件上传与摄入](../开发接入/知识接入/文件上传解析与摄入任务.md)。扫描质量、语言包与 OCR 内存需要用实际业务文件验证。
