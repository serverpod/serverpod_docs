# The basics

Serverpod automatically checks if the user is logged in and if the user has the right privileges to access the endpoint. When using the `serverpod_auth` module you will not have to worry about keeping track of tokens, refreshing them or, even including them in requests as this all happens automatically under the hood.

The `Session` object provides information about the current user. A unique `userId` identifies a user. You should use this id whenever you a referring to a user. Access the id of a signed-in user through the `authenticated` field of the `Session` object.

```dart
Future<void> myMethod(Session session) async {
  var userId = (await session.authenticated)?.userId;
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

## User authentication

The `StatusEndpoint` class includes methods for handling user sign-outs, whether from a single device or all devices.

:::info

In addition to the `StatusEndpoint` methods, Serverpod provides more comprehensive tools for managing user authentication and sign-out processes across multiple devices.

For more detailed information on managing and revoking authentication keys, please refer to the [Revoking authentication keys](providers/custom-providers#revoking-authentication-keys) section.

:::

#### Sign out device

To sign out a single device:

```dart
await client.modules.auth.status.signOutDevice();
```

This status endpoint method obtains the authentication key from session's authentication information, then revokes that key.

#### Sign out all devices

To sign the user out across all devices:

```dart
await client.modules.auth.status.signOutAllDevices();
```

This status endpoint retrieves the user ID from session's authentication information, then revokes all authentication keys related to that user.

:::info 
<span id="deprecated-signout-endpoint"></span>
The `signOut` status endpoint is deprecated. Use `signOutDevice` or `signOutAllDevices` instead.

```dart
await client.modules.auth.status.signOut();  // Deprecated
```

The behavior of `signOut` is controlled by `legacyUserSignOutBehavior`, which you can adjust in the [configure authentication](setup#configure-authentication) section. This allows you to control the signout behaviour of already shipped clients.
::: 
