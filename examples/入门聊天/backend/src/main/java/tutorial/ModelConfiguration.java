package tutorial;
import dev.sparktide.sdk.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import java.net.URI;
import java.util.List;
@Configuration
public class ModelConfiguration {
    @Bean
    RegistrationManifest models(@Value("${tutorial.model-endpoint}") URI endpoint,
                                @Value("${tutorial.model-id}") String modelId) {
        String v = "1.0.0";
        return new RegistrationManifest(List.of(
            ModelDeclarations.openAIProvider("provider", v, endpoint, "MODEL_API_KEY", true),
            ModelDeclarations.model("model", v, "provider", v, modelId,
                ModelCapabilities.builder().supports(ModelCapabilities.Feature.STREAMING, true)
                    .supports(ModelCapabilities.Feature.TOOL_CALLING, true).build()),
            ModelDeclarations.binding("binding", v, "model", v),
            ModelDeclarations.profile("profile", v,
                ModelProfile.builder("binding", v).maxOutputTokens(1024).build()),
            ModelDeclarations.agent("main", v, "你是业务助手，请用中文回答。", "profile", v,
                List.of(), List.of())
        )).managedBy("tutorial-service");
    }
}
