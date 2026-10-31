---
name: sparktide-backend
description: 使用启澜 SparkTide 0.2.0 的 Java/Kotlin 后端 SDK 接入现有业务系统，声明智能体、工具和知识，复用登录与数据权限。用于业务集成，不用于修改启澜平台执行引擎。
metadata:
  product: SparkTide
  product-version: "0.2.0"
  status: development
---

# 启澜后端接入

先确认业务项目实际的 Java、Spring Boot、SDK 版本和构建方式。本文对应 **0.2.0 开发版本**；不同版本先取得匹配文档，不能直接套用 API。

## 选择依赖与参考

- Java 17 / Boot 4：`dev.sparktide:sdk-spring-boot-starter:0.2.0`，传递 `sdk-java`。
- Java 8 / Boot 2.6.6：`dev.sparktide:sdk-spring-boot2-starter:0.2.0`，传递 `sdk-java8`。两套核心不能混用。
- Kotlin 扩展 `sdk-kotlin` 基于 Java 17 核心，不能混进 Java 8 线。Spring MVC 的 `suspend` 控制器另外需要协程 Reactor 适配。
- 供应商适配器按实际服务另加；不能只依赖 `sdk-model-spi` 就调用模型。
- 0.2.0 尚未公开发行。先确认维护者提供的 Jar/POM 或私有制品仓库，不能把 `mavenCentral()` 当作已能取得启澜制品，也不要求用户取得 SDK 私有源码。

先读[后端接入](references/后端接入.md)确认注解和配置；涉及登录、回调或多租户时再读[身份与权限](references/身份与权限.md)。配置键与注册生命周期查[Boot 4 启动器](references/SpringBoot4启动器.md)或[Boot 2 启动器](references/SpringBoot2启动器.md)；Boot 2 使用对应依赖与 `javax` 体系，不能照搬 Jakarta 导入。

## 实施接入

1. 在现有业务进程中集成 SDK，复用现有 Service、认证与数据权限，不另起一套业务后端。
2. 用 `@AiProvider` 声明地址和密钥来源，用 `@AiModel` 指向带配置的 Provider 子类。Java 嵌套 Model 不自动绑定外层自定义 Provider；显式填 `provider`。`model` 是真实模型标识，不解析 `${...}`。能力未经验证保留 `UNKNOWN`。
3. 用 `@Agent` 指定模型、工具和知识；一个应用最多一个 `defaultAgent`。用 `@Tool` 声明明确的输入、输出和读写效果；涉及业务变更时按 SDK 的确认机制请求批准，不绕过审批。`@Knowledge` 的结果继续执行业务文档权限过滤。
4. 从已认证的主体映射 `UserIdentity`，多租户读真实租户字段。请求正文里的 userId、appId、普通 context 和浏览器自报角色都不是可信身份。
5. 浏览器只访问业务后台 `/api/ai`。`sparktide.platform.credential` 留在后台；回调配置应让平台可达，回调凭据与用户登录不是同一用途。调用原业务 API 时使用回调上下文提供的认证材料，不把它写入日志或模型输入。
6. 依照现有发布模式核对注册报告。生产模式使用已发布的定义；集成代码的授权不自动包含发布、部署或修改运行数据。

## 验证结果

按项目已有构建流程编译，核对注册报告、真实用户发送、权限拒绝、多租户隔离、取消与历史恢复。只有得到服务端运行终态才报告真实聊天成功；编译通过只证明源码与依赖兼容。缺少制品、平台或测试身份时明确列出缺项，继续完成能独立验证的代码。

工具结果未知时先核对业务记录，不自动重放。同一写入意图保留原幂等键，不因超时换键再发。
