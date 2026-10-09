---
title: "业务后台 SDK（Java / Kotlin）"
productVersion: "0.1"
updated: "2026-10-09"
status: 已确认
owner: SparkTide 维护者
source: 平台与 SDK 实现
topic: "SDK 参考"
docGoal: "查 JVM 安装、Spring 配置、声明与标准 HTTP API；动手操作先走教程。"
---

# 业务后台 SDK（Java / Kotlin）

业务后台 SDK 支持 Java、Kotlin 和 Spring。它把业务工具、知识和权限接入底座，也为前端提供标准聊天 HTTP API；会话存储和模型执行留在底座。Java 核心要求 JDK 17，不依赖 Kotlin 或 Spring；Kotlin 模块复用核心，源码使用 Kotlin 2.3.20。本文共用同一接入流程，差异示例按 Java / Kotlin 标签切换。

## 安装

先在后台 SDK 源码仓库构建制品并安装到 Maven Local：

```powershell
.\gradlew.bat clean build publishToMavenLocal
```

当前未公开发布 Maven 制品。下列是同一制品的三种依赖声明方式，选择业务项目使用的构建工具；Gradle Kotlin DSL 是构建脚本语法，也可用于 Java 项目。私有 Maven 仓库由组织自行提供，替换本地仓库配置即可。

| 使用场景 | 制品 |
| --- | --- |
| 纯 Java / JVM 核心 | `dev.sparktide:sdk-java:0.1.0-SNAPSHOT` |
| Kotlin 语言扩展 | `dev.sparktide:sdk-kotlin:0.1.0-SNAPSHOT`（包含 Java 核心依赖） |
| Spring 标准 HTTP API / 能力注册 | `dev.sparktide:sdk-spring-boot-starter:0.1.0-SNAPSHOT`；宿主提供 Spring MVC Web 运行时 |

下面以 Spring 接入为例；纯 JVM 项目改用表中的核心或 Kotlin 制品。Spring Kotlin 项目同时添加 Kotlin 模块。

::: code-group

```kotlin [Gradle Kotlin DSL]
repositories { mavenLocal(); mavenCentral() }
dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.1.0-SNAPSHOT")
    // Kotlin 项目另加：implementation("dev.sparktide:sdk-kotlin:0.1.0-SNAPSHOT")
    // 宿主 Spring Boot BOM 管理 Web 运行时版本
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

```groovy [Gradle Groovy DSL]
repositories { mavenLocal(); mavenCentral() }
dependencies {
    implementation 'dev.sparktide:sdk-spring-boot-starter:0.1.0-SNAPSHOT'
    // Kotlin 项目另加：implementation 'dev.sparktide:sdk-kotlin:0.1.0-SNAPSHOT'
    // 宿主 Spring Boot BOM 管理 Web 运行时版本
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
}
```

```xml [Maven]
<!-- 默认读取 Maven Local；宿主 Spring Boot BOM 管理 Web 运行时版本 -->
<dependencies>
  <dependency>
    <groupId>dev.sparktide</groupId>
    <artifactId>sdk-spring-boot-starter</artifactId>
    <version>0.1.0-SNAPSHOT</version>
  </dependency>
  <!-- Kotlin 项目另加 sdk-kotlin，版本同上 -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webmvc</artifactId>
  </dependency>
</dependencies>
```

:::

## 接入边界


浏览器只访问业务后台。Java 核心提供 BusinessChatClient；Kotlin 复用核心并提供模型声明函数；Spring Starter 装配 HTTP API。会话、消息、运行和事件保存于底座，业务后台只适配认证、调用和流转发。工具、知识、业务权限和声明配置仍通过业务后台接入。

## 接入与认证

引入 `dev.sparktide:sdk-spring-boot-starter:0.1.0-SNAPSHOT`，业务项目提供 Servlet Web 运行时；核心不依赖 Spring。配置：

```yaml
sparktide:
  chat:
    enabled: true                 # 默认 false
    platform-url: https://platform.internal
    app-id: orders
    path: /api/ai                  # 默认值；无末尾斜杠
    max-streams: 32                # 1..256，每个实例
    stream-timeout-ms: 650000      # 1000..900000
