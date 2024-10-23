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

## Managing Authentication in Serverpod

Serverpod provides built-in methods for managing user authentication across multiple devices. Below are the key functions for signing out users and revoking authentication keys.

### Revoking Authentication Keys (Per Device)

To sign a user out from a specific device, you can revoke the authentication key associated with that session using the `revokeAuthKey` method. This method targets a specific session and leaves the user signed in on other devices.

#### Usage:

```dart
await UserAuthentication.revokeAuthKey(
  session,
  authKeyId: 'auth-key-id-here',
);
```

#### Example: Fetching and Revoking an Authentication Key

To revoke a specific authentication key, you first need to fetch the keys associated with a user. You can then select the key you want to revoke and call the `revokeAuthKey` method.

```dart
// Fetch all authentication keys for the user
var authKeys = await AuthKey.db.find(
  session,
  where: (row) => row.userId.equals(userId),
);

// Revoke a specific key (for example, the last one)
if (authKeys.isNotEmpty) {
  var authKeyId = authKeys.last.id.toString();  // Convert the ID to string
  await UserAuthentication.revokeAuthKey(
    session,
    authKeyId: authKeyId,
  );
}
```

In this example:
- All authentication keys for the specified user are retrieved from the database.
- The `revokeAuthKey` method is used to remove the last session (or whichever key you choose).

### Signing Out from All Devices

The `signOutUser` method is used to log a user out from all devices where they are currently signed in. This method deletes all active authentication keys associated with the user, effectively ending all sessions for that user across all devices.

#### Usage:

```dart
await UserAuthentication.signOutUser(
  session,
  userId: 123,  // Optional: If omitted, the currently authenticated user will be signed out
);
```

#### Example 1: Signing out a specific user (with userId)

In this example, we provide a specific `userId` to sign out that user from all their devices.

```dart
// Sign out the user with ID 123 from all devices
await UserAuthentication.signOutUser(
  session,
  userId: 123,  // Sign out the specified user
);
```

This will revoke all active sessions for the user with `userId` 123, signing them out from all devices they are logged into.

#### Example 2: Signing out the currently authenticated user (without userId)

If no `userId` is provided, `signOutUser` will automatically sign out the user who is currently authenticated in the session. This can be useful when you want to log out the user who initiated the action.

```dart
// Sign out the currently authenticated user
await UserAuthentication.signOutUser(
  session,  // No userId provided, signs out the current user
);
```

This will log out the user currently associated with the `session`. All active sessions for this user across all devices will be revoked.

### Managing Authentication in `StatusEndpoint`

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
