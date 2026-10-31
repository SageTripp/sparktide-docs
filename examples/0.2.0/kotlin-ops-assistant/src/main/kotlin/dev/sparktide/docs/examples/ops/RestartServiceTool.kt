package dev.sparktide.docs.examples.ops

import dev.sparktide.sdk.AgentTool
import dev.sparktide.sdk.Confirmation
import dev.sparktide.sdk.Tool
import dev.sparktide.sdk.ToolContext
import java.util.concurrent.ConcurrentHashMap
import org.springframework.stereotype.Component

@Component
class RestartServiceTool {
    data class Input(val equipmentId: String, val reason: String)
    data class Output(val equipmentId: String, val status: String, val requestedBy: String)

    private val accepted = ConcurrentHashMap<String, Output>()

    @Tool(
        name = "restart-service",
        description = "重启机组服务，执行前需要用户确认",
        confirmation = Confirmation.REQUIRED,
        effect = AgentTool.Effect.DANGEROUS)
    fun execute(input: Input, context: ToolContext): Output {
        require(input.equipmentId.isNotBlank()) { "equipmentId required" }
        require(input.reason.isNotBlank() && input.reason.length <= 256) { "reason required (1..256)" }
        return accepted.computeIfAbsent(context.callId()) {
            Output(input.equipmentId, "ACCEPTED", context.userId())
        }
    }
}
