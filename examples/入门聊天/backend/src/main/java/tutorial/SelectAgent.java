package tutorial;
import dev.sparktide.sdk.PlatformClient;
import java.net.URI;
/** 受控 SDK 命令：读取应用修订后显式切换入口，不开放给浏览器。 */
public class SelectAgent {
    public static void main(String[] args) {
        if (args.length != 1) throw new IllegalArgumentException("Pass exact agent version");
        var client = new PlatformClient(URI.create(System.getenv("SPARKTIDE_PLATFORM_URL")),
                "tutorial", () -> System.getenv("SPARKTIDE_TOKEN"));
        var app = client.application().toCompletableFuture().join();
        long revision = ((Number) app.get("revision")).longValue();
        client.defaultAgent("main", args[0], revision).toCompletableFuture().join();
        System.out.println("默认入口已切换为 main/" + args[0]);
    }
}
