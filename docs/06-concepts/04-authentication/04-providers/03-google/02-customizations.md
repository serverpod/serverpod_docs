---
sidebar_label: Customizations
description: Sign in with Google can be configured through GoogleIdpConfig, including how to load client secrets and use the available callbacks.
---

# Customize Google sign-in

This page covers additional configuration options for the Google identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `GoogleIdpConfig` in-code documentation.

The Google identity provider can be configured using one of two classes:

- **`GoogleIdpConfigFromPasswords`**: Automatically loads the client secret from the `googleClientSecret` key in `passwords.yaml` (or the `SERVERPOD_PASSWORD_googleClientSecret` environment variable). This is the class used in the [setup guide](./setup) and is recommended for most projects.
- **`GoogleIdpConfig`**: Requires you to pass a `GoogleClientSecret` object directly. Use this when you need to load credentials from a custom source, such as a JSON file, a secrets manager, or a programmatically constructed map.

The `GoogleIdpConfigFromPasswords` class is a convenience wrapper around `GoogleIdpConfig` that handles credential loading for you.

Both classes accept the same optional callbacks shown in the sections below. The examples on this page use `GoogleIdpConfigFromPasswords` unless the section specifically demonstrates manual client secret loading.

### Load the client secret using GoogleIdpConfig

When using `GoogleIdpConfig`, you must provide the client secret explicitly.

You can load the secret in several ways:

**From JSON string (recommended for production):**

```dart
final googleIdpConfig = GoogleIdpConfig(
  clientSecret: GoogleClientSecret.fromJsonString(
    pod.getPassword('googleClientSecret')!,
  ),
);
```

**From JSON file:**

```dart
final googleIdpConfig = GoogleIdpConfig(
  clientSecret: GoogleClientSecret.fromJsonFile(
    File('config/google_client_secret.json'),
  ),
);
```

**From JSON map:**

```dart
final googleIdpConfig = GoogleIdpConfig(
  clientSecret: GoogleClientSecret.fromJson({
    'web': {
      'client_id': 'your-client-id.apps.googleusercontent.com',
      'client_secret': 'your-client-secret',
      'redirect_uris': [
        'https://your-domain.com/auth/callback',
      ],
    },
  }),
);
```

### Custom Account Validation

You can customize the validation for Google account details before allowing sign-in. By default, the validation checks that the received account details contains `name`, `fullName`, and `verifiedEmail` set to true.

```dart
final googleIdpConfig = GoogleIdpConfigFromPasswords(
  // Optional: Custom validation for Google account details
  googleAccountDetailsValidation: (accountDetails) {
    // Throw an exception if account doesn't meet custom requirements
    if (accountDetails.verifiedEmail != true ||
        !accountDetails.email!.endsWith('@example.com')) {
      throw GoogleUserInfoMissingDataException();
    }
  },
);
```

### Accessing Google APIs

The default setup allows access to basic user information, such as email, profile image, and name. You may require additional access scopes, such as accessing a user's calendar, contacts, or files. To do this, you will need to:

- Add the required scopes to the [Data Access](./setup#configure-google-auth-platform) page in the Google Auth Platform.
- Request access to the scopes when signing in. Do this by setting the `scopes` parameter of the `GoogleSignInWidget` or `GoogleAuthController`.

For a full list of available scopes, see the [Google OAuth 2.0 Scopes reference](https://developers.google.com/identity/protocols/oauth2/scopes).

:::info
Adding additional scopes may require approval by Google. On the OAuth consent screen, you can see which of your scopes are considered sensitive.
:::

### Accessing Google APIs on the Server

On the server side, you can access Google APIs using the access token. The `getExtraGoogleInfoCallback` in `GoogleIdpConfig` receives the access token and can be used to call Google APIs:

```dart
import 'package:http/http.dart' as http;

final googleIdpConfig = GoogleIdpConfigFromPasswords(
  // Optional: Extract additional info from Google APIs
  getExtraGoogleInfoCallback: (session, {
    required accountDetails,
    required accessToken,
    required transaction,
  }) async {
    // Use accessToken to call Google APIs and store additional info
    // Example: Access YouTube API
    final response = await http.get(
      Uri.https('www.googleapis.com', '/youtube/v3/channels?part=snippet&mine=true'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    // Process response and store additional info in the database
  },
);
```

### Reacting to auth user creation

The `onBeforeAuthUserCreated` and `onAfterAuthUserCreated` hooks are global callbacks configured on `AuthUsersConfig` in `initializeAuthServices`. They are not specific to Google; they fire for every identity provider. See the [working with users](../../working-with-users#reacting-to-the-user-created-event) page for full details.

The `onBeforeAuthUserCreated` callback receives the default scopes and blocked status for the new user and must return the final values. Use it to assign custom scopes at creation time:

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    GoogleIdpConfigFromPasswords(),
  ],
  authUsersConfig: AuthUsersConfig(
    onBeforeAuthUserCreated: (
      session,
      scopes,
      blocked, {
      required transaction,
    }) {
      return (
        scopes: {...scopes, Scope('user')},
        blocked: blocked,
      );
    },
    onAfterAuthUserCreated: (
      session,
      authUser, {
      required transaction,
    }) async {
      // e.g. send a welcome email, log for analytics
    },
  ),
);
```

### Lightweight Sign-In on the Flutter app

Lightweight sign-in is a feature that attempts to authenticate users previously logged in with Google automatically with minimal or no user interaction. When enabled, the Google authentication controller will try to sign the user in using platform-specific lightweight authentication methods. This feature is disabled by default, but can be enabled from the `GoogleSignInWidget` or `GoogleAuthController`.

```dart
GoogleSignInWidget(
  client: client,
  attemptLightweightSignIn: true, // Enable lightweight sign-in
  onAuthenticated: () {
    // User was automatically signed in
  },
)
```

:::note
Lightweight sign-in runs automatically when the controller is initialized (typically at app launch). If it fails (no previous session, or the user dismisses the prompt), the regular sign-in button remains available.
:::

### Configuring Client IDs on the App

If no client IDs are provided programmatically, the underlying `google_sign_in` package falls back to reading from platform-specific configuration files (e.g., `GoogleService-Info.plist` for iOS, `google-services.json` for Android). To set them programmatically, you can use the following methods.

#### Passing Client IDs in Code

You can pass the client IDs directly when initializing the Google Sign-In service:

```dart
client.auth.initializeGoogleSignIn(
  clientId: '<platform_client_id>.apps.googleusercontent.com',
  serverClientId: '<web_client_id>.apps.googleusercontent.com',
);
```

This approach is useful when you need different client IDs per platform and want to manage them in your Dart code.

#### Using Environment Variables

Alternatively, you can pass client IDs during build time using the `--dart-define` option. The Google Sign-In provider supports the following environment variables:

- `GOOGLE_CLIENT_ID`: The platform-specific OAuth client ID
- `GOOGLE_SERVER_CLIENT_ID`: The server (web application) OAuth client ID

If `clientId` and `serverClientId` values are not supplied when initializing the service, the provider will automatically fetch them from these environment variables.

**Example usage:**

```bash
flutter run \
  -d "<device>" \
  --dart-define="GOOGLE_CLIENT_ID=<platform_client_id>.apps.googleusercontent.com" \
  --dart-define="GOOGLE_SERVER_CLIENT_ID=<web_client_id>.apps.googleusercontent.com"
```

This approach is useful when you need to:

- Manage separate client IDs for different platforms (Android, iOS, Web) in a centralized way
- Avoid committing client IDs to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::

### Configuring the Web redirect URI

You can pass the web redirect URI to `initializeGoogleSignIn` via `--dart-define`. This is useful when building for different environments (development, staging, production) without changing `main.dart`:

```dart
if (kIsWeb) {
  client.auth.initializeGoogleSignIn(
    clientId: String.fromEnvironment('GOOGLE_CLIENT_ID'),
    redirectUri: String.fromEnvironment('GOOGLE_WEB_REDIRECT_URI'),
  );
} else {
  client.auth.initializeGoogleSignIn();
}
```

```bash
flutter run -d chrome \
  --dart-define="GOOGLE_CLIENT_ID=<web_client_id>.apps.googleusercontent.com" \
  --dart-define="GOOGLE_WEB_REDIRECT_URI=<your_redirect_uri>"
```

Use the redirect URI that matches the environment you are building for (e.g., `http://localhost:8082/auth/callback` for local development with the integrated route, or `https://my-awesome-project.serverpod.space/auth/callback` for production).

### Separately-hosted Flutter web

Use this flow when your Flutter web app and Serverpod are on different origins. Common cases: `flutter run -d chrome` locally with Serverpod on a separate port, or a CDN-hosted Flutter build with a separate API server.

1. Place a static `auth.html` file in your Flutter project's `web/` folder. A single copy is shared across every identity provider that uses an OAuth2 redirect, so create it once. Follow [Web callback page (`auth.html`)](../../setup#web-callback-page-authhtml) in the authentication setup guide.

2. Run Flutter on a fixed port. The examples use `49660`, but any free port works, as long as you keep it consistent everywhere:

   ```bash
   flutter run -d chrome --web-port=49660
   ```

3. Update the [server OAuth client](./setup#create-the-server-oauth-client-web-application) with **Flutter's dev server origin** (not Serverpod's, since Flutter serves `auth.html`):

   - **Authorized JavaScript origins**: `http://localhost:49660` locally, `https://app.example.com` in production.
   - **Authorized redirect URIs**: `http://localhost:49660/auth.html` locally, `https://app.example.com/auth.html` in production.

4. Pass the same URL to `initializeGoogleSignIn` via the `redirectUri` argument instead of the route URL.

## GoogleIdpConfig parameter reference

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `clientSecret` | `GoogleClientSecret` | Yes | The Google OAuth client secret loaded from JSON. Can be loaded via `fromJsonString`, `fromJsonFile`, or `fromJson`. |
| `googleAccountDetailsValidation` | `GoogleAccountDetailsValidation?` | No | Custom validation callback for Google account details before allowing sign-in. Throws an exception to reject the account. |
| `getExtraGoogleInfoCallback` | `GetExtraGoogleInfoCallback?` | No | Callback that receives the access token after sign-in, allowing you to call additional Google APIs and store extra user data. |
