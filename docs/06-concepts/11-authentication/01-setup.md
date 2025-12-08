# Setup

Serverpod comes with built-in user management and authentication. It is possible to build a [custom authentication implementation](custom-overrides), but the recommended way to authenticate users is to use the `serverpod_auth` module. The module makes it easy to authenticate with email or social sign-ins and currently supports signing in with email, Google, Apple, Firebase (upcoming) and Passkeys.

Future versions of the authentication module will include more options. If you write another authentication module, please consider [contributing](/contribute) your code.

![Sign-in with Serverpod](https://github.com/serverpod/serverpod/raw/main/misc/images/sign-in.png)

## Installing the auth module

Serverpod's auth module makes it easy to authenticate users through email or 3rd parties. The authentication module also handles basic user information, such as user names and profile pictures. Make sure to use the same version numbers as for Serverpod itself for all dependencies.

## Server setup

Add the auth modules as dependencies to the server project's `pubspec.yaml`.

```sh
$ dart pub add serverpod_auth_idp_server
```

The `serverpod_auth_idp_server` package provides identity providers (Email, Google, Apple, Passkey) and exports all core components from the `serverpod_auth_core_server` package.

### Configure Authentication Services

In your main `server.dart` file, configure the authentication system using `pod.initializeAuthServices()`. This replaces the old `AuthConfig.set()` approach and provides a more flexible, modular architecture.

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Set up authentication services
  // The `pod.getPassword()` will get the value from `config/passwords.yaml`.
  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfig(
        refreshTokenHashPepper: pod.getPassword('jwtRefreshTokenHashPepper')!,
        algorithm: JwtAlgorithm.hmacSha512(
          SecretKey(pod.getPassword('jwtPrivateKey')!),
        )
      ),
    ],
  );


  await pod.start();
}
```

Optionally, add a nickname for the module in the `config/generator.yaml` file. This nickname will be used as the name of the module in the code.

```yaml
modules:
  serverpod_auth_core:
    nickname: auth_core
  serverpod_auth_idp:
    nickname: auth_idp
```

While still in the server project, generate the client code and endpoint methods for the auth module by running the `serverpod generate` command line tool.

```bash
$ serverpod generate
```

### Initialize the auth database

After adding the module to the server project, you need to initialize the database. First you have to create a new migration that includes the auth module tables. This is done by running the `serverpod create-migration` command line tool in the server project.

```bash
$ serverpod create-migration
```

Start your database container from the server project.

```bash
$ docker compose up --build --detach
```

Then apply the migration by starting the server with the `apply-migrations` flag.

```bash
$ dart run bin/main.dart --role maintenance --apply-migrations
```

The full migration instructions can be found in the [migration guide](../database/migrations).

### Token Manager Configuration

The authentication system uses token managers to handle authentication tokens. You need to configure at least one token manager to be used as the primary token manager. Additional token managers can be configured to be used for validation and management operations.

For more details on token managers, see the [Token Managers](05-token-managers) documentation.

#### JWT-based Token Manager

The `JwtConfig` uses JWT (JSON Web Tokens) for stateless authentication.

```dart
final authenticationTokenConfig = JwtConfig(
  refreshTokenHashPepper: pod.getPassword(
    'jwtRefreshTokenHashPepper',
  )!,
  algorithm: JwtAlgorithm.hmacSha512(
    SecretKey(pod.getPassword('jwtPrivateKey')!),
  ),
  // Optional: Set fallback algorithms for token verification
  // This is useful for allowing old tokens to be validated after a rotation.
  fallbackVerificationAlgorithms: [
    JwtAlgorithm.hmacSha512(
      SecretKey(pod.getPassword('fallbackJwtPrivateKey')!),
    ),
  ],
  // Optional: Configure token lifetimes
  accessTokenLifetime: Duration(minutes: 10),
  refreshTokenLifetime: Duration(days: 14),
  // Optional: Add custom claims to tokens.
  extraClaimsProvider: (session, context) async {
    return {
      'userRole': 'admin',
    };
  },
  // Check the [JwtConfig] documentation for more options.
);
```

**Required configuration:**

- `algorithm`: Required. The algorithm to use for signing tokens (HMAC SHA-512 or ECDSA SHA-512).
- `refreshTokenHashPepper`: Required. A secret pepper for hashing refresh tokens. Must be at least 10 characters long.

For more details on configuration options, check the `JwtConfig` in-code documentation.

#### Session-based Token Manager

The `ServerSideSessionsConfig` uses session-based tokens stored in the database. This was the default on previous versions of the authentication module, but also results in more database queries for validation and management operations.

```dart
final serverSideSessionsConfig = ServerSideSessionsConfig(
  sessionKeyHashPepper: pod.getPassword('serverSideSessionKeyHashPepper')!,
  // Optional: Fallback peppers for pepper rotation
  // This is useful for allowing old sessions to be validated after a rotation.
  fallbackSessionKeyHashPeppers: [
    pod.getPassword('oldSessionKeyHashPepper')!,
  ],
  // Optional: Set default session lifetime (default is to never expire)
  defaultSessionLifetime: Duration(days: 30),
  // Optional: Set inactivity timeout (default is to never timeout)
  defaultSessionInactivityTimeout: Duration(days: 7),
  // Check the [ServerSideSessionsConfig] documentation for more options.
);
```

**Required configuration:**

- `sessionKeyHashPepper`: Required. A secret pepper used for hashing session keys. Must be at least 10 characters long.

For more details on configuration options, check the `ServerSideSessionsConfig` in-code documentation.

### Identity Provider Configuration

Identity providers handle authentication with different methods (Email, Google, Apple, etc.). Each provider has its own configuration:

- **Email**: Requires email sending callbacks. See [Email Provider](providers/email) for details.
- **Google**: Requires Google OAuth credentials. See [Google Provider](providers/google) for details.
- **Apple**: Requires Apple Sign-In credentials. See [Apple Provider](providers/apple) for details.
- **Passkey (experimental)**: Requires Passkey credentials. See [Passkey Provider](providers/passkey) for details.

### Storing Secrets

Secrets like peppers and private keys should be stored securely. The example above uses `pod.getPassword()` which reads from your `config/passwords.yaml` file or environment variables.

Add secrets to `config/passwords.yaml`:

```yaml
development:
  serverSideSessionKeyHashPepper: 'your-session-pepper-here'
  jwtRefreshTokenHashPepper: 'your-refresh-token-pepper-here'
  jwtPrivateKey: 'your-private-key-here'
  emailSecretHashPepper: 'your-email-pepper-here'
  googleClientSecret: '{"type":"service_account",...}'
  # ... other secrets
