# Setup

:::warning
The Anonymous identity provider is **experimental** and can not be completely used yet due to the missing support for account linking. The missing parts will be added in the next releases.
:::

To properly configure Anonymous authentication, you must allow anonymous access in your Serverpod auth configuration.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Server-side configuration

In your main `server.dart` file, configure the anonymous identity provider using the `AnonymousIdpConfig` object and add it to your `pod.initializeAuthServices()` configuration:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/anonymous.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
    ],
    identityProviderBuilders: [
      // Configure the Anonymous Identity Provider
      AnonymousIdpConfig(),
    ],
  );

  await pod.start();
}
```

Then, extend the abstract endpoint to expose it on the server:

```dart
import 'package:serverpod_auth_idp_server/providers/anonymous.dart';

class AnonymousIdpEndpoint extends AnonymousIdpBaseEndpoint {}
```

Then, run `serverpod generate` to generate the client code and create a migration to initialize the database for the provider. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Basic configuration options

Although the Anonymous IDP can be used directly with no other configuration, it is recommended to add some form of app attestation to prevent abuse on production environments. See the [Using a token for app attestation section](./configuration#using-a-token-for-app-attestation) for more details.

For other configuration options such as callbacks (before/after account creation) and rate limiting, see the [configuration section](./configuration).

## Client-side configuration

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Anonymous identity provider will be automatically detected and displayed in the sign-in widget as a "Continue without account" option.

You can also use the `AnonymousSignInWidget` to include anonymous sign-in in your own custom UI:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

AnonymousSignInWidget(
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

The widget displays a "Continue without account" button that creates an anonymous session when pressed. For details on customizing the button (size, shape), using a custom widget with `SignInWidget`, or building a fully custom UI with `AnonymousAuthController`, see the [customizing the UI section](./customizing-the-ui).
