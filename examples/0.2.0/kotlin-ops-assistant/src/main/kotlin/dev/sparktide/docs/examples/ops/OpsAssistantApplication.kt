package dev.sparktide.docs.examples.ops

import dev.sparktide.sdk.BusinessIdentity
import dev.sparktide.sdk.PermissionDecision
import dev.sparktide.sdk.PermissionRequest
import dev.sparktide.sdk.PlatformClient
import dev.sparktide.sdk.TrustedContext
import dev.sparktide.sdk.UserIdentity
import dev.sparktide.sdk.kotlin.chatAs
import dev.sparktide.sdk.kotlin.asJavaProvider
import dev.sparktide.sdk.spring.BusinessPrincipalMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
class OpsAssistantApplication

fun main(args: Array<String>) {
    runApplication<OpsAssistantApplication>(*args)
}

data class BusinessUser(val userId: String, val tenantId: String)

@Configuration
class OpsIdentity {
    @Bean
    fun businessPrincipalMapper(): BusinessPrincipalMapper = BusinessPrincipalMapper { principal ->
        if (principal is BusinessUser) UserIdentity.of(principal.userId, principal.tenantId) else null
    }

    @Bean
    fun opsPermission(): dev.sparktide.sdk.PermissionProvider = object : dev.sparktide.sdk.kotlin.PermissionProvider {
        override suspend fun decide(request: PermissionRequest): PermissionDecision {
            val restart = request.action() == PermissionRequest.Action.EXECUTE &&
                request.resource().kind() == "tools" && request.resource().id() == "restart-service"
            val allowed = !restart || request.identity().role() == "APP_ADMIN"
            val reason = if (allowed) "本地替身规则放行" else "当前角色不能执行写工具"
            return PermissionDecision(allowed, "ops-local-decision", reason)
        }
    }.asJavaProvider()

    @Bean
    fun opsContext(): dev.sparktide.sdk.AgentContextProvider = object : dev.sparktide.sdk.kotlin.AgentContextProvider {
        override suspend fun provide(identity: BusinessIdentity): TrustedContext =
            TrustedContext(mapOf("site" to "plant-1"), "ops-example", "1")
    }.asJavaProvider()
}

@RestController
class OpsConsole(
    private val client: PlatformClient,
    @Value("\${ops.user-credentials:}") configured: String,
) {
    private val credentials: Map<String, String> = configured.split(",")
        .mapNotNull { entry ->
            val split = entry.indexOf('=')
            if (split > 0) entry.substring(0, split).trim() to entry.substring(split + 1).trim() else null
        }
        .filter { it.second.isNotEmpty() }
        .toMap()

    @PostMapping("/console/chat")
    suspend fun chat(
        @RequestHeader("X-Business-User") user: String,
        @RequestBody body: Map<String, Any>,
    ): Map<String, Any> {
        val credential = credentials[user] ?: throw IllegalArgumentException("Business user is not enrolled")
        val message = body["message"] as? String ?: throw IllegalArgumentException("message required")
        return client.chatAs(user, { credential }) {
            message(message)
            agent("main", "1.0.0")
        }
    }
}
