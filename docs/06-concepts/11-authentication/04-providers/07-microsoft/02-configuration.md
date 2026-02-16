# Configuration

This page covers configuration options for the Microsoft identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `MicrosoftIdpConfig` in-code documentation.

### Tenant configuration

The `tenant` parameter determines which accounts can sign in to your application:

- `'common'` (default) - Allows both personal Microsoft accounts and work/school accounts.
- `'organizations'` - Allows only work/school accounts (any organization).
- `'consumers'` - Allows only personal Microsoft accounts.
- A specific tenant ID - Restricts to accounts from a specific Microsoft Entra ID tenant.

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

### Custom account validation

You can customize the validation for Microsoft account details before allowing sign-in. By default, the validation checks that the received account details contain a non-empty userIdentifier.

```dart
final microsoftIdpConfig = MicrosoftIdpConfigFromPasswords(
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

### Accessing Microsoft APIs

The default setup allows access to basic user information, such as `name`, `email`. You may require additional access scopes to access other Microsoft APIs, such as accessing a user's calendar, mail, or OneDrive files.

The default scopes requested are:

- `openid`: Required for OpenID Connect authentication.
- `profile`: Access to user's basic profile information.
- `email`: Access to user's email address.
- `offline_access`: Allows refresh tokens for long-lived sessions.
- `https://graph.microsoft.com/User.Read`: Access to user's Microsoft Graph profile.

To request additional scopes, you will need to:

- Ensure the required API permissions are configured in your Microsoft Entra ID app registration (navigate to **API permissions** in the [Azure Portal](https://portal.azure.com/)).
- Request access to the scopes when signing in. Do this by setting the `scopes` parameter of the `MicrosoftSignInWidget` or `MicrosoftAuthController`.

A full list of available scopes and Microsoft Graph API permissions can be found in the [Microsoft Graph permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference).

:::info
Adding additional scopes may require admin consent depending on your tenant configuration and the sensitivity of the requested permissions.
:::

### Accessing Microsoft APIs on the server

On the server side, you can access Microsoft APIs using the access token. The `getExtraMicrosoftInfoCallback` in `MicrosoftIdpConfig` receives the access token and can be used to call Microsoft Graph APIs:

```dart
import 'package:http/http.dart' as http;

final microsoftIdpConfig = MicrosoftIdpConfigFromPasswords(
  // Optional: Extract additional info from Microsoft Graph APIs
  getExtraMicrosoftInfoCallback: (session, {
    required accountDetails,
    required accessToken,
    required transaction,
  }) async {
    // Use accessToken to call Microsoft Graph APIs and store additional info
    // Example: Access user's calendar
    final response = await http.get(
      Uri.https('graph.microsoft.com', '/v1.0/me/calendar'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    // Process response and store additional info in the database
  },
);
```

## Configuring client IDs on the app

### Passing client IDs in code

You can pass the `clientId`, `redirectUri`, and `tenant` directly when initializing the Microsoft Sign-In service:

```dart
await client.auth.initializeMicrosoftSignIn(
  clientId: 'YOUR_MICROSOFT_CLIENT_ID',
  redirectUri: 'yourapp://auth',
  tenant: 'common', // Optional, defaults to 'common'
);
```

This approach is useful when you need different client IDs per platform and want to manage them in your Dart code.

### Using environment variables

Alternatively, you can pass client configuration during build time using the `--dart-define` option. The Microsoft Sign-In provider supports the following environment variables:

- `MICROSOFT_CLIENT_ID`: Your Microsoft Application (client) ID
- `MICROSOFT_REDIRECT_URI`: The callback URI

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
