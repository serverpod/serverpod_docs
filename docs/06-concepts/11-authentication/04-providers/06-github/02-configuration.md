# Configuration

This page covers configuration options for the GitHub identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `GitHubIdpConfig` in-code documentation.

### Providing GitHub OAuth Credentials

GitHub OAuth credentials are provided directly through the GitHubIdpConfig constructor by passing the `clientId` and `clientSecret`.

```dart
final githubIdpConfig = GitHubIdpConfig(
  clientId: pod.getPassword('githubClientId')!,
  clientSecret: pod.getPassword('githubClientSecret')!,
);
```

### Custom Account Validation

You can customize the validation for GitHub account details before allowing sign-in. By default, the validation checks that the received account details contain a non-empty userIdentifier.

```dart
final githubIdpConfig = GitHubIdpConfig(
  // Optional: Custom validation for GitHub account details
  githubAccountDetailsValidation: (GitHubAccountDetails accountDetails) {
    // Throw an exception if account doesn't meet custom requirements
    if (accountDetails.userIdentifier.isEmpty) {
      throw GitHubUserInfoMissingDataException();
    }
  },
);
```

:::note
GitHub users can keep their email private, so email may be null even for valid accounts. To avoid blocking real users with private profiles from signing in, adjust your validation function with care.
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

#### Passing Client IDs in Code

You can pass the `clientId` and `redirectUri` directly during initialization the GitHub Sign-In service:

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
