---
title: PDF 文档
productVersion: "0.2.0"
updated: "2026-10-31"
source:
  - sparktide-backend-sdk/sdk-document-pdf/build.gradle.kts
  - sparktide-backend-sdk/sdk-document-pdf/README.md
  - sparktide-backend-sdk/sdk-document-pdf/src/main/kotlin/dev/sparktide/sdk/document/pdf/PdfDocumentRenderer.kt
---

# PDF 文档

`dev.sparktide:sdk-document-pdf:0.2.0` 用 Apache PDFBox `3.0.8` 和 JFreeChart `1.5.6` 渲染 PDF。它传递 [文档合同](./文档合同.md)。文件字节由业务 `DocumentStorage` 保存。SDK 不抓取任意网址，不生成 Word、Excel 或 PPT。

字节码目标 Java 8，Java 17 与 Java 8 核心都可以配合，只要进程里只有一套核心。制品尚未发布到 Maven Central。字体不随包提供，部署方使用自己有权使用的 TrueType 字体。

## 安装

::: code-group

```kotlin [Gradle Kotlin DSL]
dependencies {
    implementation("dev.sparktide:sdk-document-pdf:0.2.0")
}
```

```xml [Maven]
<dependency>
  <groupId>dev.sparktide</groupId>
  <artifactId>sdk-document-pdf</artifactId>
  <version>0.2.0</version>
</dependency>
```

:::

版本与 Starter 同为 `0.2.0`。

## 关键参数

| 参数 | 含义 | 何时用 |
| --- | --- | --- |
| `PdfDocumentRenderer` 的字体字节 | 覆盖报告字符的 TrueType | 启动时加载，缺字会失败 |
| `DocumentImageResolver` | 可选。把业务文件引用读成已授权的 PNG 或 JPEG 字节 | 报告含图片时。SDK 不自己读路径或网址 |
| `DocumentGenerator.generate(report, owner)` | 渲染并保存。`owner` 来自工具上下文 | 用户明确要求 PDF 时，由工具调用 |
| 章节字段 | 标题、段落、表格，以及可选的图表、图片、富文本 | 作为工具输入的 `DocumentReport`。旧的三参章节仍然接受 |
| 图表 | 每节最多 6 个，类型为 `PIE`、`DONUT`、`BAR`、`HORIZONTAL_BAR`、`LINE` | 需要图时。饼图和环形图只接受一个非负且合计大于 0 的系列 |

全文合计最多 50000 字，输出最多 150 页、8 MiB。图片单张最多 4 MiB。这些限制在渲染时检查，不是前端提示文案。

## 最小示例

::: code-group

```java [Java]
DocumentGenerator generator = new DocumentGenerator(
    new PdfDocumentRenderer(Files.readAllBytes(fontPath)), storage);

@Tool(name = "reports.pdf", effect = AgentTool.Effect.WRITE,
    permissions = {"report:create"},
    description = "仅当用户明确要求 PDF 时调用")
public DocumentResult createPdf(DocumentReport report, ToolContext context) {
    return generator.generate(report, new DocumentOwner(
        context.appId(), context.userId(), context.tenantId(),
        context.runId(), context.callId()));
}
```

```kotlin [Kotlin]
val generator = DocumentGenerator(PdfDocumentRenderer(fontBytes), storage)

@Tool(name = "reports.pdf", effect = AgentTool.Effect.WRITE,
    permissions = ["report:create"],
    description = "仅当用户明确要求 PDF 时调用")
fun createPdf(report: DocumentReport, context: ToolContext): DocumentResult =
    generator.generate(report, DocumentOwner(
        context.appId(), context.userId(), context.tenantId(),
        context.runId(), context.callId()))
```

:::

`fontPath` 和 `storage` 由业务配置。前端预览业务文件时使用 `onPreviewArtifact`，见 [自定义界面](../../开发接入/自定义界面.md)。
