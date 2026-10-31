---
name: sparktide-models
description: 为启澜 SparkTide 0.2.0 配置模型供应商、模型声明与 HTTP 传输，编写 Java/Kotlin 的 OpenAI 兼容、OpenAI、DeepSeek、Ollama 或 OpenCode Go 适配代码。
metadata:
  product: SparkTide
  product-version: "0.2.0"
  status: development
---

# 启澜模型配置

本 Skill 只针对 **启澜 SDK 0.2.0 实际暴露的配置**。不要把模型厂商最新 API 的全部参数套到启澜注解上，也不要把 Chat Completions 适配器说成 Responses 适配器。

## 按任务读取

- 注解字段、默认值、范围、互斥项：[模型声明](references/模型声明.md)。
- OpenAI 的完整参数和带注释对照：[OpenAI 模型](references/OpenAI模型.md)。
- 自建兼容网关：[OpenAI 兼容模型](references/OpenAI兼容模型.md)。
- 传输配置和限制：[模型 HTTP 传输](references/模型HTTP传输.md)。

- 其他服务：[DeepSeek](references/DeepSeek模型.md)、[Ollama](references/Ollama模型.md)、[OpenCode Go](references/OpenCodeGo模型.md)。

这些是包内版本快照，可以离线读取。没有具体参数时，先检查用户已安装制品的公开类型，不能根据名称编造字段。

## 配置规则

1. 确认服务类型、实际可用模型标识、身份凭据来源与网络地址。凭据值不需要用户粘贴到聊天；使用宿主配置或环境变量引用。
2. `baseUrl` 是协议根，`endpoint` 是完整请求地址，二者互斥。`apiKey`、`apiKeyEnv` 和程序化密钥来源只保留一种。完整参数表要列出全部字段；可运行主示例只组合兼容字段，替代方式单独示例。
3. 模型类的 `provider` 指向自定义 Provider，避免 Java 静态嵌套类仍关联默认提供方。`@AiModel.model` 不解析配置占位符；应填用户账号真实存在的标识。
4. `Support.UNKNOWN` 不等于支持。模型能力、上下文窗口和计费单价须由用户配置及验证证据确定，不按模型名字猜。演示值必须明确标注，不能冒充厂商规格。
5. Provider 的组织、项目头和密钥属于连接配置，不能混进模型正文或智能体提示词。HTTP 传输参数不等同于运行预算；字段默认值按所选 SDK 类型解释。
6. 写完整 imports、构造/覆写签名和参数注释。用户用 Java 就交付 Java，用 Kotlin 就交付 Kotlin；制作公共教程时保持二者对照。Kotlin 中宿主 `${...}` 引用要写成 `\${...}`。

先使用配套制品编译，检查互斥字段和占位符行为。只有在用户授权实际调用且有测试环境时才做模型探测，说明可能产生模型费用。网络超时或结果未知不代表没有发生调用，不擅自重试产生新费用。
