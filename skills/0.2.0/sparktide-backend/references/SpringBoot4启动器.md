<!-- 自动生成；修改 docs/0.2.0/参考资料/SDK依赖/SpringBoot4启动器.md 后执行 docs:skills。 -->

# Spring Boot 4 启动器

`dev.sparktide:sdk-spring-boot-starter:0.2.0` 面向 Java 17、Spring Boot `4.0.8` 和 Jakarta。它传递 `sdk-java`，提供自动配置、聊天控制器和注册生命周期。这是新的 Java 17 业务的默认依赖。Boot 2 改用 [Spring Boot 2 启动器](SpringBoot2启动器.md)。

模型适配器不在这个坐标里，按供应商另加，例如 OpenAI 兼容模型（配套文档：/0.2.0/参考资料/SDK依赖/OpenAI兼容模型.md）。制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-model-openai-compatible:0.2.0")
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-spring-boot-starter</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

出现 `sparktide.application` 后，自动配置打开平台注册和聊天入口。聊天路径默认 `/api/ai`。

## 配置

| 前缀 | 类型 | 默认行为 |
| --- | --- | --- |
| `sparktide` | `SparkTideProperties` | `enabled` 默认 false。配置了 `sparktide.application` 后打开聊天入口 |
| `sparktide.chat` | `SparkTideChatProperties` | 路径默认 `/api/ai`。`maxStreams` 1 到 256，默认 32。`streamTimeoutMs` 1000 到 900000，默认 650000。`requestTimeoutMs` 1000 到 300000，默认 30000 |
| `sparktide.deployment` | `SparkTideDeploymentProperties` | `mode` 默认 `PRODUCTION`。`autoSync` 仅 `DEVELOPMENT` 可开，且不能与 `VERIFY` 同时开启 |
| `sparktide.chat.security` | `BrowserSecurityProperties` | `allowed-origins` 默认空，`allow-credentials` 默认 false |
| `sparktide.authentication` | `BusinessAuthenticationProperties` | 头白名单默认 7 个，`ttl-seconds` 默认 600，范围 1 到 3600 |

建议写新键。两边都写且值不同则启动失败：

| 建议写法 | 对齐到的既有键 |
| --- | --- |
| `sparktide.application` | `sparktide.app-id`、`sparktide.chat.app-id` |
| `sparktide.platform.url` | `sparktide.platform-url`、`sparktide.chat.platform-url` |
| `sparktide.platform.credential` | `sparktide.token` |
| `sparktide.http.path` | `sparktide.chat.path` |
| `sparktide.callbacks.url` | `sparktide.public-base-url` |
| `sparktide.callbacks.credential` | `sparktide.callback-token` |
| `sparktide.callbacks.secret-reference` | `sparktide.secret-ref` |
| `sparktide.callbacks.ledger-directory` | `sparktide.ledger-directory` |
| `sparktide.callbacks.port` | `sparktide.callback-port` |

`sparktide.deployment.version` 缺省 `1.0.0`。`sparktide.bind-address` 默认 `127.0.0.1`。`publish` 默认 false；生产模式拒绝在启动时发布。`Mode` 为 `DEVELOPMENT` 或 `PRODUCTION`。配置了应用标识时，开发模式默认自动同步且 `REGISTER`，其他模式默认 `VERIFY` 且不同步。

## 注册生命周期

`SparkTideRegistration`：

| 方法 | 结果 |
| --- | --- |
| `registrationReport()` | 最近一次差异报告；未启动时为空列表 |
| `publication()` | 最近一次发布快照；未发布时为空 |
| `capabilitiesReady()` | 运行中、允许写注册、声明均已发布、续租无故障 |
| `lastLeaseFailure()` | 脱敏续租失败说明，没有则为 `null` |
| `callbackPort()` | 实际监听端口；只读计划或已停止时为 `-1` |
| `release(reason)` | 显式发布当前代码清单 |
| `refreshRegistration()` | 刷新只读报告，不改默认入口 |

一个应用最多一个 `PermissionProvider` 和一个 `AgentContextProvider`。

## 错误边界

`SdkHttpErrors` 包住聊天控制器和业务认证转发。

| 来源 | 对外结果 |
| --- | --- |
| `PlatformException` 状态在 400 到 599 | 原状态与原 `code`。正文消息固定为 `SDK request could not be completed` |
| 其他 `PlatformException` 状态 | HTTP 502，保留原 `code` |
| 非法参数或不可读 JSON | 400 `INVALID_REQUEST` |
| 认证异常 | 401 `UNAUTHENTICATED` |
| 授权异常 | 403 `PERMISSION_DENIED` |
| 其他未分类异常 | 503 `UPSTREAM_UNAVAILABLE` |
| 查询串凭据 | 401 `UNAUTHENTICATED` |
| 非法 Origin | 403 `ORIGIN_REJECTED` |
| Cookie 写请求未通过 CSRF 或同源保护 | 403 `CSRF_REQUIRED` |
| 跟进修订号不合法 | 412 `REVISION_MISMATCH` |
| 事件订阅超过上限 | 429 `QUOTA_EXCEEDED` |

## 最小示例

声明类见 模型声明（配套文档：/0.2.0/参考资料/SDK依赖/模型声明.md）。可编译应用在 `examples/0.2.0/java-ops-assistant`。配置键的接入顺序见 [后端接入](后端接入.md)。
