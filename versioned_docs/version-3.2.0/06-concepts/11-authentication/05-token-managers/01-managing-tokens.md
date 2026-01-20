# Managing tokens

The authentication system uses token managers to handle authentication tokens. Token managers are responsible for issuing, validating, revoking, and listing authentication tokens.

## Default Token Managers

Serverpod provides two built-in token managers:
- `JwtTokenManager` for JWT-based authentication. See [JWT Token Manager](./jwt-token-manager) for details.
- `ServerSideSessionsTokenManager` for session-based authentication. See [Server-Side Sessions Token Manager](./server-side-sessions-token-manager) for details.

## Using the token managers

After configuring at least one token manager using the `pod.initializeAuthServices()` method, you can access the token manager instance using the `AuthServices.instance.tokenManager` property.

```dart
final tokenManager = AuthServices.instance.tokenManager;
```

It will return a `MultiTokenManager` instance that combines all the token managers configured for listing, validating and revoking tokens.

The `MultiTokenManager` is a composite token manager that is automatically created when initializing the authentication services and combines multiple token managers. It:

- Uses the primary token manager for issuing new tokens.
- Validates tokens against all managers (primary and additional).
- Delegates management operations to all managers.

### Token Validation Flow

When validating a token, the `MultiTokenManager`:

1. Tries the primary token manager first.
2. If validation fails, tries each additional token manager in order.
3. Returns the first successful validation result.
4. Returns `null` if all managers fail to validate.

This allows you to support multiple token types simultaneously, which is useful for:

- Migrating from one token type to another.
- Supporting legacy tokens alongside new tokens.
- Using different token types for different use cases.

## Token Lifecycle Management

### Issuing Tokens

Tokens are issued automatically by identity providers when users authenticate. You can also issue tokens programmatically:

```dart
final authSuccess = await AuthServices.instance.tokenManager.issueToken(
  session,
  authUserId: userId,
  method: 'custom',
  scopes: {Scope.admin},
);
```

### Validating Tokens

Tokens are validated automatically by the authentication handler. You can also validate tokens manually:

```dart
final authInfo = await AuthServices.instance.tokenManager.validateToken(
  session,
  token,
);

if (authInfo != null) {
  // Token is valid
  final userId = authInfo.userIdentifier;
} else {
  // Token is invalid or expired
}
```

### Revoking Tokens

Revoke specific tokens:

```dart
await AuthServices.instance.tokenManager.revokeToken(
  session,
  tokenId: 'token-id-here',
);
```

Revoke all tokens for a user:

```dart
await AuthServices.instance.tokenManager.revokeAllTokens(
  session,
  authUserId: userId,
);
```

Revoke tokens by method:

```dart
await AuthServices.instance.tokenManager.revokeAllTokens(
  session,
  authUserId: userId,
  method: 'email',
);
```

### Listing Tokens

List all tokens for a user:

```dart
final tokens = await AuthServices.instance.tokenManager.listTokens(
  session,
  authUserId: userId,
);

for (final token in tokens) {
  print('Token: ${token.tokenId}, Method: ${token.method}');
}
```

List tokens by method (i.e. "google", "email", "apple", etc.):

```dart
final tokens = await AuthServices.instance.tokenManager.listTokens(
  session,
  authUserId: userId,
  method: 'google',
);
```

## Accessing Specific Token Managers

In case more than one token manager is configured, you can access specific token manager types from the `AuthServices` instance using the `getTokenManager<T>()` method.

```dart
final jwtManager = AuthServices.getTokenManager<JwtTokenManager>();
final sessionManager = AuthServices.getTokenManager<ServerSideSessionsTokenManager>();
```
