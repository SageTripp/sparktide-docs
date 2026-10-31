# 启澜 0.2.0 Agent Skills

将需要的 Skill 文件夹交给开发 Agent。每个目录包含 `SKILL.md` 和任务所需的 `references/` 离线参考；必须一起保留。也可复制到 Agent 支持的项目级 skills 目录。不同工具的安装位置不同，以该工具的配置为准。

| Skill | 用途 |
| --- | --- |
| `sparktide-backend` | 在已有 Java / Kotlin 服务中接入智能体、业务工具与身份 |
| `sparktide-frontend` | React、Vue 3、Vue 2 或普通 JS / TS 页面接入 |
| `sparktide-models` | 模型供应商、模型声明和 HTTP 传输配置 |
| `sparktide-troubleshooting` | 根据错误码、运行状态与身份边界定位问题 |

直接使用示例：请先阅读 `sparktide-backend/SKILL.md`，按需读取其引用文件，再帮助我将启澜接入现有业务后台。先检查我的运行时、依赖和登录方式，沿用原 Service 与数据权限。

这些 Skill 适用于启澜 **0.2.0 开发版本**，不适用于未知版本。它们提供接入指导，不包含 SDK 制品、私有源码或凭据，也不会自动安装、调用服务或发布应用。使用真实服务时仍需开发者提供已授权的环境与配套制品。

维护者修改各 `SKILL.md`；离线参考由文档仓库的 `npm run docs:skills` 生成，不能手改。升级启澜时应重新核对 API、运行时、发布状态与错误边界，再生成同版本的新包。
