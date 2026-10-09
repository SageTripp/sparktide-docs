package tutorial;
import dev.sparktide.sdk.PlatformException;
import dev.sparktide.sdk.spring.ChatCredentialResolver;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.Principal;

/** 仅用于回环地址 local 配置：先验证业务令牌，再产生固定可信 Principal。 */
@Configuration
@Profile("local")
public class LocalIdentity {
    @Bean
    FilterRegistrationBean<OncePerRequestFilter> localLogin(
            @Value("${DEV_BROWSER_TOKEN}") String token) {
        if (token.length() < 32) throw new IllegalArgumentException("Local token too short");
        var filter = new OncePerRequestFilter() {
            @Override protected void doFilterInternal(HttpServletRequest request,
                    HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
                String authorization = request.getHeader("Authorization");
                if (authorization == null || !MessageDigest.isEqual(
                        ("Bearer " + token).getBytes(StandardCharsets.UTF_8),
                        authorization.getBytes(StandardCharsets.UTF_8))) {
                    response.setStatus(401); response.setContentType("application/json");
                    response.getWriter().write("{\"code\":\"UNAUTHENTICATED\",\"message\":\"Local business login required\"}");
                    return;
                }
                chain.doFilter(new HttpServletRequestWrapper(request) {
                    @Override public Principal getUserPrincipal() { return () -> "tutorial-user"; }
                    @Override public String getRemoteUser() { return "tutorial-user"; }
                }, response);
            }
        };
        var registration = new FilterRegistrationBean<OncePerRequestFilter>(filter);
        registration.addUrlPatterns("/api/ai/*"); registration.setOrder(-100);
        return registration;
    }
    @Bean
    ChatCredentialResolver chatIdentity(@Value("${TUTORIAL_USER_TOKEN}") String platformUserToken) {
        return request -> {
            if (request.getUserPrincipal() == null ||
                !request.getUserPrincipal().getName().equals("tutorial-user"))
                throw new PlatformException(401, "UNAUTHENTICATED", "Login required");
            return platformUserToken;
        };
    }
}
