# Setup

Sign-in with Apple requires that you have a subscription to the [Apple Developer Program](https://developer.apple.com/programs/), even if you only want to test the feature in development mode.

:::note
Right now, we have official support for iOS, macOS, Android, and Web for Sign in with Apple.
:::

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Create your credentials

1. **Create a Service ID** in the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId):
   - Register a new Service ID
   - Enable "Sign in with Apple"
   - Configure domains and redirect URLs
   - Note the Service Identifier (e.g., `com.example.service`)

2. **Create a Key** for Sign in with Apple:
   - Go to Keys section in Apple Developer Portal
   - Create a new key with "Sign in with Apple" enabled
   - Download the key file (`.p8` file) - **you can only download this once**
   - Note the Key ID

3. **Store the credentials securely** in your `config/passwords.yaml`:

```yaml
development:
  appleServiceIdentifier: 'com.example.service'
  appleBundleIdentifier: 'com.example.app'
  appleRedirectUri: 'https://example.com/auth/callback'
  appleTeamId: 'ABC123DEF4'
  appleKeyId: 'XYZ789ABC0'
  appleKey: |
    -----BEGIN PRIVATE KEY-----
    MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
    -----END PRIVATE KEY-----
```

:::warning
The Apple private key can only be downloaded once. Store it securely and never commit it to version control. Use environment variables or secure secret management in production.
:::

## Server-side configuration

After creating your credentials, you need to configure the Apple identity provider on your main `server.dart` file by setting the `AppleIdpConfig` as a `identityProviderBuilders` in your `pod.initializeAuthServices()` configuration:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/apple.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Configure Apple identity provider
  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
    ],
    identityProviderBuilders: [
      AppleIdpConfig(
        serviceIdentifier: pod.getPassword('appleServiceIdentifier')!,
        bundleIdentifier: pod.getPassword('appleBundleIdentifier')!,
        redirectUri: pod.getPassword('appleRedirectUri')!,
        teamId: pod.getPassword('appleTeamId')!,
        keyId: pod.getPassword('appleKeyId')!,
        key: pod.getPassword('appleKey')!,
      ),
    ],
  );

  // Configure web routes for Apple Sign-In
  // Paths must match paths configured on Apple's developer portal.
  // The method's parameters are optional and defaults to the values below.
  pod.configureAppleIdpRoutes(
    revokedNotificationRoutePath: '/hooks/apple-notification',
    webAuthenticationCallbackRoutePath: '/auth/callback',
  );

  await pod.start();
}
```

:::tip
You can use the `AppleIdpConfigFromPasswords` constructor in replacement of the `AppleIdpConfig` above to automatically load the credentials from the `config/passwords.yaml` file or environment variables. It will expect either the following keys on the file:

   - `appleServiceIdentifier`
   - `appleBundleIdentifier`
   - `appleRedirectUri`
   - `appleTeamId`
   - `appleKeyId`
   - `appleKey`

Or the following environment variables:

   - `SERVERPOD_PASSWORD_appleServiceIdentifier`
   - `SERVERPOD_PASSWORD_appleBundleIdentifier`
   - `SERVERPOD_PASSWORD_appleRedirectUri`
   - `SERVERPOD_PASSWORD_appleTeamId`
   - `SERVERPOD_PASSWORD_appleKeyId`
   - `SERVERPOD_PASSWORD_appleKey`
:::

Then, extend the abstract endpoint to expose it on the server:

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';

class AppleIdpEndpoint extends AppleIdpBaseEndpoint {}
```

Finally, run `serverpod generate` to generate the client code and create a migration to initialize the database for the provider. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Basic configuration options

- `serviceIdentifier`: Required. The service identifier for the Sign in with Apple project.
- `bundleIdentifier`: Required. The bundle ID of the Apple-native app using Sign in with Apple.
- `redirectUri`: Required. The redirect URL used for 3rd party platforms (e.g., Android, Web).
- `teamId`: Required. The team identifier of the parent Apple Developer account.
- `keyId`: Required. The ID of the key associated with the Sign in with Apple service.
- `key`: Required. The secret contents of the private key file received from Apple.

For more details on configuration options, see the [configuration section](./configuration).

## Flutter-side configuration

The `serverpod_auth_idp_flutter` package implements the sign-in logic using [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple). The documentation for this package should in most cases also apply to the Serverpod integration.

_Note that Sign in with Apple may not work on some versions of the Simulator (iOS 13.5 works). This issue doesn't affect real devices._

### iOS and macOS

Enable the Sign in with Apple capability in your Xcode project:

1. Open your project in Xcode
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Sign in with Apple"

![Add capabilities](/img/authentication/providers/apple/1-xcode-add.png)

![Sign in with Apple](/img/authentication/providers/apple/2-xcode-sign-in-with-apple.png)

### Android

For Android, you need to configure the redirect URI in your app. The redirect URI should match what you configured in Apple Developer Portal and your server.

### Web

For web, configure the redirect URI in your Apple Developer Portal to match your server's callback route (e.g., `https://example.com/auth/callback`).

## Present the authentication UI

### Initializing the `AppleSignInService`

To use the AppleSignInService, you need to initialize it in your main function. The initialization is done from the `initializeAppleSignIn()` extension method on the `FlutterAuthSessionManager`.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

final client = Client('http://localhost:8080/')
  ..authSessionManager = FlutterAuthSessionManager();

void main() {
  client.auth.initialize();
  client.auth.initializeAppleSignIn();
}
```

### Using AppleSignInWidget

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Apple identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `AppleSignInWidget` to include the Apple authentication flow in your own custom UI.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

AppleSignInWidget(
  client: client,
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $error')),
    );
  },
)
```

The widget automatically handles:
- Apple Sign-In flow for iOS, macOS, Android, and Web.
- Token management.
- Underlying Apple Sign-In package error handling.

For details on how to customize the Apple Sign-In UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).
