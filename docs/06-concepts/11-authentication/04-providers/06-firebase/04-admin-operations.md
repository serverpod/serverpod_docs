# Admin Operations

The Firebase identity provider provides admin operations through `FirebaseIdpAdmin` for managing Firebase-authenticated accounts. These operations are useful for administrative tasks and account management.

## Accessing the FirebaseIdpAdmin

You can access the admin operations through the `AuthServices.instance.firebaseIdp` property:

```dart
import 'package:serverpod_auth_idp_server/providers/firebase.dart';
import 'package:serverpod_auth_idp_server/core.dart';

// Get the FirebaseIdp instance
final firebaseIdp = AuthServices.instance.firebaseIdp;

// Access admin operations
final admin = firebaseIdp.admin;
```

## Account Management

The admin API provides methods for managing Firebase-authenticated accounts.

### Finding Accounts

```dart
// Find an account by email
final account = await admin.findAccountByEmail(
  session,
  email: 'user@example.com',
);

// Find an account by Serverpod auth user ID
final account = await admin.findAccountByAuthUserId(
  session,
  authUserId: authUserId,
);

// Find the Serverpod user ID by Firebase UID
final userId = await admin.findUserByFirebaseUserId(
  session,
  userIdentifier: 'firebase-uid',
);
```

### Linking Firebase Authentication

Link an existing Serverpod user to a Firebase account:

```dart
// Link a Firebase account to an existing user
final firebaseAccount = await admin.linkFirebaseAuthentication(
  session,
  authUserId: authUserId,
  accountDetails: accountDetails,
);
```

The `accountDetails` parameter is a `FirebaseAccountDetails` record containing the Firebase user information. You can obtain this from a Firebase ID token using the `fetchAccountDetails` method:

```dart
// Fetch account details from a Firebase ID token
final accountDetails = await admin.fetchAccountDetails(
  session,
  idToken: firebaseIdToken,
);

// Then link the account
await admin.linkFirebaseAuthentication(
  session,
  authUserId: existingUserId,
  accountDetails: accountDetails,
);
```

### Deleting Accounts

```dart
// Delete a Firebase account by Firebase UID
final deletedAccount = await admin.deleteFirebaseAccount(
  session,
  userIdentifier: 'firebase-uid',
);

// Delete all Firebase accounts for a Serverpod user
final deletedAccount = await admin.deleteFirebaseAccountByAuthUserId(
  session,
  authUserId: authUserId,
);
```

:::info
Deleting a Firebase account only removes the link between the Firebase authentication and the Serverpod user. It does not delete the user from your Serverpod database or from Firebase itself.
:::

## FirebaseIdpUtils

The `FirebaseIdpUtils` class provides utility functions for working with Firebase authentication:

```dart
final utils = firebaseIdp.utils;

// Authenticate a user with a Firebase ID token
// This creates the account if it doesn't exist
final authSuccess = await utils.authenticate(
  session,
  idToken: firebaseIdToken,
  transaction: transaction, // optional
);
```

:::warning
Admin operations should only be called from secure server-side code. Do not expose these methods directly through client endpoints without proper authorization checks.
:::
