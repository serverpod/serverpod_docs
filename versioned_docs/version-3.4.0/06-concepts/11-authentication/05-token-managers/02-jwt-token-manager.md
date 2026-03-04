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

### Attaching custom metadata to tokens

You can attach custom metadata to each JWT refresh token by providing an `onRefreshTokenCreated` callback. This is useful for storing device information, IP address, user agent, or any other data you need to query or use later (for example, to list or revoke tokens by device). The callback runs when a refresh token is created, within the same transaction as the token insert.

Define a server-only table that relates to `RefreshToken` and store your metadata there. Example schema:

```yaml
class: TokenMetadata
serverOnly: true
table: token_metadata
fields:
  ### The [RefreshToken] this metadata belongs to
  refreshToken: module:serverpod_auth_core:RefreshToken?, relation(onDelete=Cascade)

  ### The name of the token
  name: String?

  ### Device information for the token
  deviceName: String?

  ### IP address from which the token was created
  ipAddress: String?

  ### User agent string
  userAgent: String?

indexes:
  refresh_token_id_unique_idx:
    fields: refreshTokenId
    unique: true
```

Then configure the callback in your JWT config:

```dart
JwtConfigFromPasswords(
  onRefreshTokenCreated:
      (
        final session, {
        required final authUserId,
        required final refreshTokenId,
        required final transaction,
      }) async {
        await TokenMetadata.db.insertRow(
          session,
          TokenMetadata(
            refreshTokenId: refreshTokenId,
            name: 'general-token',
            ipAddress: session.request?.connectionInfo.remote.address.toString(),
            userAgent: session.request?.headers.userAgent,
          ),
          transaction: transaction,
        );
      },
),
```

To revoke tokens based on your custom metadata, query the metadata table for the token IDs you want to revoke and call `revokeToken` for each:

```dart
final tokenMetadata = await TokenMetadata.db.find(
  session,
  where: (final row) => row.deviceName.equals('Old Device'),
);

for (final row in tokenMetadata) {
  await AuthServices.instance.tokenManager.revokeToken(
    session,
    tokenId: row.refreshTokenId.toString(),
  );
}
```

#### Attaching metadata when issuing tokens from an endpoint

The `onRefreshTokenCreated` callback is global and runs for every new refresh token (including those created by identity providers). When you create a token from an endpoint—for example, a personal access token (PAT) or CLI token—you often have endpoint-specific parameters (e.g. a token name or label) that the callback cannot see. In that case, issue the token with `AuthServices.instance.tokenManager.issueToken`, then use the returned `AuthSuccess.jwtRefreshTokenId` to insert your metadata with the endpoint's parameters:

```dart
final authSuccess = await AuthServices.instance.tokenManager.issueToken(
  session,
  authUserId: userId,
  method: 'pat',
  scopes: {Scope.admin},
);

await TokenMetadata.db.insertRow(
  session,
  TokenMetadata(
    refreshTokenId: authSuccess.jwtRefreshTokenId,
    name: tokenName, // from your endpoint parameter
    deviceName: deviceName, // from your endpoint parameter
    ipAddress: session.request?.connectionInfo.remote.address.toString(),
    userAgent: session.request?.headers.userAgent,
  ),
);
```

## Client-side configuration

When using the `JwtTokenManager` in the server, no extra configuration is needed on the client. It will automatically include the access token in requests to the server and eagerly refresh the token when it is 30 seconds away from expiring. In case the refresh token expires, the client will automatically sign the user out and redirect to the login page.
