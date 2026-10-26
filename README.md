# SparkTide · 启澜产品文档

## 当前文档维护入口（2026-10-26）

文档已按 **认识产品 → 跑通公开示例 → 接入已有系统 → 构建能力 → 部署与参考** 重组。首页使用与正文一致的三栏文档布局；导航、技术栈入口、入门及接入路线重新设计。旧专题 URL、教程顺序和 26 个兼容跳转保留。

- 公开固定制品仍为 **0.1.0**；新版接入描述内部后台 **0.1.1-auth.20261023-6** 与配套前端候选 tgz，不能混用。固定下载、Maven、示例和发行附件本轮未改。
- `npm run docs:api` 从随站契约生成 HTTP 参考；`npm run docs:build` 构建；`npm run docs:check` 同时检查站内链接、孤立页面、版本提示、首页结构与关键旧锚点。
- 根路径与 `/SparkTide/` 子路径检查均覆盖 110 个 HTML、11366 个本地链接/资源/锚点。发布后仍须验证搜索、代码标签和桌面/手机交互，不把静态检查称作浏览器验收。
- 构建输出 `/build-info.json` 和每页 `sparktide-docs-revision` 元数据，用于核对线上实际提交。`sourceDirty` 明确区分未提交工作树与干净提交；Actions 使用 `GITHUB_SHA`。
- 历史记录中的旧检查次数、候选批次与契约摘要只对应当次记录，不代表本次重新核验。当前随站 OpenAPI 的 SHA256 为 `404e7cac586f043d141f2ef339b3c3d4da5b2b705997abf169deb4b84dd72e90`，包含 137 个操作、198 个数据结构；本次没有重新声明其与私有平台最新分支逐字节一致。

下文保留维护历史和发行约束。站点发布仍沿用 `codex/docs → dev → release/0.1 → master`，手动触发现有 `deploy.yml`，不改变公开范围与域名。

面向开发者的产品文档：初识 → 新版 SDK 接入 → 能力专题 → SDK / HTTP 参考 → 部署与治理。公开 0.1.0 连续教程作为固定制品路线单独保留。常规接入优先双 SDK，管理平台是辅助入口。

## 阅读与目录

文档使用简体中文领域目录；docs/README.md 通过 VitePress rewrites 输出首页 index.html。每个领域有 README 导航。docs/.vitepress/navigation.mts 按阅读任务组织侧栏，教程显式前后顺序，技术参考按主题折叠；原专题 URL 保留。

代码标签按四类分别联动：Java / Kotlin、React / Vue、npm / pnpm / Yarn、Gradle Kotlin DSL / Gradle Groovy DSL / Maven。选择会同步本页同类标签，并在站内导航及刷新后恢复；不含所选项的代码组保留原选择。浏览器禁止本地存储时仍支持同页及站内导航联动。新增示例继续使用原生 `code-group` 和这些标签名称即可；其他文件名或标签保持独立。实现来源：`docs/.vitepress/theme/useSyncedCodeGroups.ts`，更新日期：2026-10-09。

[新版 SDK 接入（内部开发候选）](docs/开发接入/SDK简化接入.md) 展示 Provider/Model/Agent 类型化声明、现有业务认证私有传递、createClient 和 React/Vue3/Vue2 统一状态，明确区分候选源码与公开 0.1.0。2026-10-09 根路径与 /SparkTide/ 子路径均完成构建及检查：110 个 HTML、11140 个本地链接/资源/锚点通过。预览服务在重新构建后可能保留旧 HTML，需要重启相应预览进程再检查新资源。

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

## 2026-10-23 通用基建下沉增量

状态：接入文档和本机候选验收记录已同步；SDK -6/1.2.1 尚未公开发行。来源：SDK Starter Kotlin 源码、平台本轮 ADR、safeOps 公共 Service 与前端 session。责任人：SparkTide 维护者。

当前指南使用后台候选 **0.1.1-auth.20261023-6**，12 模块已统一安装到隔离本机 Maven 文件仓库；-6 完整 clean build 为 542 项中 517 通过、25 条件跳过、0 失败。SDK 自动装配 Origin/CORS、query 凭据保护、原主体/功能权限适配及错误协议，业务仅按需提供 BusinessPrincipalMapper。safeOps AI 接入目录由 33 文件/3197 行降为 6 文件/408 行，工具调用原公共业务 Service，原 Shiro/数据权限继续生效。前端入口直接 agents.resolve、项目筛选调用公共 options API，24 项与生产构建通过，前端 SDK 包无变化。

