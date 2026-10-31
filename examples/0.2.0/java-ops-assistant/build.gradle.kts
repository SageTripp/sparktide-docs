plugins {
    java
    application
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-model-openai-compatible:0.2.0")
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.0.8"))
    implementation("org.springframework.boot:spring-boot-starter-web")
}

application {
    mainClass.set("dev.sparktide.docs.examples.ops.OpsAssistantApplication")
}
