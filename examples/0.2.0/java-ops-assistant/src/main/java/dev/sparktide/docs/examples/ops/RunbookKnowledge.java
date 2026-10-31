package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.Knowledge;
import dev.sparktide.sdk.KnowledgeContext;
import dev.sparktide.sdk.KnowledgeDocument;
import dev.sparktide.sdk.KnowledgeQuery;
import dev.sparktide.sdk.KnowledgeResult;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RunbookKnowledge {
    private record Snippet(String id, String tenantId, String title, String text) {}

    private static final List<Snippet> FIXTURE = List.of(
        new Snippet("runbook-pump", "tenant-a", "离心泵降级处置", "先核对入口压力，再安排计划检修。"),
        new Snippet("runbook-other", "tenant-b", "其他租户手册", "这段只用于演示过滤，不应返回给 tenant-a。"));

    @Knowledge(name = "ops-runbook", description = "当前租户可见的运维手册", topK = 3)
    public KnowledgeResult retrieve(KnowledgeQuery query, KnowledgeContext context) {
        List<KnowledgeDocument> matched = FIXTURE.stream()
            .filter(item -> item.tenantId().equals(context.tenantId()))
            .filter(item -> item.text().contains(query.query()) || item.title().contains(query.query()))
            .map(item -> new KnowledgeDocument(item.id(), item.text(), item.title(), "", item.tenantId()))
            .toList();
        return new KnowledgeResult(matched);
    }
}
