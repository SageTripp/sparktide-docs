package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.annotation.AiProvider;
import dev.sparktide.sdk.provider.OpenAICompatibleProvider;

@AiProvider(baseUrl = "${OPS_MODEL_BASE_URL}", apiKey = "${OPS_MODEL_API_KEY}")
public class BusinessProvider extends OpenAICompatibleProvider {}
