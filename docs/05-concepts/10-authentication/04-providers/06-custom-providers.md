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

The example above tries to find a user by email and user identifier. If no user is found, a new user is created with the provided information. The methods that you must implement yourself is `authenticateUser` and `findOrCreateUser`, keep in mind that they possibly take different parameters than in this simplified example.

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
var authToken = await session.auth.signInUser(myUserObject.id, 'myAuthMethod', scopes: {
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

### Remove auth token

When the default token validation is used, signing out a user on all devices is made simple with the `signOutUser` method in the `UserAuthentication` class. The method removes all auth tokens associated with the user.

```dart
class AuthenticatedEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;
  Future<void> logout(Session session) async {
    await UserAuthentication.signOutUser(session);
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

## Client setup

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
