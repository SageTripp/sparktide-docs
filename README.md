# SparkTide · 启澜产品文档

面向开发者的产品文档：初识 → 连续教程 → 能力专题 → SDK / HTTP 参考 → 部署与治理。常规接入优先双 SDK，管理平台是辅助入口。

## 阅读与目录

文档使用简体中文领域目录；docs/README.md 通过 VitePress rewrites 输出首页 index.html。每个领域有 README 导航。docs/.vitepress/navigation.mts 按阅读任务组织侧栏，教程显式前后顺序，技术参考按主题折叠；原专题 URL 保留。

| 领域 | 内容 |
| --- | --- |
| 开始使用 | 产品分工、阅读地图、版本获取；旧快速开始仍可进入教程 |
| 教程 | 准备、应用、后台、前端、验证、工具与知识、业务登录与上线 |
| 部署运维 | Docker、Jar、环境变量、HTTPS、集群、备份升级、排障 |
| 使用指南 | 应用权限、模型、智能体、工具、知识、UI、运行 |
| 开发接入 | 项目接入、业务后台 SDK（Java/Kotlin）、前端 SDK、React/Vue、回调 |
| 接口参考 | 身份、Registry、任务、运维、数据结构、事件、错误 |
| 产品支持 | 常见问题、版本说明、贡献与支持 |

## 开发与验证

```powershell
npm ci
npm run docs:api
npm run docs:build
npm run docs:check
npm run docs:preview -- --host 127.0.0.1 --port 4173
```

Node.js 22/24，VitePress 固定 1.6.4。本地验证不需要设置系统代理或关闭 TLS。原项目 .npmrc 配置保留。

子路径部署验证：

```powershell
$env:DOCS_BASE='/SparkTide/'
npm run docs:build
npm run docs:check
Remove-Item Env:DOCS_BASE
npm run docs:build
npm run docs:check
```

不要直接双击 HTML 使用本地搜索；使用 HTTP 预览。检查器验证构建中的站内文件、资源和锚点，包括旧地址跳转。

## 更新 API

平台权威来源为 protocol/src/main/resources/openapi.json 与 agent-event.schema.json。更新时按字节同步到 docs/public/downloads，再执行 npm run docs:api。该命令生成四个 API 分组和数据结构页，其余用户教程人工维护。不要只修改生成页而漏改契约。

## GitHub Pages 发布

本目录应作为文档仓库的根目录（package.json 与 .github 同级）。若放在大仓库子目录，需调整工作流工作目录、缓存依赖路径和上传目录。Pages → Source 选择 GitHub Actions；完成 Pages 配置后，手动在 master 分支触发部署工作流。工作流仅接受 master，普通推送不会发布站点。实际 base 从 configure-pages 元数据读取，支持仓库子路径或自定义域名。

