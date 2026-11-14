plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.sitness.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.sitness.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.0")
    implementation("androidx.webkit:webkit:1.11.0")

    testImplementation("junit:junit:4.13.2")
}

// ---------- web UI ----------
// The screens are a React + Ant Design Mobile page in ../web, built into src/main/assets/web.
// Every Gradle build refreshes it first (a no-op when nothing under web/ changed).
// No Node on this machine? Build with -PskipWeb to reuse the bundle already in assets.
val webDir = rootProject.file("web")
val isWindows = System.getProperty("os.name").lowercase().contains("win")
val npm = if (isWindows) "npm.cmd" else "npm"

val npmInstall by tasks.registering(Exec::class) {
    workingDir = webDir
    commandLine(npm, "install", "--no-audit", "--no-fund")
    inputs.files(webDir.resolve("package.json"), webDir.resolve("package-lock.json"))
    outputs.dir(webDir.resolve("node_modules"))
}

val buildWeb by tasks.registering(Exec::class) {
    dependsOn(npmInstall)
    workingDir = webDir
    commandLine(npm, "run", "build")
    inputs.dir(webDir.resolve("src"))
    inputs.files(
        webDir.resolve("index.html"), webDir.resolve("package.json"),
        webDir.resolve("vite.config.ts"), webDir.resolve("tsconfig.json")
    )
    outputs.dir(file("src/main/assets/web"))
}

if (!project.hasProperty("skipWeb")) {
    tasks.named("preBuild") { dependsOn(buildWeb) }
    // The bundle lands in src/main/assets, so say outright that packaging the assets needs it
    // (Gradle rejects a task that reads another task's output without a declared dependency).
    tasks.matching { it.name.startsWith("merge") && it.name.endsWith("Assets") }
        .configureEach { dependsOn(buildWeb) }
}