```

::: code-group

```java [Java]
@Bean ChatCredentialResolver identity(UserCredentialProvider<String> enrolledUsers) {
    return request -> {
        var principal = request.getUserPrincipal();
        if (principal == null) throw new PlatformException(401, "UNAUTHENTICATED", "Login required");
        return enrolledUsers.credentialFor(principal.getName());
    };
}
```

```kotlin [Kotlin]
@Bean
fun identity(enrolledUsers: UserCredentialProvider<String>): ChatCredentialResolver =
    ChatCredentialResolver { request ->
        val principal = request.userPrincipal
            ?: throw PlatformException(401, "UNAUTHENTICATED", "Login required")
        enrolledUsers.credentialFor(principal.name)
    }
```

:::

`UserCredentialProvider` 实际方法为 `credentialFor`，用户凭据由受控初始化/OIDC 体系提供。不要将用户名请求头视为已登录身份。网关每次验证平台 `/v1/me` 的 USER 角色与绑定应用；底座再次验证租户、会话所有者和实时权限。HTTP 模块独立于 `sparktide.enabled` 注册开关，不要求网关注入管理凭据。启用但没有 resolver 时启动失败。

Bearer 登录需要业务认证验证后解析用户凭据。Cookie 登录另提供 `ChatRequestVerifier`，接入原有 Spring Security CSRF 或登录态绑定的 CSRF token；默认 verifier 拒绝带 Cookie 的写请求，返回 `403 CSRF_REQUIRED`。业务实现应限制允许的 Origin/CORS，不允许凭浏览器 Context 或 appId 提权。

## HTTP 与方法

前缀可以修改，下列路径相对 `/api/ai`。机器合同以平台 `protocol/src/main/resources/business-chat.openapi.json` 为准。

| 请求 | 行为 |
| --- | --- |
| `POST /chat` | 发送 `{protocolVersion:"1.0",message:{role:"user",content}}`，可选 conversationId、agentId+agentVersion、context、client.uiCapabilities；返回 Run |
| `POST /conversations` | `{title?:string}`，标题默认空、最长128，201返回空会话；无需先创建才能发送 |
| `GET /conversations` | limit 默认20，1..200；offset 默认0，0..1000000；items+nextOffset，null表示末页 |
| `GET/PATCH/DELETE /conversations/{id}` | 历史最多20条；PATCH仅title；DELETE活动运行冲突409 |
| `GET /runs/{id}` | 读取权威状态 |
| `GET /runs/{id}/events` | SSE，Last-Event-ID=`runId:sequence`，保持原事件协议1.0 |
| `POST /runs/{id}/cancel` | 显式取消，不撤销已产生的业务副作用 |
| `POST /runs/{id}/confirm` | confirmationId+decision（approve/reject）；只有DANGEROUS工具等待确认 |
| `GET /runs/{id}/citations/{citation}/preview` | 按当前权限读取引用原文 |

写请求不自动重试。POST chat 的 Idempotency-Key 默认生成 UUID，最长128；用户可传入稳定键恢复提交结果不明场景。非法游标400，超出底座保留窗口或序号范围410。401/403要求恢复登录，不反复重连。HTTP开始前错误以JSON返回；开始后的错误通过断流和Run状态查询恢复。请求体上限256KiB（含分块输入）；流每行64Ki字符、每帧256Ki字符，实例流名额用尽返回429。慢消费者只占一个有界工作线程，不会排队积累无限事件。订阅结束、超时或断开会关闭上游，不自动取消运行。

## 声明与发布

`ApplicationBootstrap.create(appId,name)` 仅由独立初始化命令使用平台管理员凭据；重复创建由平台明确拒绝。发布/注册使用应用管理凭据，聊天使用 USER，回调使用绑定应用及出站 Origin 的独立密钥。密钥值由执行侧环境注入，声明仅包含 secretRef。

`ModelDeclarations` 提供 OPENAI_CHAT/REMOTE 提供商、模型与显式 ModelCapabilities、应用私有绑定、ModelProfile、提示词及工具/知识引用的智能体工厂；Kotlin 的 openAIProvider/modelDefinition/modelBinding/modelProfile/agentDefinition 语义等价。Registry现有提供商不接受单独连接超时字段：连接上限复用平台部署限制，单次模型超时通过 ModelProfile.attemptTimeoutSeconds 设置。

Spring 可提供 `RegistrationManifest` Bean，无需手写JSON；Starter合并模型声明和注解工具/知识。设 `sparktide.deployment.source` 为稳定标识（小写字母开头、字母数字横线、最长64），清单归属必须一致。相同版本内容不可被无痕覆盖；内容变化发布新语义版本。源不同或试图认领旧人工资源返回409；REVOKED不可被同步恢复。

开发显式 `mode: DEVELOPMENT` + `auto-sync: true`，预检通过后原子发布。生产默认 PRODUCTION、auto-sync=false，启动仅注册/检查，禁止旧publish=true隐式发布。发布程序先读取 `SparkTideRegistration.registrationReport()`，再显式调用 `release(reason)`；不对浏览器暴露此方法。Java独立程序用 `DeclaredApplication.inspect()` 和 `publish(reason)`。同内容重复启动及并发发布查询最终权威状态后返回UNCHANGED；不重发写请求。代码删除清单条目不自动删除历史版本，停用需显式治理。

## 迁移与回滚

保留 PlatformClient、AgentClient 和旧首消息建会话接口。业务浏览器迁移至createChatClient和标准API，旧 `/console/chat` 身份头示例已移除，默认示例要求已认证 Principal。REMOTE 与 MANAGED 知识复用已有实现和权限过滤；不新增解析范围。

关闭chat.enabled并回滚业务部署/SDK版本可停止新入口；底座数据不删除。回退配置使用显式发布与入口版本切换，保留所有治理停用。当前租约续期沿用应用管理凭据；只提供聊天的生产网关可以关闭能力注册并完全不持有管理凭据。



## 类型化模型声明示例

::: code-group

```java [Java]
String v="1.0.0";
var definitions = new RegistrationManifest(List.of(
    ModelDeclarations.openAIProvider("provider", v, endpoint, "MODEL_KEY", true),
    ModelDeclarations.model("model", v, "provider", v, vendorModel,
        ModelCapabilities.builder().supports(ModelCapabilities.Feature.TOOL_CALLING, true).build()),
    ModelDeclarations.binding("binding", v, "model", v),
    ModelDeclarations.profile("profile", v, ModelProfile.builder("binding", v).maxOutputTokens(1024).build()),
    ModelDeclarations.agent("main", v, "使用业务工具回答。", "profile", v, tools, knowledge)
)).managedBy("orders-service");
```

```kotlin [Kotlin]
import dev.sparktide.sdk.*
import dev.sparktide.sdk.kotlin.*
import java.net.URI

