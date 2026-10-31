plugins {
    kotlin("jvm") version "2.3.20"
    kotlin("plugin.spring") version "2.3.20"
    application
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation("dev.sparktide:sdk-spring-boot-starter:0.2.0")
    implementation("dev.sparktide:sdk-kotlin:0.2.0")
    implementation("dev.sparktide:sdk-model-openai-compatible:0.2.0")
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.0.8"))
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    // Spring MVC 调用 suspend 控制器需要 Reactor 协程桥接。
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor:1.10.2")
}

application {
    mainClass.set("dev.sparktide.docs.examples.ops.OpsAssistantApplicationKt")
}
