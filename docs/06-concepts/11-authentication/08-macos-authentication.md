---
sidebar_label: macOS setup
description: Add the macOS Keychain Sharing entitlement your Flutter app needs so Serverpod authentication sessions persist after sign-in, including email and social providers.
---

# Set up authentication on macOS

Serverpod stores sign-in tokens in the macOS Keychain so sessions survive app restarts. Sandboxed macOS apps need a Keychain Sharing entitlement before they can read or write that data. This guide adds the entitlement to your Flutter project. It takes a few minutes and applies to every sign-in method (email, Google, Apple, and others).

## Before you start

- A Serverpod project with the [authentication module](./setup) enabled (the default when you create a project with `serverpod create`).
- A Flutter app that calls `client.auth.initialize()` on startup (included in the project template).
- Xcode installed, if you prefer adding the entitlement through the Xcode UI.

## Add the Keychain Sharing entitlement

Add the following to both entitlements files in your Flutter app:

- `macos/Runner/DebugProfile.entitlements`
- `macos/Runner/Release.entitlements`

```xml title="macos/Runner/DebugProfile.entitlements"
<key>keychain-access-groups</key>
<array/>
```

Copy the same block into `macos/Runner/Release.entitlements`.

The empty array enables Keychain access without creating a shared App Group. Leave the array empty unless you have a specific reason to add a group identifier.

Rebuild and run your app:

```bash
cd <project>_flutter
flutter run -d macos
```

## Verify

1. Sign in through any configured provider (email is the quickest to test).
2. Confirm the app shows your signed-in content without an error.
3. Stop and restart the app. The user should still be signed in.

If sign-in still fails, see [Troubleshooting](#troubleshooting).

## Advanced

### Add the entitlement in Xcode

1. Open `macos/Runner.xcworkspace` in Xcode.
2. Select the **Runner** target, then open **Signing & Capabilities**.
3. Click **+ Capability** and add **Keychain Sharing**.
4. Repeat for **Debug**, **Profile**, and **Release** build configurations if they use separate entitlements files.

Xcode writes the same Keychain Sharing entry (`keychain-access-groups`) into your entitlements files.

### Use the login keychain for local development

If you run unsigned macOS builds locally and want to avoid Keychain Sharing entitlements entirely, configure secure storage to use the login keychain instead of the Data Protection Keychain. In your app's `main.dart`, override the session manager storage:

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:serverpod_auth_core_flutter/serverpod_auth_core_flutter.dart';

client = Client(serverUrl)
  ..connectivityMonitor = FlutterConnectivityMonitor()
  ..authSessionManager = FlutterAuthSessionManager(
    storage: SecureClientAuthSuccessStorage(
      secureStorage: const FlutterSecureStorage(
        mOptions: MacOsOptions(
          usesDataProtectionKeychain: false,
        ),
      ),
    ),
  );
```

This path requires `flutter_secure_storage` 10.3.1 or later. Projects created with `serverpod create` pin an earlier version in `pubspec.yaml` dependency overrides, so bump the override before using this option:

```yaml title="pubspec.yaml"
dependency_overrides:
  flutter_secure_storage: ^10.3.1
```

The login keychain works for local development. For production macOS builds, prefer the Keychain Sharing entitlement in [Add the Keychain Sharing entitlement](#add-the-keychain-sharing-entitlement) above.

:::warning
If you add a non-empty value to `keychain-access-groups` (for example, `$(AppIdentifierPrefix)com.example.app`), Xcode may require an Apple Developer account and a provisioning profile to sign the app.
:::

## Troubleshooting

### Sign-in fails with "A required entitlement isn't present"

**Problem:** After entering valid credentials, sign-in fails with an error similar to:

```text
PlatformException(-34018, A required entitlement isn't present, ...)
```

The server accepts the login, but the Flutter app cannot save the session.

**Cause:** The macOS app is missing the Keychain Sharing entitlement (`keychain-access-groups`). When you create a project with `serverpod create`, the CLI adds network entitlements automatically, but not Keychain access.

**Resolution:** Follow [Add the Keychain Sharing entitlement](#add-the-keychain-sharing-entitlement) above. Rebuild the app after editing the entitlements files.

### Session is lost after restarting the app

**Problem:** Sign-in succeeds, but the user is signed out after closing and reopening the app.

**Cause:** The app cannot read the stored session from the Keychain, usually because the entitlement is missing or the app was not rebuilt after adding it.

**Resolution:** Confirm both entitlements files contain the Keychain Sharing entry (`keychain-access-groups`), rebuild with `flutter run -d macos`, then sign in again and restart the app.

## Related

- [Get started with authentication](./get-started): turn on the sign-in screen and test your first login
- [Authentication basics](./basics#client-side-authentication): check sign-in state and listen for auth changes on the client
- [flutter_secure_storage macOS setup](https://pub.dev/packages/flutter_secure_storage#configure-macos-version): platform details for secure storage on macOS
