# Customizations

This page covers additional configuration options for the GitHub identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `GitHubIdpConfig` in-code documentation.

The GitHub identity provider can be configured using one of two classes:

- **`GitHubIdpConfigFromPasswords`**: Automatically loads the client ID and secret from the `githubClientId` and `githubClientSecret` keys in `passwords.yaml` (or the matching `SERVERPOD_PASSWORD_*` environment variables). This is the class used in the [setup guide](./setup) and is recommended for most projects.
- **`GitHubIdpConfig`**: Requires you to pass the client ID and secret directly. Use this when you load credentials from a custom source, such as a secrets manager or a programmatically constructed config.

`GitHubIdpConfigFromPasswords` is a convenience wrapper around `GitHubIdpConfig` that handles credential loading for you.

Both classes accept the same optional callbacks shown in the sections below. The examples on this page use `GitHubIdpConfigFromPasswords` unless the section specifically demonstrates manual credential loading.

### Load credentials using GitHubIdpConfig

When using `GitHubIdpConfig`, you must provide the client ID and secret explicitly. Read them from any source you want:

```dart
final githubIdpConfig = GitHubIdpConfig(
  clientId: pod.getPassword('githubClientId')!,
  clientSecret: pod.getPassword('githubClientSecret')!,
);
```

Or from a secrets manager, hard-coded values for tests, or a custom loader:

```dart
final githubIdpConfig = GitHubIdpConfig(
  clientId: await mySecretsManager.fetch('github-client-id'),
  clientSecret: await mySecretsManager.fetch('github-client-secret'),
);
```

### Custom account validation

You can customize the validation for GitHub account details before allowing sign-in. By default, the validation only checks that the received account details contain a non-empty `userIdentifier`.

```dart
final githubIdpConfig = GitHubIdpConfigFromPasswords(
  githubAccountDetailsValidation: (accountDetails) {
    // Throw an exception if account doesn't meet custom requirements
    if (accountDetails.userIdentifier.isEmpty) {
      throw GitHubUserInfoMissingDataException();
    }
  },
);
```

:::note
GitHub users can keep their email private, so `email` may be `null` even for valid accounts. Similarly, `name` is optional on GitHub profiles. To avoid blocking real users with private profiles from signing in, adjust your validation function with care.
:::

#### GitHubAccountDetails

The `githubAccountDetailsValidation` callback receives a `GitHubAccountDetails` record with the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `userIdentifier` | `String` | The GitHub user's unique identifier (UID) |
| `email` | `String?` | The user's email address (may be `null` if private) |
| `name` | `String?` | The user's display name from GitHub |
| `image` | `Uri?` | URL to the user's profile image |

Example of accessing these properties:

```dart
githubAccountDetailsValidation: (accountDetails) {
  print('GitHub UID: ${accountDetails.userIdentifier}');
  print('Email: ${accountDetails.email}');
  print('Display name: ${accountDetails.name}');
  print('Profile image: ${accountDetails.image}');

  // Custom validation logic
  if (accountDetails.email == null) {
    throw GitHubUserInfoMissingDataException();
  }
},
```

### Accessing GitHub APIs on the server

On the server side, you can call GitHub's REST API using the access token returned by sign-in. The `getExtraGitHubInfoCallback` on `GitHubIdpConfig` receives the access token on every authentication attempt and can be used to fetch and store additional user data:

```dart
import 'package:http/http.dart' as http;

final githubIdpConfig = GitHubIdpConfigFromPasswords(
  getExtraGitHubInfoCallback: (session, {
    required accountDetails,
    required accessToken,
    required transaction,
  }) async {
    final response = await http.get(
      Uri.https('api.github.com', '/user/orgs'),
      headers: {
        'Authorization': 'Bearer $accessToken',
        'Accept': 'application/vnd.github+json',
      },
    );
    // Parse response and store organization membership in your own table,
    // linked by accountDetails.userIdentifier.
  },
);
```

:::warning
**Do not create `GitHubAccount`, `UserProfile`, or `AuthUser` models inside this callback.** The authentication flow already creates them. Creating them here breaks new-account detection and skips critical setup steps. Store any extra data in your own custom tables, linked by `accountDetails.userIdentifier`.
:::

:::info
This callback runs on **every** sign-in, not just the first. Keep operations lightweight or guard expensive work behind a check for whether the data already exists.
:::

### Reacting to GitHub account creation

Use the `onAfterGitHubAccountCreated` callback to run logic after a new GitHub account has been created and linked to an auth user. This callback only fires for new accounts, not returning users.

