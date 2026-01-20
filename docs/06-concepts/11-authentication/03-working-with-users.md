# Working with users

The authentication module provides convenient ways to work with your authenticated users and their related profile data.

## Authenticated users

All authenticated users have an authentication identifier, that uniquely identifies them across the server. This can be retrieved from the `session` object as a `String` through the `userIdentifier` property or as a `UuidValue` from the `authUserId` extension provided by the authentication module.

```dart
var userIdString = session.authenticated?.userIdentifier;
// requires `import 'package:serverpod_auth_idp_server/serverpod_auth_idp_server.dart';`
var userIdUuidValue = session.authenticated?.authUserId;
```

Further operations on the authenticated user can be performed using the `AuthUsers` class which is provide by the `AuthServices` instance.

```dart
await AuthServices.instance.authUsers.delete(session, userIdUuidValue);
```

For the full list of operations, see the [AuthUsers](https://pub.dev/documentation/serverpod_auth_core_server/latest/serverpod_auth_core_server/AuthUsers-class.html) class documentation.

## Blocking users

You can block users to prevent them from signing in to your application. When a blocked user attempts to authenticate, an `AuthUserBlockedException` will be thrown, and the authentication will fail.

### Blocking or unblocking a user

To block/unblock a user, use the `update` method of the `AuthUsers` class:

```dart
await AuthServices.instance.authUsers.update(
  session,
  authUserId: authUserId,
  blocked: true, // or false to unblock
);
```

Users can also be created with the blocked status set from the start:
```dart
await AuthServices.instance.authUsers.create(
  session,
  blocked: true,
);
```

:::note
When a user is blocked, they will not be able to sign in until they are unblocked. However, blocking a user does not automatically revoke their existing sessions. Be sure to revoke existing sessions for a complete block operation. See [Revoking tokens](./token-managers/managing-tokens#revoking-tokens) for more details.
:::

## User profiles

By default, all authenticated users have a `UserProfile` object that contains information about the signed-in user. To access the `UserProfile` object, you can use the `userProfile` extension on the `AuthenticationInfo` object.

```dart
var userProfile = await session.authenticated?.userProfile(session);
```

The `UserProfile` contains a basic set of information about the user, such as their full name, email address, and profile picture.

This information is automatically populated when the user signs in. Based on the authentication method used, different data may be available.

It's a common task to read or update user information on your server. The `UserProfiles` class provides many convenient methods for working with user profiles and is accessible through the `AuthServices` instance.

```dart
await AuthServices.instance.userProfiles.changeFullName(session, authUserId, 'my name');
```

For the full list of operations, see the [UserProfiles](https://pub.dev/documentation/serverpod_auth_core_server/latest/serverpod_auth_core_server/UserProfiles-class.html) class documentation.

### Accessing user profiles from the app

To access the user profile from your Flutter app, you can use the `userProfileInfo` endpoint that is included in the authentication module:

```dart
final userProfile = await client.modules.serverpod_auth_core.userProfileInfo.get();
```

This returns a `UserProfileModel` object containing the logged-in user's profile information such as their name, email, and profile picture.

### Extending the user profile edit endpoint

The authentication module provides a `UserProfileEditBaseEndpoint` abstract class that you can extend to expose user profile editing functionality to your app. This base endpoint includes methods for:

- Removing user images
- Setting user images
- Changing user names
- Changing full names

To enable profile editing in your app, create a concrete endpoint class on your server by extending `UserProfileEditBaseEndpoint`:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';

class UserProfileEditEndpoint extends UserProfileEditBaseEndpoint {}
```

This endpoint will have both `get` (same as `userProfileInfo`) and all profile editing methods. You can then call these methods from your Flutter app:

```dart
// Get the user's profile
final profile = await client.userProfileEdit.get();

// Change the user's full name
final updatedProfile = await client.userProfileEdit.changeFullName('John Doe');

// Change the user's username
final updatedProfile = await client.userProfileEdit.changeUserName('johndoe');

// Remove the user's profile image
final updatedProfile = await client.userProfileEdit.removeUserImage();

// Set a new profile image
final ByteData imageData = // ... load image data
final updatedProfile = await client.userProfileEdit.setUserImage(imageData);
```

:::note
The `UserProfileEditBaseEndpoint` requires authentication and operates on the currently authenticated user's profile.
:::

You can also extend the endpoint class to add custom profile editing functionality:

```dart
class UserProfileEditEndpoint extends UserProfileEditBaseEndpoint {
  Future<UserProfileModel> updateBio(Session session, String bio) async {
    final userId = session.authenticated!.authUserId;

    // Your custom logic to update the bio
    // ...

    return userProfiles.findUserProfileByUserId(session, userId);
  }
}
```

### Setting a default user image

When logging in from some providers, the user image is automatically fetched and set as the user's profile picture - such as with Google Sign In. However, when an image is not found or the provider does not expose the picture, it is possible to set a default user image using the `UserProfileConfig` object.

```dart
  pod.initializeAuthServices(
    userProfileConfig: UserProfileConfig(
      // NOTE: The `userImageGenerator` parameter is optional and defaults to
      // the value below - which generates Gmail-style images. You can change
      // this parameter to generate any kind of placeholder image. The function
      // will be called when invoking the `setDefaultUserImage` method.
      userImageGenerator: defaultUserImageGenerator,
      onAfterUserProfileCreated:
          (session, userProfile, {required transaction}) async {
            await AuthServices.instance.userProfiles.setDefaultUserImage(
              session,
              userProfile.authUserId,
              transaction: transaction,
            );
          },
    ),
  ...
  );
```

## Attaching additional information

The recommended way to attach additional information to an authenticated user is to use a relation in the Database. This makes it easy to query the data later based on the user's authentication identifier.

```yaml
class: MyDomainData
table: my_domain_data
fields:
  ### The [AuthUser] this profile belongs to
  authUser: module:serverpod_auth_core:AuthUser?, relation(onDelete=Cascade)
  additionalInfo: String

indexes:
  auth_user_id_unique_idx:
    fields: authUserId
    unique: true
```

:::note
Note that the `AuthUser` model is declared in the `serverpod_auth_core` module, which is automatically included in your project as a dependency of the `serverpod_auth_idp` module. If you are not ignoring the generated files in your `analysis_options.yaml`, you might need to explicitly add the `serverpod_auth_core` module to your project to prevent `depend_on_referenced_packages` lint errors. The general recommendation, however, is to ignore linting on generated files:

```yaml
# analysis_options.yaml
analyzer:
  exclude:
    - lib/src/generated/**
```
:::

:::tip
When referencing module classes in your model files, you can use a nickname for the module instead of the full module name. See the [modules documentation](../modules) for more information.
:::


The model above creates a relation to the `AuthUser` table and ensures that each user can only have one `MyDomainData` object. The `onDelete=Cascade` ensures that when the `AuthUser` is deleted, the `MyDomainData` object is also deleted.

This makes it easy to query the additional information later based on the user's `authId`.

```dart
final authUserId = session.authenticated?.authUserId;
final additionalInfo = await MyDomainData.db.findFirstRow(
    session,
    where: (t) => t.authUserId.equals(authUserId!),
);
```