卡片只在前端声明 props/Renderer，后台 @RenderWith 与业务 DTO 自动生成服务端结果校验合同，不要求导出或复制 ui-catalog.json；safeOps 两组件及映射统一为 1.1.0。-6 已修复原权限拒绝的 401/403 分类，未知业务异常保持 503；safeOps 原生 Java8 消费者 clean/package 24/24 通过，SDK 依赖统一为 -6，最终 Jar 不含 ui-catalog.json；最终浏览器三场景、23 项运行检查和原认证 32/32 已通过，浏览器 UI 20/20、完整恢复/退出与测试夹具还原均通过，本轮本机隔离候选验收完成。

本轮真实浏览器三场景均成功，6 次模型调用共 12483 Tokens，知识核验与精确来源预览通过；六工具真实 HTTP/数据库 10 项检查通过。浏览器 UI 20/20、历史/退出和夹具还原通过；53=50+3，后续 GET/改名/注销无额外 Run。新增公共业务代码也计入后的保守净减少为 2073 行。下方 -4/1.1.1 记录保留原批次，不挪作本轮证据。24 项消费者验证不代表原业务全项目测试，7 项 DynamicDataSourceTest 缺驱动未通过；25 项 SDK 条件跳过、Grok 超时和 Go 402 仍单列。公开固定版本、ZIP/Maven/示例未改。当前范围见[版本说明](docs/产品支持/版本说明.md#基础设施下沉与业务服务复用)。本轮文档根路径与 /SparkTide/ 均构建检查通过：110 个 HTML、11344 个本地链接/资源/锚点、26 个旧跳转；最后恢复根路径。跨仓契约守卫通过，5 份公开契约逐字节一致，OpenAPI 700621 字节。最终日志为本仓 .work-docs-final6-* 和隔离 round2/final6/reports/docs-contract-guard.log。

## 2026-10-23 新版 SDK 指南与固定版本边界

状态：文档同步与本地静态验收完成，未发布。来源：双 SDK 当前声明/认证/状态 API、内部候选和构建日志。责任人：SparkTide 维护者。

首页、导航、阅读地图和 SDK 索引优先指向类型化注解与现有业务认证接入；Provider/Model 配置归属、API Key 来源、模型类型引用、自定义适配器、原认证链重入以及 React/Vue3/Vue2 统一状态均已同步。后台候选为 0.1.1-auth.20261023-4，完整构建 525 项（500 通过、25 条件跳过），12 模块统一生成内部制品。增加 DeepSeek 独立适配器、DeepSeekProvider.Model 示例、ModelOptions 归属及默认非思考协议说明。本轮 Go 请求为厂商 HTTP 402，未宣称成功实网对话，也未把构建或认证链路测试称作浏览器/生产验收。

八篇连续教程显式标为公开 0.1.0 固定制品路线。examples、公开 Maven、固定版本下载 ZIP 保持原样；docs/public 唯一变化是按字节同步当前未版本化 openapi.json，不表示重新发行旧固定包。教程 ZIP SHA256 为 F92D86CF671710EEEFCEF4CD4710B3D872C74CE7339A5181E0525820262B8885。没有重新打包或覆盖固定发行附件，也没有为候选虚构下载 URL。当前 OpenAPI SHA256 为 EE17F0A4C18BBB5CB411A5DE16DF2B4D42016E15A1F398AACC93212B0641D129；已运行 docs:api 生成 137 个操作、198 个数据结构，生成器支持本地参数引用，business-auth 私有三头不会显示为 undefined。

官方 DeepSeek deepseek-flash 在 safeOps 后台 -4 / 智能体 1.1.1 上的进度、预警、知识规则三场景均成功、全部断言通过、零跳过；原始业务认证、真实 SQL、卡片、知识引用/核验/预览、历史、有序 SSE 与事件无认证材料均进入验收。早期异步流权限拒绝与修后平台 455 JUnit / 86 JavaScript 回归分别保留；Pi 官方 DeepSeek 并行审查也已完成并复核。详见[本轮验证范围与诊断记录](docs/产品支持/版本说明.md#本轮验证范围)，不把 Go 的 402 记为成功。

验证：npm ci 成功；根路径与 /SparkTide/ 均执行 docs:build 和 docs:check，通过 **110 个 HTML、11335 个本地链接/资源/锚点**，生成 26 个旧地址跳转；最后恢复根路径构建。公开指南中的 API 依据 SDK 源码与其已有样例测试核对，本站未另将所有说明性片段作为独立应用编译。独立受控模型 fixture 的 9 项业务 HTTP 结果属于前置 885AB33C 包，作为历史保留；当前 -history-auth 候选已实际重装，95 项 SDK 回归、三框架类型、safeOps 23 项与生产构建通过，另有本机 HTTP 四场景通过（12 个 GET，无业务登录/数据库/模型）。真实浏览器失败历史 7 项检查通过；1687152E 前置包的真实模型浏览器三场景均成功，最终包 GET/退出复验 9 项通过，历史/来源/中文提示及退出清空正常，无新增 Run 或模型调用。日志为本仓 ignored 的 .work-docs-*.log。依赖安装仍报告 4 项已有构建依赖审计，未在文档任务中自动升级。

## GitHub Pages 发布

2026-10-23 本次发布范围为文档站、SDK 接入说明及当前 HTTP 契约参考。按 codex/docs → dev → release/0.1 → master 推进已验证文档，再手动触发 deploy.yml；不公开新的 SDK/底座二进制，不覆盖固定 0.1.0 附件。

正式文档域名为 `sparktide.stdev.fun`。DNS 使用 CNAME：主机记录 `sparktide`，记录值 `sagetripp.github.io`，TTL 600；记录值不包含协议或仓库路径。GitHub Pages 的 Custom domain 设置为同一域名，HTTPS 证书由 GitHub 签发。

当前使用 Actions 发布，域名以 GitHub Pages 设置为准，不依赖 CNAME 文件。`configure-pages` 返回自定义域名的根路径，现有 `DOCS_BASE` 自动适配；设置域名后重新部署，检查首页、教程、静态资源与 Maven 校验值。原 GitHub Pages 地址及已发布的 Maven URL保留为跳转入口。需要回退时清除 Pages 自定义域名并重新部署，恢复仓库子路径；不改动已发布版本与附件。

本目录应作为文档仓库的根目录（package.json 与 .github 同级）。若放在大仓库子目录，需调整工作流工作目录、缓存依赖路径和上传目录。Pages → Source 选择 GitHub Actions；完成 Pages 配置后，手动在 master 分支触发部署工作流。工作流仅接受 master，普通推送不会发布站点。实际 base 从 configure-pages 元数据读取，支持仓库子路径或自定义域名。

本目录作为独立文档仓库维护。2026-10-09 用户授权将文档及三个代码仓库上传至 SageTripp 个人账号，三个代码仓库保持私有；文档仓库和二进制制品按后续授权公开。部署工作流已对齐 master 分支，本次分支初始化不触发部署。部署过程参考 [VitePress 官方部署说明](https://vitepress.dev/guide/deploy#github-pages)。

四个仓库已创建；三个代码仓库私有、文档仓库公开：

- [sparktide-platform](https://github.com/SageTripp/sparktide-platform)：工作分支 feature/platform-foundation。
- [sparktide-backend-sdk](https://github.com/SageTripp/sparktide-backend-sdk)：工作分支 feature/backend-sdk。
- [sparktide-frontend-sdk](https://github.com/SageTripp/sparktide-frontend-sdk)：工作分支 feature/frontend-sdk。
- [sparktide-docs](https://github.com/SageTripp/sparktide-docs)：工作分支 codex/docs。

四个仓库统一采用 master（主分支及 GitHub 默认分支）、dev（开发集成分支）、release/0.1、release/0.2 和上述工作分支。首次建立这些分支时引用已验证的上传版本；这不是正式产品发行。release/0.1 用于 0.1 版本发布准备，release/0.2 作为下一版本预备分支，尚无 0.2 制品或发行标签。后续工作分支经审查后合入 dev，准备发布时从 dev 更新对应 release 分支，完成验证后由维护者合入 master 并创建发行标签；发布修复同步回 dev。不直接在 master / dev 上开发，不自动清理仍在使用的工作分支，没有额外创建 main。

仓库统一使用 sparktide 主题，保留各自独立 Git 历史。首次代码上传仅包含各仓库已有提交，平台及 SDK 的未提交改动仍留在本地。发布配置在干净的 release/0.1 副本完成；本地未提交功能修改不进入 0.1.0 制品。

## 二进制发行维护

公开渠道：Pages 文档与 Maven 二进制目录、本文档仓库 GitHub Release、GHCR 底座镜像。Java/Kotlin 不发布源码 Jar；前端发布 dist 与类型声明；三个源代码仓库始终私有。固定版本不可覆盖，回滚消费上一版本，不改写已发布制品。

1. 在三个代码仓库的 release 分支手动运行 `release.yml`，后台和底座传入固定版本。它们执行完整测试、打包，底座还检查镜像启动与未认证请求拒绝行为。
2. 用 `gh run view` 核对成功结论、分支和源码提交。下载 `backend-release`、`frontend-release`、`platform-release` 到外部目录的 backend、frontend、platform 子目录。
3. Actions 附件域名不可达时，可在同一代码仓库运行 `export-release.yml`，填写成功构建编号与组件名；它核对构建来源并创建私有中转 Release。通过 `gh release download` 获取相同附件，不重新构建、不改变镜像。
4. 运行下面的准备命令；校验 manifest、SHA256、Maven ZIP 范围及前端包范围。脚本将二进制 Maven 文件加入 docs/public/maven，并更新两个示例的安装包完整性锁值。发行附件输出目录必须为空。

```powershell
python scripts/prepare-release.py --version 0.1.0 --artifacts 'D:\发行构建附件' --output 'D:\发行公开附件'
npm run docs:examples
npm run docs:build
npm run docs:check
```

5. 审查、提交文档与公共 Maven 目录，在本文档仓库创建固定版本 Release 并上传公开附件及 SHA256SUMS；发行说明记录实际构建编号、提交和镜像 digest。本地大文件上传受限时，可先建立包含校验清单的草稿 Release，再运行 `release-platform-jar.yml`，传入已验证的版本和公开镜像 digest；它从该镜像提取 Jar，按原始构建 SHA256 校验后上传，不重新构建、不覆盖已有附件。
6. 维护者将 GHCR package 可见性设为 Public。核对三个代码仓库仍为 private，然后分别验证匿名下载 Maven、前端 tgz、Jar 与镜像。
7. 合入 master，手动触发 `deploy.yml`。检查公网子路径、SDK 安装、教程消费及 Pages 工作流结果；许可证或厂商实网验收不能从构建成功推断。

## 维护与发布信息

- 状态：已确认；日期：2026-09-29；责任人：SparkTide 维护者。
- 关联任务：产品使用手册重构；来源：平台 Api.kt/Registry.kt/运行配置、两类 SDK 源码与协议文件。
- 适用版本：公开制品统一 0.1.0，源码开发构建默认 0.1.0-SNAPSHOT，HTTP /v1、事件 1.0。
- 固定版本分发见“开始使用/版本与获取”；许可证和商业支持由产品所有者补充，不虚构授权。
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

教程源码和正文必须一致：后台构建、模型配置、YAML 和两套前端入口的完整代码块应与示例文件一致。运行验证解压下载 ZIP 后消费公开 Maven / GitHub Release 制品；不能只对仓库工程依赖运行测试。业务聊天下载契约来自 protocol/src/main/resources/business-chat.openapi.json，与普通底座 /v1 OpenAPI 区分。

本轮变更前备份：C:/Users/zhang/AppData/Local/Temp/sparktide-doc-restructure-20261009-095315。回滚时停止文档预览，从备份恢复 docs、scripts、README、package.json，删除本轮新增 examples/入门聊天 并重新构建；先确认目标仍在文档目录内，保留本轮后其他修改。进入 Git 管理后优先使用反向提交回退，保留后续修改。

验证：根路径和 /SparkTide/ 子路径构建与链接检查均通过，109 个 HTML、10939 个站内链接、资源和锚点有效。下载包解压后，后台工程、Java 工具与知识示例、Kotlin 声明示例、React / Vue 严格类型检查及构建通过。使用独立安装的 SDK 和本地 SSE 协议替身验证首轮对话、续聊、历史和改名；未进行厂商实网或生产部署验证。

## 新版 SDK 调用指南（2026-10-11）

开发版指南已按模块声明、已有登录、统一配置、完整聊天界面与任务 API 重写；包含多个助手和共享知识、生产校验边界及自主/固定组件的区别。公开 0.1.0 教程保留，开发版明确标注未发行及未完成范围。根路径与 /SparkTide/ 构建和站内检查通过：110 个 HTML、11147 个链接/资源/锚点。浏览器核对新页面及三组 Kotlin 标签同步选择，未发现页面控制台错误；未推送或发布。
