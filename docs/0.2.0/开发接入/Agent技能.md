---
title: Agent 技能
productVersion: "0.2.0"
updated: "2026-10-31"
---

# Agent 技能

把启澜的接入规则交给你的开发 Agent，让它根据 **0.2.0 的真实 SDK** 编写代码、选择依赖和定位问题。每个 Skill 都包含 `SKILL.md` 与按需读取的离线参考，无需访问启澜私有源码。

## 选择与下载

[下载全部 Skills](/版本/0.2.0/sparktide-agent-skills-0.2.0.zip) · [SHA-256 校验](/版本/0.2.0/sparktide-agent-skills-0.2.0.zip.sha256.txt)

| Skill | 什么时候用 | 单独下载 |
| --- | --- | --- |
| `sparktide-backend` | 现有后台接入、Java / Kotlin 声明、业务工具、身份与权限 | [ZIP](/版本/0.2.0/sparktide-backend-skill-0.2.0.zip) · [SHA-256](/版本/0.2.0/sparktide-backend-skill-0.2.0.zip.sha256.txt) |
| `sparktide-frontend` | 选择前端依赖，接入 React、Vue 3、Vue 2 或普通 JS / TS 页面 | [ZIP](/版本/0.2.0/sparktide-frontend-skill-0.2.0.zip) · [SHA-256](/版本/0.2.0/sparktide-frontend-skill-0.2.0.zip.sha256.txt) |
| `sparktide-models` | 配置供应商、模型注解、OpenAI 兼容服务与 HTTP 传输 | [ZIP](/版本/0.2.0/sparktide-models-skill-0.2.0.zip) · [SHA-256](/版本/0.2.0/sparktide-models-skill-0.2.0.zip.sha256.txt) |
| `sparktide-troubleshooting` | 根据错误码、运行状态、事件与权限信息排查问题 | [ZIP](/版本/0.2.0/sparktide-troubleshooting-skill-0.2.0.zip) · [SHA-256](/版本/0.2.0/sparktide-troubleshooting-skill-0.2.0.zip.sha256.txt) |

## 交给 Agent 使用

1. 下载并解压，保留各 Skill 中的 `SKILL.md` 与 `references/` 相对位置。
2. 如果 Agent 支持 Skills，将所需文件夹复制到它支持的项目级 skills 目录，按该工具的方式启用。无需一次启用全部四个。
3. 如果没有 Skills 加载功能，让 Agent 先读取对应 `SKILL.md`，再按任务读取其中引用的文件；可把整个文件夹作为项目上下文提供。
4. 告诉 Agent 项目的真实运行时、框架、已有登录方式和任务目标。不要把密钥、用户凭据或业务正文粘贴进提示词。
5. 审查生成代码，并用配套制品编译与验证。Skill 的存在不代表真实服务已连接成功。

这些包是开发指导，不是 SDK 安装包，也不会自动修改项目或发布服务。当前 `0.2.0` 制品获取方式见[接入总览](./接入总览.md)。版本不一致时先核对对应版本文档，不能直接套用。

## 提问示例

### 后端接入

```text
请先阅读 sparktide-backend/SKILL.md，按需读取 references。
我的应用使用 Java 8、Spring Boot 2.6.6，已有登录和数据权限过滤。
请先检查依赖，再把已有的任务查询 Service 接成启澜工具。
沿用当前用户身份和权限，提供依赖、声明、配置和最小验证步骤。
启澜和 SDK 使用 0.2.0；配套制品已放在项目约定的本地仓库。
```

### 前端接入

```text
请先阅读 sparktide-frontend/SKILL.md。
当前项目是 Vue 3，登录采用同源 Cookie，业务后台的聊天入口为 /api/ai。
请复用现有布局接入基础聊天面板，说明退出登录和切换用户时的清理方式。
不要把平台应用凭据放到浏览器，先检查配套 SDK 包和样式入口。
```

### 模型配置与排查

```text
请先阅读 sparktide-models/SKILL.md，使用启澜 0.2.0 的公开配置类型。
我们已有 OpenAI 兼容网关和已确认的模型标识，密钥由宿主配置注入。
请给出带参数注释的 Kotlin 声明；不要猜测模型能力、单价和上下文窗口。
遇到失败时再阅读 sparktide-troubleshooting/SKILL.md，依据实际错误码定位。
```

## 内容与维护

Skills 源文件与公开示例一起维护在文档仓库的 `skills/0.2.0/`。包内参考从本套文档生成，只包含对应任务需要的页面；参考页的其他文档路径可在同版本网站中查阅。

指导覆盖接入方式和真实能力边界，不代替项目已有规范、人工审查与业务验收。参考：[后端 SDK](../参考资料/后端SDK.md) · [前端 SDK](../参考资料/前端SDK.md) · [公共错误码](../参考资料/公共错误码.md)。
