# Working with users

It's a common task to read or update user information on your server. You can always retrieve the id of a signed-in user through the session object.

```dart
var userId = await session.authenticated.userId;
```

If you sign in users through the auth module, you will be able to retrieve more information through the static methods of the `Users` class.

```dart
var userInfo = await Users.findUserByUserId(session, userId!);
```

The `UserInfo` is automatically populated when the user signs in. Different data may be available depending on which method was used for authentication.

:::tip

The `Users` class contains many other convenient methods for working with users. You can find the full documentation [here](https://pub.dev/documentation/serverpod_auth_server/latest/protocol/Users-class.html).

:::

## Displaying or editing user images

The module has built-in methods for handling a user's basic settings, including uploading new profile pictures.

![UserImageButton](https://github.com/serverpod/serverpod/raw/main/misc/images/user-image-button.png)

To display a user's profile picture, use the `CircularUserImage` widget and pass a `UserInfo` retrieved from the `SessionManager`.

To edit a user profile image, use the `UserImageButton` widget. It will automatically fetch the signed-in user's profile picture and communicate with the server.
