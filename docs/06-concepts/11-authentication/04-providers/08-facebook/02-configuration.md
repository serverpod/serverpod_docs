# Configuration

This page covers configuration options for the Facebook identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `FacebookIdpConfig` in-code documentation.

### Custom Account Validation

You can customize the validation for Facebook account details before allowing sign-in. By default, the validation checks that the received account details contain a non-empty userIdentifier.

The default validation logic:

```dart
static void validateFacebookAccountDetails(
  final FacebookAccountDetails accountDetails,
) {
  if (accountDetails.userIdentifier.isEmpty) {
    throw FacebookUserInfoMissingDataException();
  }
}
```

To customize validation, provide your own `facebookAccountDetailsValidation` function:

```dart
final facebookIdpConfig = FacebookIdpConfig(
  appId: pod.getPassword('facebookAppId')!,
  appSecret: pod.getPassword('facebookAppSecret')!,
  // Optional: Custom validation for Facebook account details
  facebookAccountDetailsValidation: (FacebookAccountDetails accountDetails) {
    // Throw an exception if account doesn't meet custom requirements
    if (accountDetails.userIdentifier.isEmpty) {
      throw FacebookUserInfoMissingDataException();
    }
    // Example: Require email to be present
    if (accountDetails.email == null || accountDetails.email!.isEmpty) {
      throw FacebookUserInfoMissingDataException();
    }
  },
);
```

:::note
Users may choose not to share their email or other information during the Facebook login flow. Adjust your validation function carefully to avoid blocking legitimate users.
:::

### FacebookAccountDetails

The `facebookAccountDetailsValidation` callback receives a `FacebookAccountDetails` record with the following properties:

| Property | Type | Description |
| -------- | ---- | ----------- |
| `userIdentifier` | `String` | The Facebook user's unique identifier (UID) |
| `email` | `String?` | The user's email address (may be null) |
| `name` | `String?` | The user's display name from Facebook |
| `image` | `Uri?` | URL to the user's profile image |

Example of accessing these properties:

```dart
facebookAccountDetailsValidation: (accountDetails) {
  print('Facebook UID: ${accountDetails.userIdentifier}');
  print('Email: ${accountDetails.email}');
  print('Display name: ${accountDetails.name}');
  print('Profile image: ${accountDetails.image}');

  // Custom validation logic
  if (accountDetails.email == null) {
    // Handle case where user didn't share email
  }
},
```

:::info
The properties available depend on the permissions requested and what the user consented to share.
:::

### Configuring Facebook Sign-In on the App

When using the external `serverpod_auth_idp_flutter_facebook` package, you can configure the App ID in your Flutter application.

#### Passing Configuration in Code

You can pass the App ID directly when initializing the Facebook Sign-In service:

```dart
await client.auth.initializeFacebookSignIn(
  appId: 'YOUR_FACEBOOK_APP_ID',
);
```

If the `appId` value is not supplied when initializing the service, the provider will automatically fetch it from the `FACEBOOK_APP_ID` environment variable. This approach is useful for different configurations per platform or build environment.

#### Using Environment Variables

Alternatively, you can pass the App ID during build time using the `--dart-define` option. The Facebook Sign-In provider supports the following environment variable:

- `FACEBOOK_APP_ID`: Your Facebook App ID.

**Example usage:**

```bash
flutter run -d <device> \
  --dart-define="FACEBOOK_APP_ID=your_app_id"
```

This approach is useful when you need to:

- Manage separate App IDs for different platforms (Android, iOS, Web, macOS) in a centralized way
- Avoid committing App IDs to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::
