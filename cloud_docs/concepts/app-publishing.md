---
sidebar_position: 11
description: Serverpod Cloud builds your Flutter app and uploads it to TestFlight and Google Play. Check the setup with app doctor, then publish from the CLI.
---

# App publishing

Getting a Flutter app to testers means signing builds, matching store settings, and uploading to TestFlight and Google Play. With app publishing, you run one command: Serverpod Cloud builds your Flutter app for iOS and Android, signs it, and uploads it to the stores you connected in the console.

You publish from the Cloud CLI. The `app doctor` command checks your app's setup before you publish, and each problem it reports links to a section of this page.

## What app publishing does

App publishing supports two platforms:

<div className="full-width-table">

| Platform | Store       | Where each build lands                        |
| -------- | ----------- | --------------------------------------------- |
| iOS      | App Store   | TestFlight, ready for your testers            |
| Android  | Google Play | A draft release on the internal testing track |

</div>

When you publish, the CLI uploads your Flutter app's source code. Serverpod Cloud builds it in release mode on its own build machines, with the Flutter version you choose. It then signs each build and uploads it to the store. You don't need Xcode, Android Studio, or a Mac to publish.

Releasing a build from TestFlight or the internal testing track to the public store stays in App Store Connect and Play Console.

## Connect the stores

