# Configuration

This page covers configuration options for the Microsoft identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `MicrosoftIdpConfig` in-code documentation.

### Custom Account Validation

You can customize the validation for Microsoft account details before allowing sign-in. By default, the validation checks that the received account details contain a non-empty userIdentifier.

```dart
final microsoftIdpConfig = MicrosoftIdpConfig(
  clientId: pod.getPassword('microsoftClientId')!,
  clientSecret: pod.getPassword('microsoftClientSecret')!,
  tenant: pod.getPassword('microsoftTenant') ?? 'common',
  // Optional: Custom validation for Microsoft account details
  microsoftAccountDetailsValidation: (MicrosoftAccountDetails accountDetails) {
    // Throw an exception if account doesn't meet custom requirements
    if (accountDetails.userIdentifier.isEmpty) {
      throw MicrosoftUserInfoMissingDataException();
    }
    // Example: Require email to be present
    if (accountDetails.email == null || accountDetails.email!.isEmpty) {
      throw MicrosoftUserInfoMissingDataException();
    }
  },
);
```

:::note
Users may choose not to share their email or other information during the Microsoft login flow. Adjust your validation function carefully to avoid blocking legitimate users.
:::

### MicrosoftAccountDetails

The `microsoftAccountDetailsValidation` callback receives a `MicrosoftAccountDetails` record with the following properties:

| Property | Type | Description |
| ---------- | ------ | ------------- |
| `userIdentifier` | `String` | The Microsoft user's unique identifier (Object ID) |
| `email` | `String?` | The user's email address (may be null) |
| `name` | `String?` | The user's display name from Microsoft |
| `image` | `Uri?` | URL to the user's profile image |

Example of accessing these properties:

```dart
microsoftAccountDetailsValidation: (accountDetails) {
  print('Microsoft Object ID: ${accountDetails.userIdentifier}');
  print('Email: ${accountDetails.email}');
  print('Display name: ${accountDetails.name}');
  print('Profile image: ${accountDetails.image}');

  // Custom validation logic
  if (accountDetails.email == null) {
    throw MicrosoftUserInfoMissingDataException();
  }
},
```

:::info
The properties available depend on the scopes requested and what the user consented to share.
:::

### Tenant Configuration

The `tenant` parameter determines which accounts can sign in to your application:

- `'common'` (default) - Allows both personal Microsoft accounts and work/school accounts
- `'organizations'` - Allows only work/school accounts (any organization)
- `'consumers'` - Allows only personal Microsoft accounts
- A specific tenant ID - Restricts to accounts from a specific Microsoft Entra ID tenant

```dart
final microsoftIdpConfig = MicrosoftIdpConfig(
  clientId: pod.getPassword('microsoftClientId')!,
  clientSecret: pod.getPassword('microsoftClientSecret')!,
  tenant: 'organizations', // Only allow work/school accounts
);
```

:::tip
Use `'common'` for the widest user base. Use a specific tenant ID when building internal applications for a single organization.
:::

## Configuring Client IDs on the App

### Passing Client IDs in Code

You can pass the `clientId`, `redirectUri`, and `tenant` directly when initializing the Microsoft Sign-In service:

```dart
await client.auth.initializeMicrosoftSignIn(
  clientId: 'YOUR_MICROSOFT_CLIENT_ID',
  redirectUri: 'yourapp://auth',
  tenant: 'common', // Optional, defaults to 'common'
);
```

This approach is useful when you need different client IDs per platform and want to manage them in your Dart code.

### Using Environment Variables

Alternatively, you can pass client configuration during build time using the `--dart-define` option. The Microsoft Sign-In provider supports the following environment variables:

- `MICROSOFT_CLIENT_ID`: Your Microsoft Application (client) ID.
- `MICROSOFT_REDIRECT_URI`: The callback URI.

**Example usage:**

```bash
flutter run -d <device> \
  --dart-define="MICROSOFT_CLIENT_ID=your_client_id" \
  --dart-define="MICROSOFT_REDIRECT_URI=msauth://auth" \
  --dart-define="MICROSOFT_TENANT=common"
```

This approach is useful when you need to:

- Manage separate client IDs for different platforms (Android, iOS, Web, macOS) in a centralized way
- Avoid committing client IDs to version control
- Configure different credentials for different build environments (development, staging, production)

:::tip
You can also set these environment variables in your IDE's run configuration or CI/CD pipeline to avoid passing them manually each time.
:::
