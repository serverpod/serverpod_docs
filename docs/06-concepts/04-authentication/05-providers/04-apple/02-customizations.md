---
sidebar_label: Customizations
description: Sign in with Apple can be configured through AppleIdpConfig, including how to load credentials and use the available options.
---

# Customize Apple sign-in

This page covers additional configuration options for the Apple identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `AppleIdpConfig` in-code documentation.

### Loading Apple credentials

The `AppleIdpConfigFromPasswords()` constructor reads the eight `apple*` keys from `config/passwords.yaml` (or the matching `SERVERPOD_PASSWORD_` environment variables) for you. This is the path used in the [setup guide](./setup#add-the-apple-identity-provider) and is the recommended default:

```dart
final appleIdpConfig = AppleIdpConfigFromPasswords();
```

Use `AppleIdpConfig(...)` directly when you need to pull credentials from a custom source, transform them at startup, or omit `passwords.yaml` entirely. You are responsible for resolving each value:

```dart
final appleIdpConfig = AppleIdpConfig(
  serviceIdentifier: pod.getPassword('appleServiceIdentifier')!,
  bundleIdentifier: pod.getPassword('appleBundleIdentifier')!,
  redirectUri: pod.getPassword('appleRedirectUri')!,
  teamId: pod.getPassword('appleTeamId')!,
  keyId: pod.getPassword('appleKeyId')!,
  key: pod.getPassword('appleKey')!,
  webRedirectUri: pod.getPassword('appleWebRedirectUri'),
  androidPackageIdentifier: pod.getPassword('appleAndroidPackageIdentifier'),
);
```

### Reacting to account creation

For Apple-specific logic, use `onAfterAppleAccountCreated` on `AppleIdpConfig`. It receives the created `AppleAccount` row, so you can read the Apple identifier and the name Apple returned on first sign-in.

```dart
AppleIdpConfigFromPasswords(
  onAfterAppleAccountCreated:
      (session, authUser, appleAccount, {required transaction}) async {
    session.log('Apple account created: ${appleAccount.userIdentifier}');
  },
)
```

For logic that should run whichever provider the user signed in with, use [`onAfterAuthUserCreated`](../../working-with-users#reacting-to-the-user-created-event) on `AuthUsersConfig` instead. It fires the first time any provider creates an auth user.

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    AppleIdpConfigFromPasswords(),
  ],
  authUsersConfig: AuthUsersConfig(
    onAfterAuthUserCreated: (session, authUser, {required transaction}) async {
      // authUser.id is the new user's UUID, use it to create any
      // app-specific records that must exist before the user's first request.
      await UserData.db.insertRow(
        session,
        UserData(authUserId: authUser.id, createdAt: authUser.createdAt),
        transaction: transaction,
      );
    },
  ),
);
```

:::info
This callback runs inside the same database transaction as the auth user creation. Throwing an exception inside it will abort the entire process and the user will not be created. If you perform external side-effects (e.g. analytics, sending emails), wrap them in a try/catch so an unrelated failure does not block sign-in.
:::

### Web routes configuration

Sign in with Apple requires web routes for handling callbacks and notifications. These routes must be configured both on Apple's side and in your Serverpod server, using the `pod.configureAppleIdpRoutes()` method:

```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```

- `revokedNotificationRoutePath` (default: `'/hooks/apple-notification'`): The path Apple calls when a user revokes authorization. Register this URL in your Apple Developer Portal for server-to-server notifications.
- `webAuthenticationCallbackRoutePath` (default: `'/auth/apple/callback'`): The path Apple redirects to after the user completes web-based sign-in. Must match the return URL registered on your Service ID.

:::note
When a user revokes access from their Apple ID settings, Apple sends a notification to `revokedNotificationRoutePath`. Registering the route is enough: Serverpod revokes the Apple authorization and the tokens it issued through Apple sign-in for that user. Clean up only your own derived records.
:::

### Configuring Sign in with Apple on the app

Your app needs the Service ID and the server callback URL. The setup guide passes them via `--dart-define`. If you would rather hardcode them or resolve them at runtime, pass them directly to `initializeAppleSignIn()` instead:

```dart
client.auth.initializeAppleSignIn(
  serviceIdentifier: 'com.example.service',
  redirectUri: 'https://example.com/auth/callback',
);
```

When both are passed, they take precedence over the `APPLE_SERVICE_IDENTIFIER` and `APPLE_REDIRECT_URI` build variables. The `redirectUri` must match the **Return URL** registered on your Apple Service ID and the value used by `pod.configureAppleIdpRoutes()`.

:::note
Only the web and Android flow consumes these values, but `initializeAppleSignIn` requires them on every platform. Pass them (or the matching dart-defines) even in an iOS-only app, or initialization throws.
:::

#### Using environment variables

The build variables `APPLE_SERVICE_IDENTIFIER` and `APPLE_REDIRECT_URI` are read by `initializeAppleSignIn()` whenever you do not pass the values as parameters:

- `APPLE_SERVICE_IDENTIFIER`: your Services ID identifier (e.g. `com.example.service`)
- `APPLE_REDIRECT_URI`: the server callback URL (e.g. `https://example.com/auth/callback`)

Pass them at build time with `--dart-define`:

```bash
flutter run \
  --dart-define="APPLE_SERVICE_IDENTIFIER=com.example.service" \
  --dart-define="APPLE_REDIRECT_URI=https://example.com/auth/callback"
```

This approach is useful when you need to:

- Manage configuration separately for different platforms (Android, Web) in a centralized way
- Avoid committing sensitive configuration to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can set `--dart-define` values in your IDE run configuration or CI/CD pipeline instead of passing them on every `flutter run` command.
:::

## AppleIdpConfig parameters

| Parameter | Type | Required | `passwords.yaml` key | Description |
| --- | --- | --- | --- | --- |
| `serviceIdentifier` | `String` | Yes | `appleServiceIdentifier` | The Services ID identifier (e.g. `com.example.service`). Required on every platform, though only the Android and web OAuth flow uses it. |
| `bundleIdentifier` | `String` | Yes | `appleBundleIdentifier` | The App ID bundle identifier (e.g. `com.example.app`). Used as the client ID for native Apple platform sign-in. |
| `redirectUri` | `String` | Yes | `appleRedirectUri` | The server callback route Apple redirects to after sign-in. Sent with every authorization-code exchange, and validated by Apple in the Android and web flow. Must be HTTPS and match the return URL registered on your Service ID. |
| `teamId` | `String` | Yes | `appleTeamId` | The 10-character Team ID from your Apple Developer account. Used to sign the client secret JWT. |
| `keyId` | `String` | Yes | `appleKeyId` | The Key ID of the Sign in with Apple private key. |
| `key` | `String` | Yes | `appleKey` | The raw contents of the `.p8` private key file, including the `-----BEGIN PRIVATE KEY-----` header and footer. Do not pre-generate the JWT yourself. |
| `webRedirectUri` | `String?` | Web only | `appleWebRedirectUri` | The web app URL the browser is redirected to after the server receives Apple's callback. |
| `androidPackageIdentifier` | `String?` | Android only | `appleAndroidPackageIdentifier` | The Android package name (e.g. `com.example.app`). When set, the callback route redirects Android sign-ins back to the app via an intent URI. |
