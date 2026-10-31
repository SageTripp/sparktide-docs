package dev.sparktide.docs.examples.ops

import dev.sparktide.sdk.Knowledge
import dev.sparktide.sdk.KnowledgeContext
import dev.sparktide.sdk.KnowledgeDocument
import dev.sparktide.sdk.KnowledgeQuery
import dev.sparktide.sdk.KnowledgeResult
import org.springframework.stereotype.Component

@Component
class RunbookKnowledge {
    private data class Snippet(val id: String, val tenantId: String, val title: String, val text: String)

    private val fixture = listOf(
        Snippet("runbook-pump", "tenant-a", "离心泵降级处置", "先核对入口压力，再安排计划检修。"),
        Snippet("runbook-other", "tenant-b", "其他租户手册", "这段只用于演示过滤，不应返回给 tenant-a。"),
    )

    @Knowledge(name = "ops-runbook", description = "当前租户可见的运维手册", topK = 3)
    fun retrieve(query: KnowledgeQuery, context: KnowledgeContext): KnowledgeResult {
        val matched = fixture
            .filter { it.tenantId == context.tenantId() }
            .filter { it.text.contains(query.query()) || it.title.contains(query.query()) }
            .map { KnowledgeDocument(it.id, it.text, it.title, "", it.tenantId) }
        return KnowledgeResult(matched)
    }
}
