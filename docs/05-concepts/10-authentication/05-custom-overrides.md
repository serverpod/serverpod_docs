# Custom overrides

Serverpod is designed to make it as simple as possible to implement custom authentication overrides. The framework comes with an integrated auth token creation, validation, and communication system. With a simple setup, it is easy to generate custom tokens and include them in authenticated communication with the server.

## Server setup

After successfully authenticating a user, for example, through a username and password, an auth token can be created to preserve the authenticated user's permissions. This token is used to identify the user and facilitate endpoint authorization validation. When the user signs out, the token can be removed to prevent further access.

### Create auth token

To create an auth token, call the `signInUser` method in the `UserAuthentication` class, accessible through the `session.auth` field on the `session` object.

The `signInUser` method takes three arguments: the first is a unique `integer` identifier for the user, the second is information about the method used to authenticate the user, and the third is a set of scopes granted to the auth token.

```dart
var authToken = await session.auth.signInUser(myUserObject.id, 'myAuthMethod', scopes: {
    Scope('delete'),
    Scope('create'),
});
```

The example above creates an auth token for a user with the unique identifier taken from `myUserObject`. The auth token preserves that it was created using the method `myAuthMethod` and has the scopes `delete` and `create`.

:::info
The unique identifier for the user should uniquely identify the user regardless of authentication method. The information allows authentication tokens associated with the same user to be grouped.
:::

#### Custom auth tokens

The `UserAuthentication` class simplifies the token management but makes assumptions about what information should be stored in the auth token. If your project has different requirements, managing auth tokens manually with your defined model is possible. Custom auth tokens require that the token validation is overridden and adjusted to the new auth token format, explained in [override token validation](#override-token-validation).

### Token validation format

The framework requires tokens to be of `String` type, and the default token validation expects the token to be in the format `userId:key`. The `userId` is the unique identifier for the user, and the `key` is a generated auth token key. The `userId` and `key` are then retrieved from the token and validated towards the auth token stored as a result of the call to `session.auth.signInUser(...)`.

```dart
var authToken = await session.auth.signInUser(....);
var verifiableToken = '${authToken.userId}:${authToken.key}';
```

In the above example, the `verifiableToken` is created by concatenating the `userId` and `key` from the `authToken`. This token is then verifiable by the default token validation.

#### Override token validation

The token validation method can be overridden by providing a custom `authenticationHandler` callback when initializing Serverpod. The callback should return an `AuthenticationInfo` object if the token is valid, otherwise `null`.

```dart
// Initialize Serverpod and connect it with your generated code.
final pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  authenticationHandler: (Session session, String token) async {
    /// Custom validation handler
    if (token != 'valid') return null;

    return AuthenticationInfo(1, <Scope>{});
  },
);
```

In the above example, the `authenticationHandler` callback is overridden with a custom validation method. The method returns an `AuthenticationInfo` object with user id `1` and no scopes if the token is valid, otherwise `null`.

### Send token to client

After creating the token, it should be sent to the client. The client is then responsible for storing the token and including it in communication with the server. The token is usually sent in response to a successful sign-in request.

```dart
class UserEndpoint extends Endpoint {
  Future<String?> login(
    Session session,
    String username,
    String password,
  ) async {
    var identifier = authenticateUser(session, username, password);
    if (identifier == null) return null;

    var authToken = await session.auth.signInUser(
      identifier,
      'username',
      scopes: {},
    );

    return '${authToken.id}:${authToken.key}';
  }
}
```

In the above example, the `login` method authenticates the user and creates an auth token. The token is then returned to the client in the format expected by the default token validation.

### Remove auth token

When the default token validation is used, signing out a user on all devices is made simple with the `signOutUser` method in the `UserAuthentication` class. The method removes all auth tokens associated with the user.

```dart
class AuthenticatedEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;
  Future<void> logout(Session session) async {
    await session.auth.signOutUser();
  }
}
```

In the above example, the `logout` endpoint removes all auth tokens associated with the user. The user is then signed out and loses access to any protected endpoints.

#### Remove specific tokens

The `AuthKey` table stores all auth tokens and can be interacted with in the same way as any other model with a database in Serverpod. To remove specific tokens, the `AuthKey` table can be interacted with directly.

```dart
await AuthKey.db.deleteWhere(
  session,
  where: (t) => t.userId.equals(userId) & t.method.equals('username'),
);
```

In the above example, all auth tokens associated with the user `userId` and created with the method `username` are removed from the `AuthKey` table.

#### Custom token solution

If a [custom auth token](#custom-tokens) solution has been implemented, auth token removal must be handled manually. The `signOutUser` method does not provide an interface to interact with other database tables.

## Client setup

Enabling authentication in the client is as simple as configuring a key manager and placing any token in it. If a key manager is configured, the client will automatically query the manager for a token and include it in communication with the server.

### Configure key manager

Key managers need to implement the `AuthenticationKeyManager` interface. The key manager is configured when creating the client by passing it as the named parameter `authenticationKeyManager`. If no key manager is configured, the client will not include tokens in requests to the server.

```dart
class SimpleAuthKeyManager extends AuthenticationKeyManager {
  String? _key;

  @override
  Future<String?> get() async {
    return _key;
  }

  @override
  Future<void> put(String key) async {
    _key = key;
  }

  @override
  Future<void> remove() async {
    _key = null;
  }
}


var client = Client('http://$localhost:8080/',
    authenticationKeyManager: SimpleAuthKeyManager())
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

In the above example, the `SimpleAuthKeyManager` is configured as the client's authentication key manager. The `SimpleAuthKeyManager` stores the token in memory.

:::info

The `SimpleAuthKeyManager` is not practical and should only be used for testing. A secure implementation of the key manager is available in the `serverpod_auth_shared_flutter` package named `FlutterAuthenticationKeyManager`. It provides safe, persistent storage for the auth token.

:::

The key manager is then available through the client's `authenticationKeyManager` field.

```dart
var keyManager = client.authenticationKeyManager;
```

### Store token

When the client receives a token from the server, it is responsible for storing it in the key manager using the `put` method. The key manager will then include the token in all requests to the server.

```dart
await client.authenticationKeyManager?.put(token);
```

In the above example, the `token` is placed in the key manager. It will now be included in communication with the server.

### Remove token

To remove the token from the key manager, call the `remove` method.

```dart
await client.authenticationKeyManager?.remove();
```

The above example removes any token from the key manager.

### Retrieve token

To retrieve the token from the key manager, call the `get` method.

```dart
var token = await client.authenticationKeyManager?.get();
```

The above example retrieves the token from the key manager and stores it in the `token` variable.
