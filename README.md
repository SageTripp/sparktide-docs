# 启澜文档网站

当前维护 **0.2.0** 文档。网站按「快速开始、开发接入、能力指南、控制台操作、部署运维、参考资料」组织；平台、SDK 和配套组件统一使用产品版本，公共协议号、业务资源号和第三方版本独立维护。

## 目录与维护职责

| 目录 | 内容 | 维护职责 |
| --- | --- | --- |
| `docs/README.md` | 全站入口 | 维护当前文档入口 |
| `docs/版本/README.md` | 版本目录 | 说明可阅读版本与发行状态 |
| `docs/0.2.0/` | 当前版本六个栏目 | 按平台与 SDK 实际实现维护 |
| `docs/public/版本/0.2.0/` | 对应版本机器合同 | 与平台 `contracts/` 字节一致 |
| `docs/.vitepress/versions.json` | 版本注册与组件映射 | 新增版本时登记 |
| `skills/0.2.0/` | 开发 Agent Skills 与版本参考映射 | 修改 SKILL.md，引用页从本套文档生成 |
| `examples/0.2.0/` | 面向使用者的独立示例应用 | 仅引用 SDK 制品，不包含平台或 SDK 实现 |
| `归档/旧站/` | 本次整理前的旧文档、下载和样例 | 只保存，不进入构建和搜索 |
| `.work/` | 本地核对、构建、验收记录 | 不提交，不作为公开文档 |

维护人：启澜维护者。更新日期：2026-10-31。每个领域有 README，介绍阅读顺序与边界。源证据写在页面 frontmatter；教程讲操作，能力指南讲用法，参考页讲字段，控制台手册讲实际页面。

## 本地验证与预览

沿用 VitePress 1.6.4 与已有 npm 锁文件，不引入新站点框架。

```powershell
mise exec node@24.22.1 npm@10.9.4 -- npm ci
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:api
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:examples
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:skills
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:build
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:check
mise exec node@24.22.1 npm@10.9.4 -- npm run docs:preview -- --host 127.0.0.1 --port 4173
```

子路径验证：设置 `DOCS_BASE=/SparkTide/` 后重新 build/check，随后恢复 `/` 构建供本地审阅。检查覆盖实际 HTML、链接、资源、锚点、页面可达性、版本上下文、栏目隔离和归档隔离。构建记录输出 `build-info.json`，标明代码提交及工作区修改状态。

## 品牌图片

页面使用压缩后的 WebP 主图、96px Logo 和独立的 48px PNG 标签页图标；原始 PNG 保留供后续制作，页面不直接加载。更新原图后，在已安装 Pillow 的本地 Python 环境运行 `python scripts/compress-brand-images.py`，再构建并检查画质。主图保留原分辨率和透明通道，首页单独预加载，不让文档页下载主图。

## 同步机器合同

权威来源为平台仓库 `contracts/` 中的 `openapi.json`、`business-chat.openapi.json`、`agent-event.schema.json`、`knowledge-callback.schema.json`、`remote-model.schema.json`。复制到当前版本的静态目录，再执行 `npm run docs:api`；也可 `npm run docs:api -- 0.2.0` 指定已登记版本。

HTTP接口目录由生成脚本维护，不手改生成页。中文字段说明维护在 `scripts/reference-fields.mjs`；入口错误说明维护在 `scripts/reference-errors.mjs`；领域错误说明和状态快照分别维护在 `scripts/reference-domain-errors.json` 与 `scripts/reference-domain-statuses.json`，应对照对应版本实现更新。机器合同包含预留操作，能力边界必须核对服务装配，并在生成页标明未开放接口；不能把合同完整性当运行可用性。

## 维护示例与标签

Java / Kotlin 业务代码使用同一个 `code-group`，标签固定为 `Java`、`Kotlin`；构建脚本使用 `Gradle Kotlin DSL`、`Gradle Groovy DSL`、`Maven`。前端框架示例使用 `React`、`Vue 3`、`Vue 2`，通用脚本使用 `TypeScript`、`JavaScript`。各类选择分别保存并跨页面联动；同一浏览器的文档标签页也同步选择。

示例源码放在文档仓库的 `examples/<版本>/`，只引用配套 SDK 制品，不能复制平台或 SDK 实现、凭据和构建缓存。`docs:examples` 从示例目录生成当前版本 ZIP 与 SHA-256 校验文件，供本地站点下载；这一步不上传 GitHub，也不发布 SDK 制品。示例依赖或代码变化后重新打包，再构建和检查站点。

## 维护 Agent Skills

`skills/<版本>/` 提供后端接入、前端接入、模型配置和问题排查四个 Skill。修改 `SKILL.md` 与 `references.json` 映射；`references/` 从对应版本公开文档生成，不手改。执行 `npm run docs:skills` 生成离线参考、四个单独 ZIP、合集与 SHA-256 校验文件。下载包只包含清单中明确列出的 Skill 和参考 Markdown，不包含 SDK 私有实现、制品与凭据。

文档字段或 Skill 规则更新后重新生成，再构建与检查站点。上线新产品版本时分别维护新目录和映射，不覆盖旧包。

## 新增文档版本

1. 确认新平台与配套 SDK / 组件的真实版本和制品状态。
2. 新建 `docs/<版本>/` 与 `docs/public/版本/<版本>/`，维护完整的六栏目和该版合同。已发布旧版目录不能被覆盖。
3. 在 `versions.json` 登记版本，更新 `current` 与版本目录。各套正文使用自己的相对链接。
4. 更新站点首页的当前版本说明，生成新版本参考，运行两种 base 的构建与检查。
5. 审核实际能力、获取方式、版本差异与搜索结果，再由用户决定是否发布。

当前只有 0.2.0 一套在线构建。历史归档不是可发布的旧版本文档；如将来恢复历史版本，必须先按其当时实现独立核对。搜索当前仅包含本套文档；增加版本时须重新检查跨版本搜索的标识与体验。

## 发布边界

文档使用 GitHub Pages 工作流发布，与平台、Maven 和 npm 制品发行相互独立。发布前完成构建与检查，获得授权后推送并触发工作流，再核对线上构建版本和下载内容。固定旧制品保存在归档中，不覆盖其字节，不把版本声明对齐称为 SDK 公开发行。
