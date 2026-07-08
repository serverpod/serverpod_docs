---
sidebar_label: The basics
description: Authentication tokens are handled automatically by Serverpod. Learn how to access the signed-in user from the Session object.
---

# Authentication basics

Serverpod automatically checks if the user is logged in and if the user has the right privileges to access each endpoint. When using the Serverpod Authentication modules, you will not have to worry about keeping track of tokens, refreshing them or even including them in requests as this all happens automatically under the hood.

The `Session` object provides information about the current user. Access the current authentication through the synchronous `authenticated` getter of the `Session` object. It exposes a `userIdentifier`, a `String` that uniquely identifies the signed-in user. Use this id whenever you refer to a user.

```dart
Future<void> myMethod(Session session) async {
  final authenticationInfo = session.authenticated;
  final userIdentifier = authenticationInfo?.userIdentifier;
  ...
}
```

You can also use the Session object to check if a user is authenticated:

```dart
Future<void> myMethod(Session session) async {
  var isSignedIn = session.isUserSignedIn;
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
        yield session.isUserSignedIn; // Will always return false
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

Scopes define what an authenticated user is allowed to do. Each scope is an independent capability identified by a string name. Scopes do not inherit from each other. Holding `Scope.admin` does not grant any other scope.

Each endpoint exposes two properties for access control:

- `requireLogin`: the user must be signed in, with no specific scope required.
- `requiredScopes`: the user must hold every scope in the set.

To restrict access by scope, override the `requiredScopes` property:

```dart
class MyEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {Scope.admin};

  Future<void> myMethod(Session session) async {
    ...
  }
  ...
}
```

Serverpod ships with `Scope.admin` for built-in admin functionality in Serverpod modules. Define your own scope names for application-specific access control.

:::info
When `requiredScopes` is non-empty, authentication is required even if `requireLogin` is false.
:::

### Custom scopes

Define constants for your domain by extending the `Scope` class:

```dart
class CustomScope extends Scope {
  const CustomScope(String name) : super(name);

  static const userRead = CustomScope('userRead');
  static const userWrite = CustomScope('userWrite');
}
```

Then use the custom scopes on your endpoints:

```dart
class MyEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {CustomScope.userRead, CustomScope.userWrite};

  Future<void> myMethod(Session session) async {
    ...
  }
  ...
}
```

The user must hold both `userRead` and `userWrite` to access this endpoint. You can reuse the same scope constants across multiple endpoints to build different access combinations.

Keep scope names stable once deployed, as renaming a scope will revoke it from any user who had it.

You can also define shared scope requirements in a base endpoint class. See [Endpoint inheritance](../working-with-endpoints/endpoint-inheritance) for details.

:::caution
Keep in mind that a scope is merely an arbitrary string and can be written in any format you prefer. However, it's crucial to use unique strings for each scope, as duplicated scope strings may lead to unintentional data exposure.
:::

### How scopes combine

When an endpoint lists multiple scopes in `requiredScopes`, the user must have all of them. Serverpod evaluates scopes with AND logic. There is no OR matching and no scope hierarchy.

Consider a user management feature with two admin endpoints: one for aggregated user analytics and one for editing user data. Not every admin should be able to modify users, so the endpoints require different scope combinations:

```dart
class UserAnalyticsEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {Scope.admin};

  Future<UserStats> getStats(Session session) async {
    ...
  }
}

class UserEditEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {
    Scope.admin,
    CustomScope.userWrite,
  };

  Future<void> updateUser(Session session, UserData data) async {
    ...
  }
}
```

An admin user with only `Scope.admin` can call `UserAnalyticsEndpoint` but not `UserEditEndpoint`. To allow editing, grant both scopes:

```dart
import 'package:serverpod_auth_idp_server/core.dart';

await AuthServices.instance.authUsers.update(
  session,
  authUserId: authUserId,
  scopes: {Scope.admin, CustomScope.userWrite},
);
```

This lets you compose capabilities at the endpoint level instead of building nested roles.

### Managing scopes

New users are created without any scopes. Scope changes take effect only for new sign-ins. Existing sessions and tokens reflect the scopes that were set when the user last signed in.

To update a user's scopes, use the `update` method from `AuthServices.instance.authUsers`. This method replaces all previously stored scopes:

```dart
import 'package:serverpod_auth_idp_server/core.dart';

await AuthServices.instance.authUsers.update(
  session,
  authUserId: authUserId,
  scopes: {Scope.admin},
);
```

Changing a user's scopes does not affect existing sessions or tokens until the user signs in again or their tokens are revoked. For open streaming connections, Serverpod closes method streams when a revoked scope overlaps what the endpoint requires. See [Managing tokens](./token-managers/managing-tokens#revoking-tokens) for revoking tokens across devices.

### HTTP responses

When access is denied, Serverpod returns:

- **401 Unauthorized**: no token was provided, or the token is invalid.
- **403 Forbidden**: the user is authenticated but missing one or more required scopes.

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

This will persist the authentication information and refresh any open streaming connection. This is the method used by identity providers to register a signed in user. For more details on providers, see [Custom Providers](providers/custom-providers/overview).

### Monitor authentication changes

The `FlutterAuthSessionManager` exposes an `authInfoListenable` that is a `ValueListenable<AuthSuccess?>` to be used for listening to changes. This is useful for updating the UI when the authentication state changes:

```dart
@override
void initState() {
  super.initState();

  // Listen to authentication state changes.
  client.auth.authInfoListenable.addListener(_onAuthStateChanged);
}

// Don't forget to remove the listener when the widget is disposed.
@override
void dispose() {
  client.auth.authInfoListenable.removeListener(_onAuthStateChanged);
  super.dispose();
}

void _onAuthStateChanged() {
  setState(() {
    // UI will rebuild when auth state changes.
  });
}
```

The listener is triggered whenever the user's sign-in state changes.

### Validate the session and handle expiry

Serverpod refreshes tokens automatically while the user stays signed in, so most apps never handle tokens directly. Expiry becomes visible only when the refresh token itself has expired or been revoked: the client can no longer refresh, and the stored session is no longer valid.

Call `validateAuthentication` to check the current session against the server and sign the user out if it is no longer valid:

```dart
await client.auth.validateAuthentication(); // throws on transient errors; retry if needed
```

The method force-refreshes the token and confirms with the server that the user is still signed in. If the session is no longer valid, it signs the user out on the current device. A transient problem, such as a network error or timeout, does not sign the user out; the exception is thrown instead, so you can catch it and retry.

At app startup, use `initialize` to restore a stored session and validate it in one step:

```dart
bool validated = await client.auth.initialize();
```

The `initialize` method runs `restore` followed by `validateAuthentication`. If the stored session has expired, the user is signed out. If validation cannot complete for a transient reason (network error, server error, or timeout), `initialize` returns `false` and leaves the stored session in place so you can retry later, which keeps offline users signed in.

Because signing out updates the authentication state, a listener registered on `authInfoListenable` (see [Monitor authentication changes](#monitor-authentication-changes)) fires when a session expires, so you can route the user back to a sign-in screen from one place.

## User authentication

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
