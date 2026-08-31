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

`AuthServices.instance.googleIdp` is available after you add the Google identity provider (see [setup](./setup#add-the-google-identity-provider)).

```dart
import 'package:serverpod_auth_idp_server/providers/google.dart';
import 'package:serverpod_auth_idp_server/core.dart';

final googleIdp = AuthServices.instance.googleIdp;
final admin = googleIdp.admin;
```

## Finding accounts

`findUserByGoogleUserId` is a static method. Pass the Google user ID (`userIdentifier`) when you have it and need the linked Serverpod auth user ID.

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

`accessToken` may be `null` when you only have the ID token. `linkGoogleAuthentication` returns the created `GoogleAccount`.
