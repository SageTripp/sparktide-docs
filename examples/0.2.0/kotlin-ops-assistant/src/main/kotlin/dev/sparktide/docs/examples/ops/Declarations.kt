package dev.sparktide.docs.examples.ops

import dev.sparktide.sdk.annotation.Agent
import dev.sparktide.sdk.annotation.AiModel
import dev.sparktide.sdk.annotation.AiProvider
import dev.sparktide.sdk.provider.OpenAICompatibleProvider

@AiProvider(baseUrl = "\${OPS_MODEL_BASE_URL}", apiKey = "\${OPS_MODEL_API_KEY}")
class BusinessProvider : OpenAICompatibleProvider()

@AiModel(
    name = "business-model",
    model = "example-chat-model",
    provider = BusinessProvider::class,
    maxOutputTokens = 1024)
class BusinessModel : OpenAICompatibleProvider.Model()

@Agent(
    name = "main",
    instructions = "设备状态以工具结果为准，处置建议引用当前租户可见的手册。",
    model = [BusinessModel::class],
    tools = [EquipmentStatusTool::class, RestartServiceTool::class],
    knowledge = [RunbookKnowledge::class],
    defaultAgent = true)
class OpsAssistant
