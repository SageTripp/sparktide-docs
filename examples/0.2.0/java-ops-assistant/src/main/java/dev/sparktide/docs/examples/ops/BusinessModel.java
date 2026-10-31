package dev.sparktide.docs.examples.ops;

import dev.sparktide.sdk.annotation.AiModel;

@AiModel(
    name = "business-model",
    model = "example-chat-model",
    provider = BusinessProvider.class,
    maxOutputTokens = 1024)
public final class BusinessModel extends BusinessProvider.Model {
    public BusinessModel() {}
}
