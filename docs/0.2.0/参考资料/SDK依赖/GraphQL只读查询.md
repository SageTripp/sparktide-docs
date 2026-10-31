---
title: GraphQL 只读查询
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-query-graphql/build.gradle.kts
  - sparktide-backend-sdk/sdk-query-graphql/src/main/kotlin/dev/sparktide/sdk/query/GraphqlQuery.kt
---

# GraphQL 只读查询

`dev.sparktide:sdk-query-graphql:0.2.0` 基于 GraphQL Java `26.0`，要求 Java 17。它不随 Java 8 核心使用，也不提供智能体循环、数据库连接或另一套登录。业务给出没有 mutation 和 subscription 的 schema，以及同步 resolver；执行器在调用方线程上跑，以便保留原来的认证上下文。

制品尚未发布到 Maven Central。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-query-graphql:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-query-graphql</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

不要和 `sdk-java8` 放在同一个需要运行在 JDK 8 上的进程里。GraphQL Java 26 不是 Java 8 字节码。

## 关键类型

| 类型 | 含义 | 何时用 |
| --- | --- | --- |
| `GraphqlQuery` | `query` 必填，最长 16000。`variablesJson` 是 JSON 对象文本，无变量时传 `{}`。单操作时 `operationName` 可为空 | 工具输入 |
| `ReadOnlyGraphql.execute` | 第二个参数是绝对截止时间毫秒，来自 `ToolContext.deadline()`，不能由模型填写 | 工具方法里 |
| 深度与复杂度 | 深度上限 8，复杂度上限 2000 | 执行时。超限失败，不截断后假装成功 |
| `GraphqlQueryResult` | `resultJson`、`partial`、最多 30 条 `errors` | 工具返回值。`partial == true` 不是完整结论 |
| `ReadOnlyGraphql.requireSynchronous` | resolver 若返回 `CompletionStage` 会失败 | 在业务 resolver 里包住返回值，避免丢掉认证线程 |

数据错误对外码是 `DATA_UNAVAILABLE`，不包含 SQL、凭据或堆栈。查询语法问题码是 `QUERY_INVALID`。

## 最小示例

::: code-group

```java [Java]
ReadOnlyGraphql graphql = new ReadOnlyGraphql(readOnlySchema);

@Tool(name = "business-query", description = "按当前用户执行只读查询")
public GraphqlQueryResult query(GraphqlQuery input, ToolContext context) {
    return graphql.execute(input, context.deadline());
}
```

```kotlin [Kotlin]
val graphql = ReadOnlyGraphql(readOnlySchema)

@Tool(name = "business-query", description = "按当前用户执行只读查询")
fun query(input: GraphqlQuery, context: ToolContext): GraphqlQueryResult =
    graphql.execute(input, context.deadline())
```

:::

`readOnlySchema` 由业务用 GraphQL Java 建好，并且不能声明 mutation 或 subscription。resolver 调用现有 Service，数据权限仍由该 Service 判断。
