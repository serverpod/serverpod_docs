# Working with users

The authentication module provides convenient ways to work with your authenticated users and their related profile data.

## Authenticated users

All authenticated users have an authentication identifier, that uniquely identifies them across the server. This can be retrieved from the `session` object as a `String` through the `userIdentifier` property or as a `UuidValue` from the `authUserId` extension provided by the authentication module.

```dart
var userIdString = session.authenticated?.userIdentifier;
// requires `import 'package:serverpod_auth_idp_server/core.dart';`
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

## User creation callbacks

You can react when an auth user is created and control their initial scopes and blocked status by using the `AuthUsersConfig` callbacks. Configure them when initializing auth services on the `pod` object.

:::warning
Both callbacks receive a `transaction` parameter that should be used on all operations performed inside the callback. Failing to pass the transaction to database operations might lead to entries not being found or changes not being rolled back together.
:::

### Reacting to the user created event

Use the `onAfterAuthUserCreated` callback to run logic after a new auth user has been created (for example, to create related domain data or send a welcome notification). The callback receives the current session, the newly created auth user, and the ongoing transaction.

```dart
pod.initializeAuthServices(
  ...
  authUsersConfig: AuthUsersConfig(
    onAfterAuthUserCreated: (session, authUser, {required transaction}) {
      // Do something with the new auth user (e.g. create related data)
    },
  ),
);
```

### Setting default scopes and blocked status

Use the `onBeforeAuthUserCreated` callback to set default scopes or blocked status for new auth users. The callback receives the session, the scopes and blocked value that would be used by default, and the transaction. Return a record with the `scopes` and `blocked` values you want to apply; you can add or remove scopes or force the user to be blocked.

```dart
pod.initializeAuthServices(
  ...
  authUsersConfig: AuthUsersConfig(
    onBeforeAuthUserCreated: (session, scopes, blocked, {required transaction}) {
      // Set default scopes (e.g. add Scope.admin) and optionally block the user
      return (scopes: {...scopes, Scope.admin}, blocked: blocked);
    },
  ),
);
```

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
  Future<UserProfileModel> myCustomProfileEdit(Session session, String bio) async {
    final userProfile = await session.authenticated?.userProfile(session);

    // Your custom logic here...

    return userProfile;
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
