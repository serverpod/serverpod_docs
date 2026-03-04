# Custom overrides

It is recommended to use the `serverpod_auth_idp` package but if you have special requirements not fulfilled by it, you can implement your authentication module. Serverpod is designed to make it easy to add custom authentication overrides.

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

In the above example, the `authenticationHandler` callback is overridden with a custom validation method. The method returns an `AuthenticationInfo` object with `userIdentifier` `"1"` and no scopes if the token is the literal "valid", otherwise `null`.

:::note
The `userIdentifier` passed to the `AuthenticationInfo` constructor, as the first parameter, will always be converted to a `String` and thus stored internally. Since the default implementation uses `UuidValue` for the users, there is a convenience getter `userId`, which returns the `UuidValue` value.
:::

:::note
In the `authenticationHandler` callback the `authenticated` field on the session will always be `null` as it is the `authenticationHandler` that figures out who the user is.
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

Enabling authentication in the client is as simple as configuring an auth key provider. If an auth key provider is configured, the client will automatically query the provider for an authentication header value and include it in communication with the server.

### Configure auth key provider

Auth key providers need to implement the `ClientAuthKeyProvider` interface. The provider is configured when creating the client by passing it as the named parameter `authKeyProvider`. If no provider is configured, the client will not include authentication headers in requests to the server.

```dart
import 'package:serverpod_client/serverpod_client.dart';

class SimpleAuthKeyProvider implements ClientAuthKeyProvider {
  String? _key;

  @override
  Future<String?> get authHeaderValue async {
    if (_key == null) return null;
    return wrapAsBasicAuthHeaderValue(_key!);
  }

  Future<void> put(String key) async {
    _key = key;
  }

  Future<void> remove() async {
    _key = null;
  }
}

var client = Client('http://$localhost:8080/')
  ..authKeyProvider = SimpleAuthKeyProvider()
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

In the above example, the `SimpleAuthKeyProvider` is configured as the client's authentication key provider. The `SimpleAuthKeyProvider` stores the token in memory and wraps it as a Basic auth header value using the `wrapAsBasicAuthHeaderValue` utility function.

:::info
The `SimpleAuthKeyProvider` is not practical and should only be used for testing. A secure implementation of the auth key provider is available in the `serverpod_auth_core_flutter` package. It provides safe, persistent storage for the auth token.
:::

The auth key provider is then available through the client's `authKeyProvider` field. It is useful to create a getter for it to avoid unnecessary casting.

```dart
var authProvider = client.authKeyProvider as SimpleAuthKeyProvider;
```

It is the responsibility of the client to store the token in the auth key provider.

## Authentication schemes

By default Serverpod will pass the authentication token from client to server in accordance with the HTTP `authorization` header standard with the `basic` scheme name and encoding. This is securely transferred as the connection is TLS encrypted.

The default implementation encodes and wraps the user-provided token in a `basic` scheme which is automatically unwrapped on the server side before being handed to the user-provided authentication handler described above.

In other words the default transport implementation is "invisible" to user code.

### Implementing your own authentication scheme

If you are implementing your own authentication and are using the `basic` scheme, note that this is supported but will be automatically unwrapped i.e. decoded on the server side before being handed to your `AuthenticationHandler` implementation. It will in this case receive the decoded auth key value after the `basic` scheme name.

If you are implementing a different authentication scheme, for example OAuth2 using bearer tokens, you should return the appropriate header value from the `authHeaderValue` getter of your `ClientAuthKeyProvider` implementation. You can use the utility functions `wrapAsBasicAuthHeaderValue` or `wrapAsBearerAuthHeaderValue` to format the token correctly.

You will also need to implement the `AuthenticationHandler` accordingly, in order to process that header value server-side.

The header value must be compliant with the HTTP header format defined in RFC 9110 HTTP Semantics, 11.6.2. Authorization.
See:

- [HTTP Authorization header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization)
- [RFC 9110, 11.6.2. Authorization](https://httpwg.org/specs/rfc9110.html#field.authorization)

An approach to adding OAuth handling might make changes to the above code akin to the following.

Client side:

```dart
import 'package:serverpod_client/serverpod_client.dart';

class MyOAuthKeyProvider implements ClientAuthKeyProvider {
  String? _key;

  @override
  Future<String?> get authHeaderValue async {
    if (_key == null) return null;
    return wrapAsBearerAuthHeaderValue(myBearerTokenObtainer(_key!));
  }

  Future<void> put(String key) async {
    _key = key;
  }

  Future<void> remove() async {
    _key = null;
  }
}

var client = Client('http://$localhost:8080/')
  ..authKeyProvider = MyOAuthKeyProvider()
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
