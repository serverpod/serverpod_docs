# Custom providers

Serverpod's authentication module makes it easy to implement custom authentication providers. This allows you to leverage all the existing providers supplied by the module along with the specific providers your project requires.

## Server setup

After successfully authenticating a user through a customer provider, an auth token can be created and connected to the user to preserve the authenticated user's permissions. This token is used to identify the user and facilitate endpoint authorization validation. The token can be removed when the user signs out to prevent further access.

### Connect user

The authentication module provides methods to find or create users. This ensures that all authentication tokens from the same user are connected.

Users can be identified either by their email through the `Users.findUserByEmail(...)` method or by a unique identifier through the `Users.findUserByIdentifier(...)` method.

If no user is found, a new user can be created through the `Users.createUser(...)` method.

```dart
UserInfo? userInfo;
userInfo = await Users.findUserByEmail(session, email);
userInfo ??= await Users.findUserByIdentifier(session, userIdentifier);
if (userInfo == null) {
  userInfo = UserInfo(
    userIdentifier: userIdentifier,
    userName: name,
    email: email,
    blocked: false,
    created: DateTime.now().toUtc(),
    scopeNames: [],
  );
  userInfo = await Users.createUser(session, userInfo, _authMethod);
}
```

The example above tries to find a user by email and user identifier. If no user is found, a new user is created with the provided information.

:::note

For many authentication platforms the `userIdentifier` is the user's email, but it can also be another unique identifier such as a phone number or a social security number.

:::

### Custom identification methods

If other identification methods are required you can easily implement them by accessing the database directly. The `UserInfo` model can be interacted with in the same way as any other model with a database in Serverpod.

```dart
var userInfo = await UserInfo.db.findFirstRow(
  session,
  where: (t) => t.fullName.equals(name),
);
```

The example above shows how to find a user by name using the `UserInfo` model.

### Create auth token

When a user has been found or created, an auth token that is connected to the user should be created.

To create an auth token, call the `signInUser` method in the `UserAuthentication` class, accessible as a static method, e.g. `UserAuthentication.signInUser`.

The `signInUser` method takes four arguments: the first is the session object, the second is the user ID, the third is information about the method of authentication, and the fourth is a set of scopes granted to the auth token.

```dart
var authToken = await UserAuthentication.signInUser(userInfo.id, 'myAuthMethod', scopes: {
    Scope('delete'),
    Scope('create'),
});
```

The example above creates an auth token for a user with the unique identifier taken from the `userInfo`. The auth token preserves that it was created using the method `myAuthMethod` and has the scopes `delete` and `create`.

:::info
The unique identifier for the user should uniquely identify the user regardless of authentication method. The information allows authentication tokens associated with the same user to be grouped.
:::

### Send auth token to client

Once the auth token is created, it should be sent to the client. We recommend doing this using an `AuthenticationResponse`. This ensures compatibility with the client-side authentication module.

```dart
class MyAuthenticationEndpoint extends Endpoint {
  Future<AuthenticationResponse> login(
    Session session,
    String username,
    String password,
  ) async {
    // Authenticates a user with email and password.
    if (!authenticateUser(session, username, password)) {
      return AuthenticationResponse(success: false);
    }

    // Finds or creates a user in the database using the User methods.
    var userInfo = findOrCreateUser(session, username);

    // Creates an authentication key for the user.
    var authToken = await UserAuthentication.signInUser(
      session,
      userInfo.id!,
      'myAuth',
      scopes: {},
    );

    // Returns the authentication response.
    return AuthenticationResponse(
      success: true,
      keyId: authToken.id,
      key: authToken.key,
      userInfo: userInfo,
    );
  }
}
```

The example above shows how to create an `AuthenticationResponse` with the auth token and user information.

## Managing Authentication Keys and Signing Out Users

Serverpod provides built-in methods for managing user authentication across multiple devices. Below are the key functions for signing out users and revoking authentication keys. It is crucial to use these methods to ensure that all required steps, such as notifying clients and clearing session data, are properly handled.

