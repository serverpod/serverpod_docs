---
sidebar_label: Admin operations
description: Use AppleIdpAdmin from server-side code to check Sign in with Apple accounts and to handle accounts that Apple has already revoked.
---

# Apple admin operations

The Apple identity provider exposes admin operations through `AppleIdpAdmin`. Use them from server-side code to check whether Sign in with Apple accounts are still in good standing and to react when Apple has revoked an account.

:::warning
Call these methods only from secure server-side code. Do not expose them through client endpoints without authorization checks.
:::

## Accessing the AppleIdpAdmin

The admin operations are available through `AuthServices.instance.appleIdp` after you add the Apple identity provider (see [setup](./setup#add-the-apple-identity-provider)).

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';
import 'package:serverpod_auth_idp_server/core.dart';

final appleIdp = AuthServices.instance.appleIdp;
final admin = appleIdp.admin;
```

## Checking account status

The `checkAccountStatus` method walks Apple accounts that have not been checked in the last 24 hours and validates their stored refresh tokens with Apple. Call it from a scheduled task (for example a [recurring task](../../../scheduling/recurring-tasks)).

When Apple has revoked the authorization, the `onExpiredUserAuthentication` callback receives that user's auth user ID. Revoke every session created through Sign in with Apple for that user.

```dart
await admin.checkAccountStatus(
  session,
  onExpiredUserAuthentication: (authUserId) {
    // Revoke sessions for this auth user.
  },
);
```

The method loads accounts in batches of 100 by default (`databaseBatchSize`).

## Related

- [Setup](./setup): configure Sign in with Apple on the server and in your app.
- [Customizations](./customizations): configuration options and sign-in UI customization.
- [Troubleshooting](./troubleshooting): covers the revoked-notification route, the push counterpart of the polling this page documents.
- [Working with users](../../working-with-users): manage auth users and react to account events.