This callback is complementary to the global [`onAfterAuthUserCreated`](#reacting-to-auth-user-creation) hook and is for side-effects specific to a GitHub sign-in, like storing GitHub-specific analytics or sending a GitHub-themed welcome email.

```dart
final githubIdpConfig = GitHubIdpConfigFromPasswords(
  onAfterGitHubAccountCreated: (
    session,
    authUser,
    githubAccount, {
    required transaction,
  }) async {
    // e.g. store additional data, send a welcome email, or log for analytics
  },
);
```

:::info
This callback runs inside the same database transaction as the account creation. Throwing an exception inside this callback aborts the process. If you perform external side-effects, guard them with `try`/`catch` to prevent unwanted failures.
:::

:::caution
If you need to assign Serverpod scopes based on provider account data, updating the database alone (via `AuthServices.instance.authUsers.update()`) is **not enough** for the current login session. Token issuance uses the in-memory `authUser.scopes`, which is already set before this callback runs. You would need to update `authUser.scopes` as well. For scope assignment at creation time, use [`onBeforeAuthUserCreated`](#reacting-to-auth-user-creation) in combination with `getExtraGitHubInfoCallback` to fetch and store the data you need before the auth user is created.
:::

### Reacting to auth user creation

The `onBeforeAuthUserCreated` and `onAfterAuthUserCreated` hooks are global callbacks configured on `AuthUsersConfig` in `initializeAuthServices`. They are not specific to GitHub; they fire for every identity provider. See the [working with users](../../working-with-users#reacting-to-the-user-created-event) page for full details.

`onBeforeAuthUserCreated` receives the default scopes and blocked status for the new user and must return the final values. Use it to assign custom scopes at creation time:

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    GitHubIdpConfigFromPasswords(),
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

### Configuring client IDs on the app

#### Passing client IDs in code

You can pass the `clientId` and `redirectUri` directly when initializing the GitHub Sign-In service:

```dart
await client.auth.initializeGitHubSignIn(
  clientId: 'your-github-client-id',
  redirectUri: Uri.parse('com.example.yourapp://auth'),
);
```

This approach is useful when you need different `redirectUri` values per platform and want to keep them in your Dart code.

#### Using environment variables

Alternatively, pass them at build time using `--dart-define`. The GitHub Sign-In provider supports the following environment variables:

- `GITHUB_CLIENT_ID`: Your GitHub OAuth client ID.
- `GITHUB_REDIRECT_URI`: The callback URI. Use the value matching the platform you build for: a reverse-DNS scheme for mobile, `https://your-domain.com/auth/callback` for Serverpod-hosted Flutter web, or the full `auth.html` URL for separately-hosted Flutter web.

If `clientId` and `redirectUri` are not supplied when initializing the service, the provider automatically falls back to these environment variables.

**Example usage:**

```bash
flutter run -d chrome --web-port=49660 \
  --dart-define="GITHUB_CLIENT_ID=your-github-client-id" \
  --dart-define="GITHUB_REDIRECT_URI=http://localhost:49660/auth.html"
```

```bash
flutter build web \
  --dart-define="GITHUB_CLIENT_ID=your-github-client-id" \
  --dart-define="GITHUB_REDIRECT_URI=https://my-awesome-project.serverpod.space/auth/callback"
```

This approach is useful when you need to:

- Configure different credentials for different build environments (development, staging, production).
- Avoid committing client IDs to version control.
- Inject platform-specific redirect URIs from your CI/CD pipeline.

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::

### Separately-hosted Flutter web

Use this flow when your Flutter web app and Serverpod are on different origins. Common cases: `flutter run -d chrome` locally with Serverpod on a separate port, or a CDN-hosted Flutter build with a separate API server.

1. Place a static `auth.html` file in your Flutter project's `web/` folder. A single copy is shared across every identity provider that uses an OAuth2 redirect, so create it once. Follow [Web callback page (`auth.html`)](../../setup#web-callback-page-authhtml) in the authentication setup guide.

2. Run Flutter on a fixed port. The examples use `49660`, but any free port works; keep it consistent everywhere:

   ```bash
   flutter run -d chrome --web-port=49660
   ```

3. Register the full `auth.html` URL on your GitHub App's **Callback URL** field (e.g., `http://localhost:49660/auth.html` locally, `https://app.example.com/auth.html` in production). GitHub Apps accept up to 10 callback URLs, so dev and prod entries can coexist with the Serverpod-hosted route and mobile schemes.

4. Pass the same URL to `initializeGitHubSignIn` via the `redirectUri` argument instead of the route URL.

## GitHubIdpConfig parameter reference

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `clientId` | `String` | Yes | The Client ID from your GitHub App or OAuth App. |
| `clientSecret` | `String` | Yes | The Client Secret generated for your GitHub App or OAuth App. |
| `githubAccountDetailsValidation` | `GitHubAccountDetailsValidation` | No | Custom validation callback for GitHub account details before allowing sign-in. Throws an exception to reject the account. Defaults to validating only that `userIdentifier` is non-empty. |
| `getExtraGitHubInfoCallback` | `GetExtraGitHubInfoCallback?` | No | Callback that receives the access token after sign-in, allowing you to call additional GitHub APIs and store extra user data. Runs on every sign-in. |
| `onAfterGitHubAccountCreated` | `AfterGitHubAccountCreatedFunction?` | No | Callback invoked after a new GitHub account is created and linked to an auth user. Fires only for new accounts. |