```

:::info
When using the `config/passwords.yaml` file or environment variables, you can use a convenience version of token manager and identity provider builders that already load secrets from the passwords file while still allowing you to pass additional configuration options.

```dart
final jwtConfig = JwtConfigFromPasswords();
final serverSideSessionsConfig = ServerSideSessionsConfigFromPasswords();
final emailIdpConfig = EmailIdpConfigFromPasswords();
final googleIdpConfig = GoogleIdpConfigFromPasswords();
final appleIdpConfig = AppleIdpConfigFromPasswords();
final passkeyIdpConfig = PasskeyIdpConfigFromPasswords();
```
:::

:::warning
Never commit `config/passwords.yaml` to version control. Be sure to add it to your `.gitignore` file. Prefer environment variables or secure secret management in production.
:::

## Client setup

Add the `serverpod_auth_idp_client` package to your client project's `pubspec.yaml`. Make sure to use the same version numbers as for Serverpod itself for all dependencies.

```yaml
dependencies:
  ...
  serverpod_auth_idp_client: ^3.x.x
```

## App setup

First, add dependencies to your app's `pubspec.yaml` file for the methods of signing in that you want to support.

```yaml
dependencies:
  flutter:
    sdk: flutter
  serverpod_auth_idp_flutter: ^3.x.x
  serverpod_flutter: ^3.x.x
  your_client:
    path: ../your_client
```

Next, you need to set up a `FlutterAuthSessionManager`, which keeps track of the user's authentication state. It handles authentication tokens, token storage and refresh, and user session management.

```dart
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

late Client client;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const serverUrl = 'http://localhost:8080/';

  // Create the client with the auth session manager
  client = Client(serverUrl)
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  // Initialize authentication (restores session from storage and validates)
  await client.auth.initialize();

  runApp(MyApp());
}
```

The `FlutterAuthSessionManager` provides useful properties and methods for managing authentication state.

:::tip
In case you have an endpoint called `AuthEndpoint` - that will generate the `auth` getter on the client -, you can also get the `FlutterAuthSessionManager` from the client using the `client.authSessionManager` property. On the above example, you would replace the `client.auth.initialize()` call with `client.authSessionManager.initialize()`.
:::

### Initialize authentication

The `initialize()` method restores any existing session from storage and validates it with the server. It should be called when your app starts:

```dart
await client.auth.initialize();
```

This is equivalent to calling `restore()` followed by `validateAuthentication()`. If the authentication is no longer valid, the user is automatically signed out.

See [Client-side authentication](02-basics#client-side-authentication) for more details on how to interact with the authentication state from the client.
