# The basics

Serverpod automatically checks if the user is logged in and if the user has the right privileges to access each endpoint. When using the Serverpod Authentication modules, you will not have to worry about keeping track of tokens, refreshing them or even including them in requests as this all happens automatically under the hood.

The `Session` object provides information about the current user. A unique `userIdentifier` identifies a user as a `UuidValue`. You should use this id whenever you are referring to a user. Access the id of a signed-in user through the `authenticated` asynchronous getter of the `Session` object.

```dart
Future<void> myMethod(Session session) async {
  final authenticationInfo = await session.authenticated;
  final userIdentifier = authenticationInfo?.userIdentifier;
  ...
}
```

You can also use the Session object to check if a user is authenticated:

```dart
Future<void> myMethod(Session session) async {
  var isSignedIn = await session.isUserSignedIn;
  ...
}
```

## Requiring authentication on endpoints

It is common to want to restrict access to an endpoint to users that have signed in. You can do this by overriding the `requireLogin` property of the `Endpoint` class.

```dart
class MyEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  Future<void> myMethod(Session session) async {
    ...
  }
  ...
}
```

## Explicitly allowing unauthenticated access

In some cases, you may want to explicitly allow certain endpoints or methods to be accessed without authentication. Serverpod provides the `@unauthenticatedClientCall` annotation for this purpose.

When an endpoint or method is annotated with `@unauthenticatedClientCall`:

- No authentication will be added to the header on the client when calling it.
- The server will receive calls as if there is no user signed in.

:::info
Under the hood, the `@unauthenticatedClientCall` annotation makes the client omit authentication headers for calls to the annotated endpoint or method. On the server side, it ensures that the session is treated as unauthenticated for those calls, regardless of any existing authentication state.
:::

You can use this annotation in two ways:

1. On the entire endpoint class to make all methods unauthenticated:

    ```dart
    @unauthenticatedClientCall
    class UnauthenticatedEndpoint extends Endpoint {
      Future<bool> someMethod(Session session) async {
        return session.isUserSignedIn; // Will always return false
      }

      Stream<bool> someStream(Session session) async* {
        yield await session.isUserSignedIn; // Will always return false
      }
    }
    ```

2. On specific methods to make only those methods unauthenticated:

    ```dart
    class PartiallyUnauthenticatedEndpoint extends Endpoint {
      @unauthenticatedClientCall
      Future<bool> publicMethod(Session session) async {
        return session.isUserSignedIn; // Will always return false
      }

      Future<bool> authenticatedMethod(Session session) async {
        return session.isUserSignedIn;
      }
    }
    ```

This is particularly useful for endpoints that must not receive authentication, such as JWT refresh endpoints.

:::warning
Using `@unauthenticatedClientCall` on an endpoint or method that also has `requireLogin` set to true will lead to a conflict. Since the client will suppress sending authentication information, but the server will expect it, calls to such endpoints or methods will always fail with an authentication error.
:::

## Authorization on endpoints

Serverpod also supports scopes for restricting access. One or more scopes can be associated with a user. For instance, this can be used to give admin access to a specific user. To restrict access for an endpoint, override the `requiredScopes` property. Note that setting `requiredScopes` implicitly sets `requireLogin` to true.

```dart
class MyEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  @override
  Set<Scope> get requiredScopes => {Scope.admin};

  Future<void> myMethod(Session session) async {
    ...
  }
  ...
}
```

### Managing scopes

New users are created without any scopes. To update a user's scopes, use the `AuthUsers` class's `updateUserScopes` method. This method replaces all previously stored scopes.

```dart
import 'package:serverpod_auth_idp_server/core.dart';

await AuthUsers.update(session, authUserId: authUserId, scopes: {Scope.admin});
```

### Custom scopes

You may need more granular access control for specific endpoints. To create custom scopes, extend the Scope class, as shown below:

```dart
class CustomScope extends Scope {
  const CustomScope(String name) : super(name);

  static const userRead = CustomScope('userRead');
  static const userWrite = CustomScope('userWrite');
}
```

Then use the custom scopes like this:

```dart
class MyEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  @override
  Set<Scope> get requiredScopes => {CustomScope.userRead, CustomScope.userWrite};

  Future<void> myMethod(Session session) async {
    ...
  }
  ...
}
```

:::caution
Keep in mind that a scope is merely an arbitrary string and can be written in any format you prefer. However, it's crucial to use unique strings for each scope, as duplicated scope strings may lead to unintentional data exposure.
:::

## Client-side authentication

On the client side, authentication state is managed through the `FlutterAuthSessionManager`, which is accessible via `client.auth`.

:::info
If you are building a pure Dart application using Serverpod, you can use the `ClientAuthSessionManager` declared in the `serverpod_auth_core_client` package instead of the `FlutterAuthSessionManager`. It has the same functionality, with the exception of a `authInfoListenable` getter that is tied to the Flutter framework.
:::

### Check authentication state

To check if the user is signed in:

```dart
bool isSignedIn = client.auth.isAuthenticated;
```

Returns `true` if the user is signed in, or `false` otherwise.

### Access current authentication info

To retrieve information about the current authentication:

```dart
AuthSuccess? authInfo = client.auth.authInfo;
```

Returns an `AuthSuccess` object if the user is currently signed in, or `null` if the user is not.

### Register authentication

To register a signed in user, call:

```dart
await client.auth.updateSignedInUser(authInfo);
```

This will persist the authentication information and refresh any open streaming connection. This is the method used by identity providers to register a signed in user. For more details on providers, see [Custom Providers](providers/custom-providers).

### Monitor authentication changes

The `FlutterAuthSessionManager` exposes an `authInfoNotifier` that is a `ValueListenable<AuthSuccess?>` to be used for listening to changes. This is useful for updating the UI when the authentication state changes:

```dart
@override
void initState() {
  super.initState();

  // Listen to authentication state changes.
  client.auth.authInfoNotifier.addListener(_onAuthStateChanged);
}

// Don't forget to remove the listener when the widget is disposed.
@override
void dispose() {
  client.auth.authInfoNotifier.removeListener(_onAuthStateChanged);
  super.dispose();
}

void _onAuthStateChanged() {
  setState(() {
    // UI will rebuild when auth state changes.
  });
}
```

The listener is triggered whenever the user's sign-in state changes.## User authentication

### Signing out users

The `FlutterAuthSessionManager` provides methods for handling user sign-outs, whether from a single device or all devices.

:::info
The below methods use the `StatusEndpoint` methods under the hood, which are also directly accessible on the client using the `client.modules.auth.status` getter. In addition to these methods, Serverpod provides more comprehensive tools for managing user authentication and sign-out processes across multiple devices.

For more detailed information on managing and revoking authentication keys, please refer to the [Managing tokens](./token-managers/managing-tokens#revoking-tokens) section.
:::

#### Sign out current device

To sign the user out from the current device:

```dart
await client.auth.signOutDevice();
```

Returns `true` if the sign-out is successful, or `false` if it fails. Either way, the sign-out will be performed on the application and update the authentication state.

#### Sign out all devices

To sign the user out across all devices:

```dart
await client.auth.signOutAllDevices();
```

Returns `true` if the user is successfully signed out from all devices, or `false` if it fails. Also proceed with the sign-out on the application regardless of the result of the operation on the server.