Before you can publish for a platform, connect its store in the [Serverpod Cloud console](https://console.serverpod.dev). Open your project, then open the **App Stores** tab. Each store has a setup guide that walks you through the steps:

- **App Store:** Join the Apple Developer Program, register your app's bundle ID, create the app in App Store Connect, and add an App Store Connect API key. Only the project owner can add the key.
- **Google Play:** Sign up for Play Console, create the app, choose an upload key, and invite Serverpod Cloud's service account to your app in Play Console. Serverpod Cloud can create the upload key for you, or you can upload the keystore you already sign the app with.

The `app doctor` command shows whether each connection is complete, and links to the setup guide when it isn't.

## Check your app with app doctor

Run `app doctor` from your project's directory before you publish:

```bash
serverpod cloud app doctor
```

It checks the Flutter version, each store connection, and the setup of your Flutter app:

```text
! Flutter version: Not pinned, so builds use the latest stable release.
  Request a version with --flutter-version, or pin one in environment.flutter of the app's pubspec.yaml.

Android
  ✓ Google Play Console connection
  ✓ Package name: com.acme.app
  ✗ Release signing: Release builds do not use the keystore from Serverpod Cloud.
    Learn more: https://docs.serverpod.dev/cloud/concepts/app-publishing#android-release-signing
  ! App icon: The app uses the default Flutter icon.
    Learn more: https://docs.serverpod.dev/cloud/concepts/app-publishing#app-icon

iOS
  ✓ App Store connection
  ✓ Bundle ID: com.acme.app
  ✓ Export compliance
  ✓ App icon

1 check failed. Fix it before you publish the app.
```

A check marked `✗` makes the build or the upload fail, so fix it before you publish. A check marked `!` is a warning: the app can be published, but the result may not be what you want.

The command finds your Flutter app from `project.appDir` in `scloud.yaml`, the current directory, or your server's workspace. Pass `--app-dir` to check an app somewhere else, and `--platforms ios` or `--platforms android` to check one platform.

## Publish your app

Publish your app from your project's directory:

```bash
serverpod cloud app publish
```

The command builds every platform your app has code for, and stops with a link to the setup guide if a platform's store isn't connected. It shows the progress of each build and ends when the builds are uploaded to the stores. To publish one platform, pass `--platforms`:

```bash
serverpod cloud app publish --platforms ios
```

To start the builds and return right away, pass `--no-await`. The command then prints the `app show` command that follows the builds.

If your Flutter app is part of a Dart workspace, the upload includes the workspace packages it depends on. To leave files out of the upload, list them in a [`.scloudignore` file](/cloud/concepts/deployments#configure-whats-included).

## Follow your builds

Each publish creates an app upload with one build per platform. The upload ID that `app publish` and `app list` print identifies it. Use these commands to follow the builds:

<div className="full-width-table">

| Command                                     | What it shows                                                |
| ------------------------------------------- | ------------------------------------------------------------ |
| `serverpod cloud app list`                  | Recent publishes, newest first                               |
| `serverpod cloud app status`                | The latest build of each platform with a connected store     |
| `serverpod cloud app show <upload-id>`      | The builds of one upload, followed until they end            |
| `serverpod cloud app log <upload-id>`       | The build log of one platform, followed until the build ends |
| `serverpod cloud app artifacts <upload-id>` | Download links for the built files, valid for ten minutes    |
| `serverpod cloud app cancel <upload-id>`    | Cancels the builds of an upload that are still running       |

</div>

When a build fails, `app show` and `app status` print the `app log` command that shows why.

## Setup requirements

These are the parts of your Flutter app that `app doctor` checks. Each one has a section below.

### Flutter version {#flutter-version}

Serverpod Cloud builds your app with the first Flutter version it finds, in this order:

1. The `--flutter-version` option of `app publish`, such as `--flutter-version 3.50.0`.
2. A single version in `environment.flutter` of your app's `pubspec.yaml`.
3. `project.flutterSdk` in `scloud.yaml`.
4. The version of the Flutter SDK on your computer.
5. The latest stable release.

To build with the version you develop with, pin it in your app's `pubspec.yaml`:

```yaml title="pubspec.yaml"
environment:
  sdk: ^3.8.0
  flutter: 3.50.0
```

The version must be a Flutter release version, and it can't be lower than the Flutter version your app's `pubspec.lock` requires. When `app doctor` warns that the version isn't pinned, the builds use the latest stable release, which can change between two publishes.

### App identifiers {#app-identifiers}

The stores identify your app by its bundle ID on iOS and its package name on Android. Serverpod Cloud reads them from your Flutter app: the bundle ID from the Xcode project in `ios/`, and the package name from `applicationId` in `android/app/build.gradle.kts`.

A new Flutter app uses a `com.example` placeholder, which the stores don't accept. Replace it with your own identifier, such as `com.yourcompany.yourapp`, in both places. The identifier must match the app you created in App Store Connect and Play Console.

To publish with a different identifier than the one in your app's files, set it in `scloud.yaml`:

```yaml title="scloud.yaml"
project:
  projectId: my-project
  appIdentifiers:
    ios: com.yourcompany.yourapp
    android: com.yourcompany.yourapp
```

### Android release signing {#android-release-signing}

Google Play only accepts builds signed with your app's upload key. Serverpod Cloud stores that key and passes it to each Android build through these environment variables:

<div className="full-width-table">

| Variable                    | Value                                |
| --------------------------- | ------------------------------------ |
| `ANDROID_KEYSTORE_PATH`     | The path of the upload keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | The password of the keystore         |
| `ANDROID_KEY_ALIAS`         | The alias of the upload key          |
| `ANDROID_KEY_PASSWORD`      | The password of the upload key       |

</div>

Your app's Gradle build file must read these variables and sign release builds with them. A new Flutter app signs release builds with the debug key instead, which Google Play rejects.

Add a `release` signing config to `android/app/build.gradle.kts` that reads the variables, and use it for release builds:

```kotlin title="android/app/build.gradle.kts"
android {
    // ...

    val isServerpodCloudBuild = System.getenv("SERVERPOD_APP_BUILD") != null

    signingConfigs {
        if (isServerpodCloudBuild) {
            create("release") {
                storeFile = file(System.getenv("ANDROID_KEYSTORE_PATH"))
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (isServerpodCloudBuild) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}
```

Serverpod Cloud sets `SERVERPOD_APP_BUILD` on its builds, so release builds on your computer keep using the debug key. Apps created with `serverpod create` already include this setup.

The `app doctor` command checks that your release build type doesn't sign with the debug key alone, and that your Gradle build file names all four variables. You can read them in any way Gradle supports, such as `providers.environmentVariable("ANDROID_KEY_ALIAS")` or, in a Groovy `build.gradle`, `System.getenv('ANDROID_KEY_ALIAS')`.

### iOS export compliance {#ios-export-compliance}

App Store Connect asks whether each build uses encryption, because apps that use some kinds of encryption need export compliance documentation. Until a build answers it, App Store Connect holds the build and your testers can't install it.

Answer it once in your app's `ios/Runner/Info.plist`, inside the top-level `<dict>`. If your app uses no encryption, or only encryption that is exempt, such as HTTPS calls to your server, set `ITSAppUsesNonExemptEncryption` to `false`:

```xml title="ios/Runner/Info.plist"
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

If your app uses encryption that isn't exempt, set it to `<true/>` and provide the documentation in App Store Connect. Apple's [ITSAppUsesNonExemptEncryption reference](https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption) explains which encryption is exempt.

### App icon {#app-icon}

A new Flutter app has the Flutter logo as its icon. Testers see this icon on their home screen, and the stores show it on your app's listing. The `app doctor` command warns while your app still has it.

Replace the icon files on each platform:

- **Android:** The `ic_launcher.png` files in the `mipmap-*` folders of `android/app/src/main/res`.
- **iOS:** The images in `ios/Runner/Assets.xcassets/AppIcon.appiconset`.

Each platform needs the icon in several sizes. A package such as [flutter_launcher_icons](https://pub.dev/packages/flutter_launcher_icons) creates every size for both platforms from one image.

## Related

- [Deployments](/cloud/concepts/deployments): how to deploy the server your app talks to.
- [scloud.yaml schema](/cloud/reference/scloud-yaml-schema): the project configuration file the `app` commands read.
