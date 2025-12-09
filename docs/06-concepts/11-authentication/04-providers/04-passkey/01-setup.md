# Setup

Passkeys provide a passwordless authentication method using WebAuthn/FIDO2 standards. They offer a secure, phishing-resistant way for users to sign in using biometric authentication, security keys, or device PINs.

:::caution
This provider is currently experimental and implemented only on the server-side. Flutter client-side UI components are not yet available, but you can build custom UI using the generated client endpoints.
:::

:::caution
You need to install the auth module before you continue, see [Setup](../../01-setup).
:::

## Server-side configuration

Passkeys require minimal configuration. You will need only the hostname (relying party ID) that will be associated with your passkeys.

:::info
The hostname should match the domain where your application is hosted. For development, you can use `localhost` or your development domain.
:::

### Configure the Passkey identity provider

In your main `server.dart` file, configure the Passkey identity provider by setting the `PasskeyIdpConfig` in your `pod.initializeAuthServices()` configuration:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/passkey.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Configure Passkey identity provider
  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
    ],
    identityProviderBuilders: [
      PasskeyIdpConfig(
        hostname: pod.getPassword('passkeyHostname')!,
      ),
    ],
  );

  await pod.start();
}
```

:::tip
You can use the `PasskeyIdpConfigFromPasswords` constructor in replacement of the `PasskeyIdpConfig` above to automatically load the hostname from the `config/passwords.yaml` file or environment variables. It will expect the `passkeyHostname` key on the file or the `SERVERPOD_PASSWORD_passkeyHostname` environment variable.
:::

Then, extend the abstract endpoint to expose it on the server:

```dart
import 'package:serverpod_auth_idp_server/providers/passkey.dart';

class PasskeyIdpEndpoint extends PasskeyIdpBaseEndpoint {}
```

Finally, run `serverpod generate` to generate the client code and create a migration to initialize the database for the provider. More detailed instructions can be found in the general [identity providers setup section](../../01-setup#identity-providers-configuration).

### Basic configuration options

- `hostname`: Required. The hostname (relying party ID) to be used on the web and associated with any apps. This should match your application's domain.
- `challengeLifetime`: Optional. Maximum time after which a challenge must have been solved. Default is 5 minutes.

<!-- For more details on configuration options, see the [configuration section](./02-configuration). -->

## Client-side implementation

:::info
Flutter UI components for passkeys are not yet available. You'll need to implement the client-side passkey flow using the WebAuthn API directly or use a Flutter package that supports WebAuthn/FIDO2.
:::

### Using the generated endpoints

The generated client endpoints provide the following methods:

- `createChallenge()`: Creates a new challenge for registration or login.
- `register()`: Registers a new passkey for the authenticated user.
- `login()`: Authenticates a user using their passkey.
