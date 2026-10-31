package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.RenderWith;
import dev.sparktide.sdk.Tool;
import dev.sparktide.sdk.ToolContext;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class EquipmentStatusTool {
    public record Input(String equipmentId) {}
    public record Output(String equipmentId, String state) {}

    private record Row(String id, String state) {}

    private static final List<Row> FIXTURE = List.of(
        new Row("pump-01", "RUNNING"),
        new Row("pump-02", "DEGRADED"));

    @Tool(name = "equipment-status", description = "查询机组当前状态，只读")
    @RenderWith(value = "equipment.status", version = "1.0.0", fallback = "请查看文字结果。")
    public Output execute(Input input, ToolContext context) {
        if (input == null || input.equipmentId() == null || input.equipmentId().isBlank()) {
            throw new IllegalArgumentException("equipmentId required");
        }
        Row row = FIXTURE.stream()
            .filter(item -> item.id().equals(input.equipmentId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown equipment"));
        return new Output(row.id(), row.state());
    }
}
