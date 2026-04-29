# Customizations

This page covers additional configuration options for the Apple identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `AppleIdpConfig` in-code documentation.

Serverpod provides two configuration classes:

- **`AppleIdpConfigFromPasswords`** -- Loads all credentials from `passwords.yaml` or their `SERVERPOD_PASSWORD_` environment variable equivalents. This is the class used in the [setup guide](./01-setup.md) and is recommended for most projects.
- **`AppleIdpConfig`** -- The base class that requires you to provide each credential explicitly. Use this when you need custom control over how credentials are loaded.

Both classes accept the same optional callbacks shown in the sections below.

### Loading credentials manually

If you use `AppleIdpConfig` instead of `AppleIdpConfigFromPasswords`, you must provide each credential explicitly:

```dart
AppleIdpConfig(
  serviceIdentifier: pod.getPassword('appleServiceIdentifier')!,
  bundleIdentifier: pod.getPassword('appleBundleIdentifier')!,
  redirectUri: pod.getPassword('appleRedirectUri')!,
  teamId: pod.getPassword('appleTeamId')!,
  keyId: pod.getPassword('appleKeyId')!,
  key: pod.getPassword('appleKey')!,
  webRedirectUri: pod.getPassword('appleWebRedirectUri'),
  androidPackageIdentifier: pod.getPassword('appleAndroidPackageIdentifier'),
)
```

### Reacting to account creation

You can use the `onAfterAppleAccountCreated` callback to run logic after a new Apple account has been created and linked to an auth user. This callback is only invoked for new accounts, not for returning users.

This callback is complimentary to the [core `onAfterAuthUserCreated` callback](../../working-with-users#reacting-to-the-user-created-event) to perform side-effects that are specific to a login on this provider - like storing analytics, sending a welcome email, or storing additional data.

```dart
final appleIdpConfig = AppleIdpConfigFromPasswords(
  onAfterAppleAccountCreated: (
    session,
    authUser,
    appleAccount, {
    required transaction,
  }) async {
    // e.g. store additional data, send a welcome email, or log for analytics
  },
);
```

:::info
This callback runs inside the same database transaction as the account creation. Throwing an exception inside this callback will abort the process. If you perform external side-effects, make sure to safeguard them with a try/catch to prevent unwanted failures.
:::

:::caution
If you need to assign Serverpod scopes based on provider account data, note that updating the database alone (via `AuthServices.instance.authUsers.update()`) is **not enough** for the current login session. The token issuance uses the in-memory `authUser.scopes`, which is already set before this callback runs. You would need to update `authUser.scopes` as well for the scopes to be reflected in the issued tokens. For assigning scopes at creation time, consider using `onBeforeAuthUserCreated` to set scopes based on data collected earlier in the flow.
:::

## Web Routes Configuration

Apple Sign-In requires web routes for handling callbacks and notifications. These routes must be configured both on Apple's side and in your Serverpod server.

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

## Configuring Apple Sign-In on the app

Apple Sign-In requires additional configuration for web and Android platforms. On native Apple platforms (iOS/macOS), the configuration is handled through Xcode capabilities.

### Passing configuration in code

You can pass the configuration directly when initializing the Apple Sign-In service:

```dart
client.auth.initializeAppleSignIn(
  serviceIdentifier: 'com.example.app',
  redirectUri: 'https://example.com/auth/callback',
);
```

The `serviceIdentifier` is your Apple Services ID, and the `redirectUri` is the callback URL that Apple redirects to after authentication (must match the URL configured on the server).

Both parameters are optional. If not supplied, the provider falls back to the corresponding `--dart-define` build variable:

- `serviceIdentifier` → `APPLE_SERVICE_IDENTIFIER`
- `redirectUri` → `APPLE_REDIRECT_URI`

:::note
These parameters are only required for web and Android platforms. On native Apple platforms (iOS/macOS), they are ignored.
:::

### Using Environment Variables

Alternatively, you can pass configuration during build time using the `--dart-define` option:

```bash
flutter run \
  -d "<device>" \
  --dart-define="APPLE_SERVICE_IDENTIFIER=com.example.app" \
  --dart-define="APPLE_REDIRECT_URI=https://example.com/auth/callback"
```

This approach is useful when you need to:

- Manage configuration separately for different platforms (Android, Web) in a centralized way
- Avoid committing sensitive configuration to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::

## All configuration parameters

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
