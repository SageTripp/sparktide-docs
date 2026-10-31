package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.AgentTool;
import dev.sparktide.sdk.Confirmation;
import dev.sparktide.sdk.Tool;
import dev.sparktide.sdk.ToolContext;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class RestartServiceTool {
    public record Input(String equipmentId, String reason) {}
    public record Output(String equipmentId, String status, String requestedBy) {}

    private final ConcurrentHashMap<String, Output> accepted = new ConcurrentHashMap<>();

    @Tool(
        name = "restart-service",
        description = "重启机组服务，执行前需要用户确认",
        confirmation = Confirmation.REQUIRED,
        effect = AgentTool.Effect.DANGEROUS)
    public Output execute(Input input, ToolContext context) {
        if (input == null || input.equipmentId() == null || input.equipmentId().isBlank()) {
            throw new IllegalArgumentException("equipmentId required");
        }
        if (input.reason() == null || input.reason().isBlank() || input.reason().length() > 256) {
            throw new IllegalArgumentException("reason required (1..256)");
        }
        return accepted.computeIfAbsent(context.callId(), ignored ->
            new Output(input.equipmentId(), "ACCEPTED", context.userId()));
    }
}
