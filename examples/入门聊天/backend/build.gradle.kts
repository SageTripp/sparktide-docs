plugins { java; application }
repositories {
    mavenCentral()
    maven { url = uri("https://sagetripp.github.io/sparktide-docs/maven/") }
}
java { toolchain { languageVersion = JavaLanguageVersion.of(17) } }
tasks.withType<JavaCompile>().configureEach { options.encoding = "UTF-8" }
tasks.withType<JavaExec>().configureEach { jvmArgs("-Dfile.encoding=UTF-8") }
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.0.8"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("dev.sparktide:sdk-spring-boot-starter:0.1.0")
    // 独立初始化命令使用 Jackson 2，与 SDK 核心保持一致。
    implementation("com.fasterxml.jackson.core:jackson-databind:2.20.1")
}
application { mainClass = "tutorial.TutorialApplication" }
tasks.register<JavaExec>("initialize") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "tutorial.Initialize"
}
tasks.register<JavaExec>("credentials") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "tutorial.Initialize"
    args("credentials")
}
tasks.register<JavaExec>("selectAgent") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "tutorial.SelectAgent"
    args(providers.gradleProperty("agentVersion").getOrElse("1.1.0"))
}
