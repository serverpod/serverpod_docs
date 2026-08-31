---
sidebar_label: Admin operations
description: Use AppleIdpAdmin from server-side code to refresh Sign in with Apple tokens and to handle accounts that Apple has already revoked.
---

# Apple admin operations

The Apple identity provider exposes admin operations through `AppleIdpAdmin`. Use them from server-side code to refresh Sign in with Apple tokens and to react when Apple has revoked an account.

:::warning
Call these methods only from secure server-side code. Do not expose them through client endpoints without authorization checks.
:::

## Accessing the AppleIdpAdmin

`AuthServices.instance.appleIdp` is available after you add the Apple identity provider (see [setup](./setup#add-the-apple-identity-provider)).

```dart
import 'package:serverpod_auth_idp_server/providers/apple.dart';
import 'package:serverpod_auth_idp_server/core.dart';

final appleIdp = AuthServices.instance.appleIdp;
final admin = appleIdp.admin;
```

## Checking account status

`checkAccountStatus` walks Apple accounts whose tokens have not been refreshed in the last 24 hours and refreshes them. Call it from a scheduled task (for example a [recurring task](../../../scheduling/recurring-tasks)).

When Apple has revoked the authorization, the `onExpiredUserAuthentication` callback receives that user's auth user ID. Revoke every session created through Sign in with Apple for that user.

```dart
await admin.checkAccountStatus(
  session,
  onExpiredUserAuthentication: (authUserId) {
    // Revoke sessions for this auth user.
  },
);
```

Accounts are checked at most once every 24 hours. The method loads accounts in batches of 100 by default (`databaseBatchSize`).
