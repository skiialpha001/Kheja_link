import java.util.Properties
import java.security.KeyStore
import java.security.PrivateKey
import org.gradle.api.GradleException

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
val releaseSigningError = "Release signing requires valid mobile/android/key.properties. Refusing to fall back to debug key."
val releaseTaskRequested = gradle.startParameter.taskNames.any { it.contains("Release", ignoreCase = true) }
val releaseSigningConfigIsValid = runCatching {
    if (!keystorePropertiesFile.isFile) return@runCatching false

    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
    val storePath = keystoreProperties.getProperty("storeFile")?.trim().orEmpty()
    val storePassword = keystoreProperties.getProperty("storePassword")?.trim().orEmpty()
    val keyAlias = keystoreProperties.getProperty("keyAlias")?.trim().orEmpty()
    val keyPassword = keystoreProperties.getProperty("keyPassword")?.trim().orEmpty()
    if (storePath.isEmpty() || storePassword.isEmpty() || keyAlias.isEmpty() || keyPassword.isEmpty()) {
        return@runCatching false
    }

    val releaseKeystoreFile = rootProject.file(storePath)
    if (!releaseKeystoreFile.isFile) return@runCatching false

    val releaseKeystore = KeyStore.getInstance("JKS")
    releaseKeystoreFile.inputStream().use { releaseKeystore.load(it, storePassword.toCharArray()) }
    releaseKeystore.isKeyEntry(keyAlias) && releaseKeystore.getKey(keyAlias, keyPassword.toCharArray()) is PrivateKey
}.getOrDefault(false)

if (releaseTaskRequested && !releaseSigningConfigIsValid) {
    throw GradleException(releaseSigningError)
}

android {
    namespace = "ke.co.khejalink.kheja_link"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // Permanent on Google Play: never change it after the first upload.
        applicationId = "ke.co.khejalink.kheja_link"
        // Target the SDK Flutter ships with (36), as Play requires recent targets.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (releaseSigningConfigIsValid) {
            create("release") {
                keyAlias = keystoreProperties.getProperty("keyAlias").trim()
                keyPassword = keystoreProperties.getProperty("keyPassword").trim()
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile").trim())
                storePassword = keystoreProperties.getProperty("storePassword").trim()
            }
        }
    }

    buildTypes {
        release {
            if (releaseSigningConfigIsValid) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
