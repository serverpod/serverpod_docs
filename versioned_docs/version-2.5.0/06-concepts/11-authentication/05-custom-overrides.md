# Custom overrides

It is recommended to use the `serverpod_auth` package but if you have special requirements not fulfilled by it, you can implement your authentication module. Serverpod is designed to make it easy to add custom authentication overrides.

## Server setup

When running a custom auth integration it is up to you to build the authentication model and issuing auth tokens.

### Token validation

The token validation is performed by providing a custom `AuthenticationHandler` callback when initializing Serverpod. The callback should return an `AuthenticationInfo` object if the token is valid, otherwise `null`.

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

:::note
In the authenticationHandler callback the `authenticated` field on the session will always be `null` as it is the authenticationHandler that figures out who the user is.
:::

:::info
By specifying the optional `authId` field in the `AuthenticationInfo` object you can link the user to a specific authentication id. This is useful when revoking authentication for a specific device.
:::

#### Scopes

The scopes returned from the `authenticationHandler` is used to grant access to scope restricted endpoints. The `Scope` class is a simple wrapper around a nullable `String` in dart. This means that you can format your scopes however you want as long as they are in a String format.

Normally if you implement a JWT you would store the scopes inside the token. When extracting them all you have to do is convert the String stored in the token into a Scope object by calling the constructor.

```dart
List<String> scopes = extractScopes(token);
Set<Scope> userScopes = scopes.map((scope) => Scope(scope)).toSet();
```

### Handling revoked authentication 

When a user's authentication is revoked, the server must be notified to respect the changes (e.g. to close method streams). Invoke the `session.messages.authenticationRevoked` method and raise the appropriate event to notify the server.

```dart
var userId = 1;
var revokedScopes = ['write'];
var message = RevokedAuthenticationScope(
  scopes: revokedScopes,
);

await session.messages.authenticationRevoked(
  userId,
  message,
);
```

##### Parameters

- `userId` - The user id belonging to the `AuthenticationInfo` object to be revoked.
- `message` - The revoked authentication event message. See below for the different type of messages.

#### Revoked authentication messages
There are three types of `RevokedAuthentication` messages that are used to specify the extent of the authentication revocation:

| Message type | Description |
|-----------|-------------|
| `RevokedAuthenticationUser` | All authentication is revoked for a user. |
| `RevokedAuthenticationAuthId` | A single authentication id is revoked for the user. This should match the `authId` field in the `AuthenticationInfo` object. |
| `RevokedAuthenticationScope` | List of scopes that have been revoked for a user. |

Each message type provides a tailored approach to revoke authentication based on different needs.

### Send token to client

You are responsible for implementing the endpoints to authenticate/authorize the user. But as an example such an endpoint could look like the following.

```dart
class UserEndpoint extends Endpoint {
  Future<LoginResponse> login(
    Session session,
    String username,
    String password,
  ) async {
    var identifier = authenticateUser(session, username, password);
    if (identifier == null) return null;

    return issueMyToken(identifier, scopes: {});
  }
}
```

In the above example, the `login` method authenticates the user and creates an auth token. The token is then returned to the client.

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

## Authentication schemes

By default Serverpod will pass the authentication token from client to server in accordance with the HTTP `authorization` header standard with the `basic` scheme name and encoding. This is securely transferred as the connection is TLS encrypted.

The default implementation encodes and wraps the user-provided token in a `basic` scheme which is automatically unwrapped on the server side before being handed to the user-provided authentication handler described above.

In other words the default transport implementation is "invisible" to user code.

### Implementing your own authentication scheme

If you are implementing your own authentication and are using the `basic` scheme, note that this is supported but will be automatically unwrapped i.e. decoded on the server side before being handed to your `AuthenticationHandler` implementation. It will in this case receive the decoded auth key value after the `basic` scheme name.

If you are implementing a different authentication scheme, for example OAuth 2 using bearer tokens, you should override the default method `toHeaderValue` of `AuthenticationKeyManager`. This client-side method converts the authentication key to the format that shall be sent as a transport header to the server.

You will also need to implement the `AuthenticationHandler` accordingly, in order to process that header value server-side.

The header value must be compliant with the HTTP header format defined in RFC 9110 HTTP Semantics, 11.6.2. Authorization.
See:
- [HTTP Authorization header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)
- [RFC 9110, 11.6.2. Authorization](https://httpwg.org/specs/rfc9110.html#field.authorization)

An approach to adding OAuth handling might make changes to the above code akin to the following.

Client side:

```dart
class MyOAuthKeyManager extends AuthenticationKeyManager {
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

  @override
  Future<String?> toHeaderValue(String? key) async {
    if (key == null) return null;
    return 'Bearer ${myBearerTokenObtainer(key)}';
  }
}


var client = Client('http://$localhost:8080/',
    authenticationKeyManager: SimpleAuthKeyManager())
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

Server side:

```dart
// Initialize Serverpod and connect it with your generated code.
final pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  authenticationHandler: (Session session, String token) async {
    /// Bearer token validation handler
    var (uid, scopes) = myBearerTokenValidator(token)
    if (uid == null) return null;

    return AuthenticationInfo(uid, scopes);
  },
);
```
