package tutorial;
import dev.sparktide.sdk.ApplicationBootstrap;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

/** 独立初始化命令，不作为聊天服务 Bean，也不在启动时签发令牌。 */
public class Initialize {
    public static void main(String[] args) throws Exception {
        URI platform = URI.create(required("SPARKTIDE_PLATFORM_URL"));
        String admin = required("SPARKTIDE_ADMIN_TOKEN");
        String app = "tutorial";
        if (args.length == 0) new ApplicationBootstrap(platform, () -> admin).create(app, "入门聊天应用");
        var mapper = new ObjectMapper();
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        var values = new LinkedHashMap<String, String>();
        for (String role : List.of("APP_ADMIN", "USER")) {
            var body = Map.of("role", role, "subjectId", role.equals("USER") ? "tutorial-user" : "tutorial-deployer",
                    "tenantId", "tutorial-tenant", "ttlSeconds", role.equals("USER") ? 3600 : 86400);
            var request = HttpRequest.newBuilder(platform.resolve("/v1/apps/" + app + "/tokens"))
                    .timeout(Duration.ofSeconds(30)).header("Authorization", "Bearer " + admin)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(mapper.writeValueAsBytes(body))).build();
            var response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw new IllegalStateException("Credential initialization HTTP " + response.statusCode());
            String token = mapper.readTree(response.body()).path("token").asText();
            if (token.isBlank()) throw new IllegalStateException("Missing credential");
            values.put(role.equals("USER") ? "TUTORIAL_USER_TOKEN" : "SPARKTIDE_TOKEN", token);
        }
        Path env = Path.of("../.local/business.env");
        var lines = new ArrayList<>(Files.readAllLines(env, StandardCharsets.UTF_8));
        lines.removeIf(line -> values.keySet().stream().anyMatch(key -> line.startsWith(key + "=")));
        values.forEach((key, value) -> lines.add(key + "=" + value));
        Files.write(env, lines, StandardCharsets.UTF_8);
        System.out.println("应用及凭据就绪；已写入 .local/business.env，未输出凭据值。USER 有效期 1 小时。");
    }
    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing " + name);
        return value;
    }
}