本目录作为独立文档仓库维护。2026-10-09 用户授权将文档及三个代码仓库上传至 SageTripp 个人账号，均设为私有；上传源码与部署 Pages 分开处理。部署工作流已对齐 master 分支，本次分支初始化不触发部署。部署过程参考 [VitePress 官方部署说明](https://vitepress.dev/guide/deploy#github-pages)。

四个私有仓库已创建并核对远端提交：

- [sparktide-platform](https://github.com/SageTripp/sparktide-platform)：工作分支 feature/platform-foundation。
- [sparktide-backend-sdk](https://github.com/SageTripp/sparktide-backend-sdk)：工作分支 feature/backend-sdk。
- [sparktide-frontend-sdk](https://github.com/SageTripp/sparktide-frontend-sdk)：工作分支 feature/frontend-sdk。
- [sparktide-docs](https://github.com/SageTripp/sparktide-docs)：工作分支 codex/docs。

四个仓库统一采用 master（主分支及 GitHub 默认分支）、dev（开发集成分支）、release/0.1、release/0.2 和上述工作分支。首次建立这些分支时引用已验证的上传版本；这不是正式产品发行。release/0.1 用于 0.1 版本发布准备，release/0.2 作为下一版本预备分支，尚无 0.2 制品或发行标签。后续工作分支经审查后合入 dev，准备发布时从 dev 更新对应 release 分支，完成验证后由维护者合入 master 并创建发行标签；发布修复同步回 dev。不直接在 master / dev 上开发，不自动清理仍在使用的工作分支，没有额外创建 main。

仓库统一使用 sparktide 主题，保留各自独立 Git 历史。首次代码上传仅包含各仓库已有提交，平台及 SDK 的未提交改动仍留在本地；没有将它们打成临时存档提交。文档仓库包含本轮重构和示例，未启用 Pages 或公开制品发布。

## 维护与发布信息

- 状态：已确认；日期：2026-09-29；责任人：SparkTide 维护者。
- 关联任务：产品使用手册重构；来源：平台 Api.kt/Registry.kt/运行配置、两类 SDK 源码与协议文件。
- 适用版本：平台/后台 SDK 0.1.0-SNAPSHOT，前端 0.1.0，HTTP /v1、事件 1.0。
- 公开 GitHub、许可证、制品分发和支持渠道按产品所有者要求集中占位于“产品支持/贡献与支持”，不设置伪链接或虚构授权。
- 主站为真实模型与业务接入路径，不以本地 Provider 替身作为产品使用主流程。
- 旧英文 URL 在构建后输出跳转页，不保留两套互相矛盾的正文，也不进入搜索。
- 旧设计版源码备份：同级 ../备份/git_pages-设计版-20260929-111548（不部署，依赖和构建缓存除外）。
- 回退：停止文档预览后用该备份恢复源码和配置，再重新构建；不修改平台或 SDK 仓库。

## 本轮验证结果（2026-09-29）

| 项目 | 证据 |
| --- | --- |
| 文档规模 | 41 个 Markdown 页面、6 个阅读领域；24 个旧地址跳转 |
| API 完整性 | 41 个 HTTP 操作、22 个数据结构由当前 OpenAPI 生成 |
| 构建与链接 | 根路径与 /SparkTide/ 子路径构建通过；66 个 HTML、3384 个本地链接/资源/锚点通过 |
| 契约同步 | OpenAPI 与 AgentEvent 下载文件 SHA256 与平台原文件一致 |
| 示例检查 | 36 个 JSON 代码块可解析；PowerShell 代码块语法通过 |
| Java 示例 | 注册智能体与类型化工具完整类通过 javac 编译 |
| Kotlin 示例 | 以当前 SDK Jar 编译注册与协程调用示例通过 |
| 前端示例 | TypeScript、UI Renderer、React 示例严格类型检查通过；Vue SFC 脚本与模板编译通过 |
| 浏览器 | 首页、深层页、英文/中文搜索、旧部署地址迁移已检查；390 像素视口正文无横向溢出 |
| 发布状态 | 本地已更新；未推送 GitHub、未执行远端 Actions 或生产部署 |

示例编译验证 API 用法和语法，不替代真实供应商、业务权限、生产容量或业务事务验收。截图与临时示例编译工程位于当前任务工作目录 docs-validation，不进入公开站点。


## 多语言与安装标签页（2026-10-09）

业务后台 SDK 统一在 docs/开发接入/业务后台SDK.md，共用接入、身份、HTTP 合同与发布说明；Java/Kotlin 仅在示例代码标签中区分。后台依赖提供 Gradle Kotlin DSL、Gradle Groovy DSL、Maven 标签；前端提供 npm、pnpm、Yarn 标签，React/Vue 示例使用同一组标签。其他等价 SDK 示例沿用此展示，保留原代码与约束说明。

复用 VitePress 原生 `::: code-group`，代码围栏追加 `[Java]`、`[Kotlin]` 等标题；无新增依赖。每组仅放同一用途的替代示例，不把必须顺序执行的操作藏在不同标签中。语言、构建工具和包管理器分别成组。维护时同步侧栏、阅读导航及 scripts/legacy-routes.json；旧 JavaSDK/KotlinSDK 地址只跳转，不保留副本、不进入搜索。

验证使用 docs:build 和 docs:check，覆盖根路径及 /SparkTide/ 子路径；浏览器检查标签、键盘、390px 视口与旧地址跳转。源码调整前的本地备份位于 TEMP/sparktide-doc-tabs-20261009-091511，恢复对应文件后重新构建即可回滚。文档目录未初始化 Git，平台和 SDK 仓库无本轮新增改动。

本轮最终验证：根路径和 /SparkTide/ 子路径均为 100 个 HTML、8995 个链接/资源/锚点通过；Java/Kotlin、Maven、Yarn、Vue 标签和方向键切换通过，390px 视口无页面横向溢出；静态预览中导航与旧 Java/Kotlin 地址跳转通过。22 篇调整过的接入文档保留原示例代码。


## 开发者文档重构（2026-10-09）

参考 [Jimmer 快速上手](https://babyfish-ct.github.io/jimmer-doc/zh/docs/quick-view/get-started/) 的分步实践与能力专题组织方式，新增 docs/教程、阅读地图和完整入门示例。首页以 SDK 接入为入口，控制台与协议参考从主流程分离。Java / Kotlin、React / Vue 的替代示例使用原生标签页；顺序步骤不放在同一标签组。

示例源在 examples/入门聊天，下载包为 docs/public/downloads/sparktide-tutorial.zip。修改示例后使用 `npm run docs:examples` 重新打包（此维护命令需要 Python 3），然后构建站点。常规站点构建仍只需要 Node，不依赖 Python。脚本排除 .local、data、build、dist、node_modules、SDK tgz；不要手工打包整个工作目录。

教程源码和正文必须一致：后台构建、模型配置、YAML 和两套前端入口的完整代码块应与示例文件一致。运行验证解压下载 ZIP 后消费本地 Maven / npm 制品；不能只对仓库工程依赖运行测试。业务聊天下载契约来自 protocol/src/main/resources/business-chat.openapi.json，与普通底座 /v1 OpenAPI 区分。

本轮变更前备份：C:/Users/zhang/AppData/Local/Temp/sparktide-doc-restructure-20261009-095315。回滚时停止文档预览，从备份恢复 docs、scripts、README、package.json，删除本轮新增 examples/入门聊天 并重新构建；先确认目标仍在文档目录内，保留本轮后其他修改。进入 Git 管理后优先使用反向提交回退，保留后续修改。

验证：根路径和 /SparkTide/ 子路径构建与链接检查均通过，109 个 HTML、10939 个站内链接、资源和锚点有效。下载包解压后，后台工程、Java 工具与知识示例、Kotlin 声明示例、React / Vue 严格类型检查及构建通过。使用独立安装的 SDK 和本地 SSE 协议替身验证首轮对话、续聊、历史和改名；未进行厂商实网或生产部署验证。
