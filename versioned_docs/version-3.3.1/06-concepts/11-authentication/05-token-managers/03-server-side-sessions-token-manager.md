# Server-side Sessions Token Manager

The `ServerSideSessionsTokenManager` uses session-based tokens stored in the database. This token manager provides:

- Stateful authentication (database queries for validation).
- Immediate session revocation.
- Immediate scopes update on existing sessions.
- Support for session expiration and inactivity timeouts.

## Server-side configuration

This token manager is created by passing a `ServerSideSessionsConfig` object to the `pod.initializeAuthServices()` as a `tokenManagerBuilder`.

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    ServerSideSessionsConfig(
      // The pepper used to hash the session key.
      sessionKeyHashPepper: pod.getPassword('serverSideSessionKeyHashPepper')!,
    ),
  ],
);
```

:::tip
You can use the `ServerSideSessionsConfigFromPasswords` constructor in replacement of the `ServerSideSessionsConfig` above to automatically load the credentials from the `config/passwords.yaml` file or environment variables. It will expect the `serverSideSessionKeyHashPepper` key on the file or the `SERVERPOD_PASSWORD_serverSideSessionKeyHashPepper` environment variable.
:::

### Basic configuration options

- `sessionKeyHashPepper`: Required. A secret pepper used for hashing session keys. Must be at least 10 characters long, but [the recommended length is 32 bytes](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2).

### Extra configuration options

Below is an example of a non-exhaustive list of some of the most common configuration options for the `ServerSideSessionsTokenManager`. For more details on all options, check the `ServerSideSessionsConfig` in-code documentation.

```dart
final serverSideSessionsConfig = ServerSideSessionsConfigFromPasswords(
  // Optional: Fallback peppers for pepper rotation
  // This is useful for allowing old sessions to be validated after a rotation.
  fallbackSessionKeyHashPeppers: [
    pod.getPassword('oldSessionKeyHashPepper')!,
  ],
  // Optional: Set default session lifetime (default is to never expire)
  defaultSessionLifetime: Duration(days: 30),
  // Optional: Set inactivity timeout (default is to never timeout)
  defaultSessionInactivityTimeout: Duration(days: 7),
  // Optional: Configure session key properties
  sessionKeySecretLength: 32,
  sessionKeyHashSaltLength: 16,
  // Check the [ServerSideSessionsConfig] documentation for more options.
);
```

## Client-side configuration

When using the `ServerSideSessionsTokenManager` in the server, no extra configuration is needed on the client. It will automatically include the session token in requests to the server. In case the session expires or is revoked, the client will automatically sign the user out and redirect to the login page.
