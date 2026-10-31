package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.UserIdentity;
import dev.sparktide.sdk.spring.BusinessPrincipalMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpsIdentity {
    public record BusinessUser(String userId, String tenantId) {}

    @Bean
    BusinessPrincipalMapper businessPrincipalMapper() {
        return principal -> {
            if (principal instanceof BusinessUser user) {
                return UserIdentity.of(user.userId(), user.tenantId());
            }
            return null;
        };
    }
}
