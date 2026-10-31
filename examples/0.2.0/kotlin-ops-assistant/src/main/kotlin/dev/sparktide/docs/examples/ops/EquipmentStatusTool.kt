package dev.sparktide.docs.examples.ops

import dev.sparktide.sdk.RenderWith
import dev.sparktide.sdk.Tool
import dev.sparktide.sdk.ToolContext
import kotlinx.coroutines.delay
import org.springframework.stereotype.Component

@Component
class EquipmentStatusTool {
    data class Input(val equipmentId: String)
    data class Output(val equipmentId: String, val state: String, val queriedBy: String)

    private val fixture = mapOf(
        "pump-01" to "RUNNING",
        "pump-02" to "DEGRADED",
    )

    @Tool(name = "equipment-status", description = "查询机组当前状态，只读")
    @RenderWith(value = "equipment.status", version = "1.0.0", fallback = "请查看文字结果。")
    suspend fun execute(input: Input, context: ToolContext): Output {
        require(input.equipmentId.isNotBlank()) { "equipmentId required" }
        delay(1)
        val state = fixture[input.equipmentId] ?: throw IllegalArgumentException("Unknown equipment")
        return Output(input.equipmentId, state, context.userId())
    }
}
