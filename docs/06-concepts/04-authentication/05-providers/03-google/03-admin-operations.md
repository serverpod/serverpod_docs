---
sidebar_label: Admin operations
description: Use GoogleIdpAdmin from server-side code to look up Google-backed accounts and to link a Google identity to an existing Serverpod user.
---

# Google admin operations

The Google identity provider exposes admin operations through `GoogleIdpAdmin`. Use them from server-side code to look up a Serverpod user by Google user ID and to attach a Google identity to an existing user.

:::warning
Call these methods only from secure server-side code. Do not expose them through client endpoints without authorization checks.
:::

## Accessing the GoogleIdpAdmin

The admin operations are available through `AuthServices.instance.googleIdp` after you add the Google identity provider (see [setup](./setup#add-the-google-identity-provider)).

```dart
import 'package:serverpod_auth_idp_server/providers/google.dart';
import 'package:serverpod_auth_idp_server/core.dart';

final googleIdp = AuthServices.instance.googleIdp;
final admin = googleIdp.admin;
```

## Finding accounts

The `findUserByGoogleUserId` method is static. Pass the Google user ID (`userIdentifier`) when you have it and need the linked Serverpod auth user ID.

```dart
final userId = await GoogleIdpAdmin.findUserByGoogleUserId(
  session,
  userIdentifier: 'google-user-id',
);
```

The method returns `null` if no Google account row exists for that ID.

## Linking Google authentication

Link an existing Serverpod user to a Google account. This is useful when migrating users from another provider or when an admin tool attaches Google sign-in to a user that already exists.

First load the account details from a Google ID token (and an access token when you have one), then link them:

```dart
final accountDetails = await admin.fetchAccountDetails(
  session,
  idToken: googleIdToken,
  accessToken: googleAccessToken,
);

final googleAccount = await admin.linkGoogleAuthentication(
  session,
  authUserId: existingUserId,
  accountDetails: accountDetails,
);
```

The `accessToken` parameter may be `null` when you only have the ID token. The `linkGoogleAuthentication` method returns the created `GoogleAccount`.

## Related

- [Setup](./setup): configure the Google Auth Platform and register the identity provider.
- [Customizations](./customizations): configuration options and sign-in UI customization.
- [Troubleshooting](./troubleshooting): fix common Google sign-in errors.
- [Working with users](../../working-with-users): the server-side user APIs these operations complement.
