# Configuration

This page covers configuration options for the Google identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `GoogleIdpConfig` in-code documentation.

### Loading Google Client Secret

You can load the Google client secret in several ways:

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
        'http://localhost:8080/auth/google/callback',
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

A full list of available scopes can be found [here](https://developers.google.com/identity/protocols/oauth2/scopes).

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

### Reacting to account creation

You can use the `onAfterGoogleAccountCreated` callback to run logic after a new Google account has been created and linked to an auth user. This callback is only invoked for new accounts, not for returning users.

This is particularly useful for performing side effects like analytics, sending a welcome email, or storing additional data. The `onBeforeAuthUserCreated` and `onAfterAuthUserCreated` callbacks in the core auth module do not have access to provider-specific data, so this callback fills that gap.

```dart
final googleIdpConfig = GoogleIdpConfigFromPasswords(
  onAfterGoogleAccountCreated: (
    session,
    authUser,
    googleAccount, {
    required transaction,
  }) async {
    // e.g. store additional data, send a welcome email, or log for analytics
  },
);
```

:::info
This callback runs inside the same database transaction as the account creation.
:::

:::caution
If you need to assign Serverpod scopes based on provider account data, note that updating the database alone (via `AuthServices.instance.authUsers.update()`) is **not enough** for the current login session. The token issuance uses the in-memory `authUser.scopes`, which is already set before this callback runs. You would need to update `authUser.scopes` as well for the scopes to be reflected in the issued tokens. For assigning scopes at creation time, consider using `onBeforeAuthUserCreated` in combination with `getExtraGoogleInfoCallback` to fetch and store the data you need before the auth user is created.
:::

### Lightweight Sign-In on the Flutter app

Lightweight sign-in is a feature that attempts to authenticate users previously logged in with Google automatically with minimal or no user interaction. When enabled, the Google authentication controller will try to sign in users seamlessly using platform-specific lightweight authentication methods. This feature is disabled by default, but can be enabled from the `GoogleSignInWidget` or `GoogleAuthController`.

```dart
GoogleSignInWidget(
  client: client,
  attemptLightweightSignIn: true, // Enable lightweight sign-in
  onAuthenticated: () {
    // User was automatically signed in
  },
)
```

:::info
If lightweight sign-in fails (e.g., no previous session exists or the user dismisses the prompt), the user can still use the regular sign-in button to authenticate manually.
:::

:::note
The lightweight sign-in attempt happens automatically when the controller is initialized, typically at app launch. If successful, users will be signed in without any additional interaction.
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
