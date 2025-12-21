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
