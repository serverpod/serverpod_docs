# The basics

Serverpod automatically checks if the user is logged in and if the user has the right privileges to access the endpoint. When using the `serverpod_auth` module you will not have to worry about keeping track of tokens, refreshing them or, even including them in requests as this all happens automatically under the hood.

The `Session` object provides information about the current user. A unique `userId` identifies a user. You should use this id whenever you a referring to a user. Access the id of a signed-in user through the `auth` field of the `Session` object.

```dart
Future<void> myMethod(Session session) async {
  var userId = await session.auth.authenticatedUserId;
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

New users are created without any scopes. To update a user's scopes, use the `Users` class's `updateUserScopes` method (requires the `serverpod_auth_server` package). This method replaces all previously stored scopes.

```dart
await Users.updateUserScopes(session, userId, {Scope.admin});
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

## Managing Authentication in Serverpod's `StatusEndpoint`

The `StatusEndpoint` class includes methods for handling user sign-outs, whether from a single device, all devices, or via a deprecated method.

- **Sign out from the current device**

    Use the `signOutDevice` method to log the user out of the current session only, leaving other sessions active.

    ```dart
    await endpoints.status.signOutDevice(session);
    ```

- **Sign out from all devices**

    Use the `signOutAllDevices` method to log the user out from all devices, effectively ending all active sessions.

    ```dart
    await endpoints.status.signOutAllDevices(session);
    ```

- **Deprecated method for signing out from all devices**

    The `signOut` method is deprecated and will be removed in a future release. It currently allows signing out from all devices, but new implementations should use `signOutDevice` or `signOutAllDevices`.

    ```dart
    await endpoints.status.signOut(session);  // Deprecated
    ```


### Managing Authentication Keys and the Sign-Out Process

In addition to the `StatusEndpoint` methods, Serverpod provides more comprehensive tools for managing user authentication and sign-out processes across multiple devices.

For more detailed information on managing authentication keys, revoking specific session tokens, and ensuring client notifications are handled correctly during the sign-out process, please refer to the [Managing Authentication Keys and Signing Out Users](providers/custom-providers#managing-authentication-keys-and-signing-out-users) section.
