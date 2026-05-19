# Customizations

This page covers additional configuration options for the Apple identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `AppleIdpConfig` in-code documentation.

### Loading Apple credentials

`AppleIdpConfigFromPasswords()` reads the eight `apple*` keys from `config/passwords.yaml` (or the matching `SERVERPOD_PASSWORD_` environment variables) for you. This is the path used in the [setup guide](./setup#add-the-apple-identity-provider) and is the recommended default:

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

The Apple provider does not expose its own account-creation callback. To run logic after a user signs in with Apple for the first time, use the user-level [`onAfterAuthUserCreated`](../../working-with-users#reacting-to-the-user-created-event) callback on `AuthUsersConfig`. It fires the first time any provider creates an auth user, including Apple.

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

Sign in with Apple requires web routes for handling callbacks and notifications. These routes must be configured both on Apple's side and in your Serverpod server.

The `revokedNotificationRoutePath` is the path that Apple will call when a user revokes their authorization. The `webAuthenticationCallbackRoutePath` is the path that Apple will call when a user completes the sign-in process.

These routes are configured in the `pod.configureAppleIdpRoutes()` method:

```dart
pod.configureAppleIdpRoutes(
  revokedNotificationRoutePath: '/hooks/apple-notification',
  webAuthenticationCallbackRoutePath: '/auth/callback',
);
```

- `revokedNotificationRoutePath` (default: `'/hooks/apple-notification'`): The path Apple calls when a user revokes authorization. Register this URL in your Apple Developer Portal for server-to-server notifications.
- `webAuthenticationCallbackRoutePath` (default: `'/auth/callback'`): The path Apple redirects to after the user completes web-based sign-in. Must match the return URL registered on your Service ID.

:::note
When a user revokes access from their Apple ID settings, Apple sends a notification to `revokedNotificationRoutePath`. You are responsible for invalidating any active sessions for that user in your own application logic.
:::

### Configuring Sign in with Apple on the app

On web and Android, the Flutter client needs the Service ID and the server callback URL. The setup guide passes them via `--dart-define`. If you would rather hardcode them or resolve them at runtime, pass them directly to `initializeAppleSignIn()` instead:

```dart
client.auth.initializeAppleSignIn(
  serviceIdentifier: 'com.example.service',
  redirectUri: 'https://example.com/auth/callback',
);
```

When both are passed, they take precedence over the `APPLE_SERVICE_IDENTIFIER` and `APPLE_REDIRECT_URI` build variables. The `redirectUri` must match the **Return URL** registered on your Apple Service ID and the value used by `pod.configureAppleIdpRoutes()`.

:::note
These parameters are only used on web and Android. On native Apple platforms (iOS/macOS), the values come from your Xcode capability and are ignored here.
:::

#### Using environment variables

`APPLE_SERVICE_IDENTIFIER` and `APPLE_REDIRECT_URI` are the two build variables read by `initializeAppleSignIn()` on web and Android:

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
| `serviceIdentifier` | `String` | Yes (Android/Web) | `appleServiceIdentifier` | The Services ID identifier (e.g. `com.example.service`). Used as the OAuth client ID for Android and Web. |
| `bundleIdentifier` | `String` | Yes | `appleBundleIdentifier` | The App ID bundle identifier (e.g. `com.example.app`). Used as the client ID for native Apple platform sign-in. |
| `redirectUri` | `String` | Yes (Android/Web) | `appleRedirectUri` | The server callback route Apple redirects to after sign-in. Must be HTTPS and match the return URL registered on your Service ID. |
| `teamId` | `String` | Yes | `appleTeamId` | The 10-character Team ID from your Apple Developer account. Used to sign the client secret JWT. |
| `keyId` | `String` | Yes | `appleKeyId` | The Key ID of the Sign in with Apple private key. |
| `key` | `String` | Yes | `appleKey` | The raw contents of the `.p8` private key file, including the `-----BEGIN PRIVATE KEY-----` header and footer. Do not pre-generate the JWT yourself. |
| `webRedirectUri` | `String?` | Web only | `appleWebRedirectUri` | The web app URL the browser is redirected to after the server receives Apple's callback. |
| `androidPackageIdentifier` | `String?` | Android only | `appleAndroidPackageIdentifier` | The Android package name (e.g. `com.example.app`). When set, the callback route redirects Android clients back to the app via an intent URI. |