### Revoking Authentication Keys (Per Device)

To sign a user out from a specific device, you can revoke the authentication key associated with that session using the `revokeAuthKey` method. This method targets a specific session and allows the user to remain signed in on other devices.

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

#### Importance of Using Built-In Methods

Directly deleting authentication keys from the `AuthKey` table is not recommended, as this bypasses essential steps such as notifying connected clients and clearing the session's authentication data. The `revokeAuthKey` method performs several additional actions, including:
- Sending a notification to the client via `session.messages.authenticationRevoked`.
- Clearing the session’s authentication data with `session.updateAuthenticated(null)` if the user being signed out is the one currently authenticated.

Failure to use these built-in methods can lead to inconsistencies, such as clients not being aware that their session has been revoked.

#### Example: Removing Specific Tokens (Direct Deletion)

```dart
await AuthKey.db.deleteWhere(
  session,
  where: (t) => t.userId.equals(userId) & t.method.equals('username'),
);
```

> ⚠️ **Warning**: While this approach removes authentication tokens directly from the `AuthKey` table, it does not handle the necessary notifications and session updates. It is strongly recommended to use `UserAuthentication.revokeAuthKey` to ensure a complete and consistent sign-out process, including notifying clients and clearing session data.

### Signing Out from All Devices

The `signOutUser` method logs a user out from all devices where they are signed in. This method deletes all active authentication keys associated with the user, effectively ending all sessions for that user across all devices.

#### Usage:

```dart
await UserAuthentication.signOutUser(
  session,
  userId: 123,  // Optional: If omitted, the currently authenticated user will be signed out
);
```

#### Example 1: Signing Out a Specific User (With `userId`)

In this example, a specific `userId` is provided to sign out that user from all their devices.

```dart
// Sign out the user with ID 123 from all devices
await UserAuthentication.signOutUser(
  session,
  userId: 123,
);
```

In addition to deleting the user's authentication tokens, the `signOutUser` method also:
- Notifies clients about the revoked authentication using `session.messages.authenticationRevoked`.
- Updates the session’s authentication state with `session.updateAuthenticated(null)` if the user being signed out is the one currently authenticated.

#### Example 2: Signing Out the Currently Authenticated User (Without `userId`)

If no `userId` is provided, `signOutUser` will automatically sign out the user who is currently authenticated in the session.

```dart
// Sign out the currently authenticated user
await UserAuthentication.signOutUser(
  session,  // No userId provided, signs out the current user
);
```

This method handles all necessary steps, including token deletion, client notifications, and session updates.

### Example: Removing All Auth Tokens in an Endpoint

To sign out a user on all devices using an endpoint, the `signOutUser` method in the `UserAuthentication` class can be employed. This method ensures that all authentication tokens associated with the user are removed and that all related processes are correctly handled.

```dart
class AuthenticatedEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;

  Future<void> logout(Session session) async {
    await UserAuthentication.signOutUser(session);
  }
}
```

In this example, the `logout` endpoint ensures that all authentication tokens are removed, and the user is signed out from all devices. The necessary client notifications and session updates are handled automatically.

## Client Setup

The client must store and include the auth token in communication with the server. Luckily, the client-side authentication module handles this for you through the `SessionManager`.

The session manager is responsible for storing the auth token and user information. It is initialized on client startup and will restore any existing user session from local storage.

After a successful authentication where an authentication response is returned from the server, the user should be registered in the session manager through the `sessionManager.registerSignedInUser(...)` method. The session manager singleton is accessible by calling `SessionManager.instance`.

```dart
var serverResponse = await caller.myAuthentication.login(username, password);

if (serverResponse.success) {
    // Store the user info in the session manager.
    SessionManager sessionManager = await SessionManager.instance;
    await sessionManager.registerSignedInUser(
        serverResponse.userInfo!,
        serverResponse.keyId!,
        serverResponse.key!,
    );
}
```

The example above shows how to register a signed-in user in the session manager.