val v = "1.0.0"
val graph = RegistrationManifest(listOf(
    openAIProvider("provider", v, URI.create(endpoint), "MODEL_KEY", true),
    modelDefinition("model", v, ReleaseBundle.Entry("provider", v), vendorModel,
        ModelCapabilities.builder().supports(ModelCapabilities.Feature.TOOL_CALLING, true).build()),
    modelBinding("binding", v, ReleaseBundle.Entry("model", v)),
    modelProfile("profile", v, ModelProfile.builder("binding", v).maxOutputTokens(1024).build()),
    agentDefinition("main", v, "使用业务工具回答。", ReleaseBundle.Entry("profile", v), tools, knowledge)
)).managedBy("orders-service")
```

:::

Spring 中将清单作为 Bean，工具和知识用 `@AgentTool`、`@AgentKnowledge` 声明；无需手写聊天 Controller。生产发布作业显式调用 `SparkTideRegistration.release(reason)`。参见后台仓库 `examples/ops-assistant-service` 的完整样例。

Kotlin 示例导入 `dev.sparktide.sdk.*` 和 `dev.sparktide.sdk.kotlin.*`，使用 `remoteProvider` 声明后台代理提供商；`tools` 与 `knowledge` 同为精确版本引用列表。Java 与 Kotlin 的声明、发布、身份及流语义一致。Kotlin 安装制品已在独立 JVM 工程验证声明 DSL、用户认证和会话生命周期；旧定义 DSL、协程等待和 AgentClient 保留兼容。
