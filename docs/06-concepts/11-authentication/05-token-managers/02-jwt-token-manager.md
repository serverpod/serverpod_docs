# JWT Token Manager

The `JwtTokenManager` uses JWT (JSON Web Tokens) for stateless authentication. This token manager provides:

- Stateless authentication (no database queries for validation).
- Access tokens with short lifetimes.
- Refresh tokens for long-term authentication.
- Automatic token rotation.

## Server-side configuration

This token manager is created by passing a `JwtConfig` object to the `pod.initializeAuthServices()` as a `tokenManagerBuilder`.

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfig(
      // The pepper used to hash the refresh token secret.
      refreshTokenHashPepper: pod.getPassword(
        'jwtRefreshTokenHashPepper',
      )!,
      // The algorithm used to sign the tokens.
      algorithm: JwtAlgorithm.hmacSha512(
        SecretKey(pod.getPassword('jwtHmacSha512PrivateKey')!),
      ),
    ),
  ],
);
```

:::tip
You can use the `JwtConfigFromPasswords` constructor in replacement of the `JwtConfig` above to automatically load the credentials from the `config/passwords.yaml` file or environment variables. It will expect either the following keys on the file:

    - `jwtRefreshTokenHashPepper`
    - `jwtHmacSha512PrivateKey`

Or the following environment variables:

    - `SERVERPOD_PASSWORD_jwtRefreshTokenHashPepper`
    - `SERVERPOD_PASSWORD_jwtHmacSha512PrivateKey`
:::

Then, extend the abstract endpoint to expose it on the server:

```dart
import 'package:serverpod_auth_idp_server/core.dart' as core;

class RefreshJwtTokensEndpoint extends core.RefreshJwtTokensEndpoint {}
```

Finally, run `serverpod generate` to generate the client code and expose the endpoint on the server.

### Basic configuration options

- `algorithm`: Required. The algorithm to use for signing tokens (HMAC SHA-512 or ECDSA SHA-512).
- `refreshTokenHashPepper`: Required. A secret pepper for hashing refresh tokens. Must be at least 10 characters long, but [the recommended length is 32 bytes](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2).

#### Token Algorithms

There are two supported token algorithms:

- **HMAC SHA-512**: Use HMAC SHA-512 for symmetric key signing.

    ```dart
    algorithm: JwtAlgorithm.hmacSha512(
      SecretKey(pod.getPassword('authenticationTokenPrivateKey')!),
    ),
    ```

- **ECDSA SHA-512**: Use ECDSA SHA-512 for asymmetric key signing.

    ```dart
    algorithm: JwtAlgorithm.ecdsaSha512(
      privateKey: ecPrivateKey,
      publicKey: ecPublicKey,
    ),
    ```

As of now, the `JwtConfigFromPasswords` only supports HMAC SHA-512. To use ECDSA SHA-512, you need to pass the private and public keys manually.

### Extra configuration options

Below is an example of a non-exhaustive list of some of the most common configuration options for the `JwtTokenManager`. For more details on all options, check the `JwtConfig` in-code documentation.

```dart
final jwtConfig = JwtConfigFromPasswords(
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
  // Claims will be included in every access token and sent with requests.
  extraClaimsProvider: (session, context) async {
    return {
      'userRole': 'admin',
      'organizationId': 'org-123',
    };
  },
  // Check the [JwtConfig] documentation for more options.
);
```

## Flutter-side configuration

When using the `JwtTokenManager` in the server, no extra configuration is needed on the Flutter. It will automatically include the access token in requests to the server and eagerly refresh the token when it is 30 seconds away from expiring. In case the refresh token expires, the client will automatically sign the user out and redirect to the login page.
