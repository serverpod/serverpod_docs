# Configuration

This page covers configuration options for the GitHub identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `GitHubIdpConfig` in-code documentation.

### Loading GitHub Credentials

You can load GitHub OAuth credentials in several ways:

**From JSON map (recommended for production):**

```dart
final githubIdpConfig = GitHubIdpConfig(
  oauthCredentials: GitHubOAuthCredentials.fromJson({
    'clientId': pod.getPassword('githubClientId')!,
    'clientSecret': pod.getPassword('githubClientSecret')!,
  }),
);
```

**From JSON file:**

```dart
import 'dart:io';

final githubIdpConfig = GitHubIdpConfig(
  oauthCredentials: GitHubOAuthCredentials.fromJsonFile(
    File('config/github_oauth_credentials.json'),
  ),
);
```

### Custom Account Validation

You can provide custom validation logic for GitHub account details before allowing sign-in:

```dart
final githubIdpConfig = GitHubIdpConfig(
  // ...existing code...
  githubAccountDetailsValidation: (GitHubAccountDetails accountDetails) {
    if (accountDetails.email == null || accountDetails.email!.isEmpty) {
      throw GitHubUserInfoMissingDataException();
    }
  },
);
```

:::note
GitHub users can keep their email private, so email may be null even for valid
accounts.To avoid blocking real users with private profiles from signing in, adjust your validation function with care.
:::

### GitHubAccountDetails

The `githubAccountDetailsValidation` callback receives a `GitHubAccountDetails` record with the following properties:

| Property | Type | Description |
| ---------- | ------ | ------------- |
| `userIdentifier` | `String` | The GitHub user's unique identifier (UID) |
| `email` | `String?` | The user's email address (may be null if private) |
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

:::info
The properties available depend on user privacy settings and granted permissions.
:::

### Configuring Client IDs on the App

The Flutter client uses the [flutter_web_auth_2](https://pub.dev/packages/flutter_web_auth_2) package to manage the OAuth2 flow. You can provide your GitHub credentials in two ways:

#### Passing Client IDs in Code

You can pass the `clientId` and `redirectUri` directly during initialization. This is useful for managing platform-specific IDs within your Dart code.

```dart
await client.auth.initializeGitHubSignIn(
  clientId: 'YOUR_GITHUB_CLIENT_ID',
  redirectUri: 'test-app://github/auth',
);
```

This approach is useful when you need different client IDs per platform and want to manage them in your Dart code.

#### Using Environment Variables

Alternatively, you can pass client IDs during build time using the `--dart-define` option. The GitHub Sign-In provider supports the following environment variables:

- `GITHUB_CLIENT_ID`: Your GitHub OAuth client ID.
- `GITHUB_REDIRECT_URI`: The callback URI.

**Example usage:**

```bash
flutter run -d <device> \
  --dart-define="GITHUB_CLIENT_ID=your_id" \
  --dart-define="GITHUB_REDIRECT_URI=test-app://github/auth"
```

This approach is useful when you need to:

- Manage separate client IDs for different platforms (Android, iOS, Web) in a centralized way
- Avoid committing client IDs to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::
