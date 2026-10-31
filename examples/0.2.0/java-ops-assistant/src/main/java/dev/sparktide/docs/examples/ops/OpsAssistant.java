package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.annotation.Agent;

@Agent(
    name = "main",
    instructions = "设备状态以工具结果为准，处置建议引用当前租户可见的手册。",
    model = {BusinessModel.class},
    tools = {EquipmentStatusTool.class, RestartServiceTool.class},
    knowledge = {RunbookKnowledge.class},
    defaultAgent = true)
public final class OpsAssistant {}
