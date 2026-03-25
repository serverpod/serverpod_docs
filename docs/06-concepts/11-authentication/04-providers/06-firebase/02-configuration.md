# Configuration

This page covers configuration options for the Firebase identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `FirebaseIdpConfig` in-code documentation.

### Loading Firebase Credentials

You can load Firebase service account credentials in several ways:

**From JSON string (recommended for production):**

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJsonString(
    pod.getPassword('firebaseServiceAccountKey')!,
  ),
);
```

**From JSON file:**

```dart
import 'dart:io';

final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJsonFile(
    File('config/firebase_service_account_key.json'),
  ),
);
```

**From JSON map:**

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJson({
    'type': 'service_account',
    'project_id': 'your-project-id',
    'private_key_id': '...',
    'private_key': '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
    'client_email': 'firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com',
    'client_id': '...',
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
  }),
);
```

### Custom Account Validation

You can customize the validation for Firebase account details before allowing sign-in. By default, the validation requires the email to be verified when present (phone-only authentication is allowed).

The default validation logic:

```dart
static void validateFirebaseAccountDetails(
  final FirebaseAccountDetails accountDetails,
) {
  // Firebase accounts may not have email if using phone auth
  // Only validate verifiedEmail if email is present
  if (accountDetails.email != null && accountDetails.verifiedEmail != true) {
    throw FirebaseUserInfoMissingDataException();
  }
}
```

To customize validation, provide your own `firebaseAccountDetailsValidation` function:

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJsonString(
    pod.getPassword('firebaseServiceAccountKey')!,
  ),
  firebaseAccountDetailsValidation: (accountDetails) {
    // Require verified email (even for phone auth)
    if (accountDetails.verifiedEmail != true) {
      throw Exception('Email must be verified');
    }

    // Restrict to specific email domain
    if (accountDetails.email != null &&
        !accountDetails.email!.endsWith('@example.com')) {
      throw Exception('Only @example.com emails allowed');
    }
  },
);
```

### FirebaseAccountDetails

The `firebaseAccountDetailsValidation` callback receives a `FirebaseAccountDetails` record with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `userIdentifier` | `String` | The Firebase user's unique identifier (UID) |
| `email` | `String?` | The user's email address (null for phone-only auth) |
| `fullName` | `String?` | The user's display name from Firebase |
| `image` | `Uri?` | URL to the user's profile image |
| `verifiedEmail` | `bool?` | Whether the email is verified |
| `phone` | `String?` | The user's phone number (for phone auth) |

Example of accessing these properties:

```dart
firebaseAccountDetailsValidation: (accountDetails) {
  print('Firebase UID: ${accountDetails.userIdentifier}');
  print('Email: ${accountDetails.email}');
  print('Email verified: ${accountDetails.verifiedEmail}');
  print('Display name: ${accountDetails.fullName}');
  print('Profile image: ${accountDetails.image}');
  print('Phone: ${accountDetails.phone}');

  // Custom validation logic
  if (accountDetails.email == null && accountDetails.phone == null) {
    throw Exception('Either email or phone is required');
  }
},
```

:::info
The properties available depend on the Firebase authentication method used. For example, `phone` is only populated for phone authentication, and `email` may be null if the user signed in with phone only.
:::

### Reacting to account creation

You can use the `onAfterFirebaseAccountCreated` callback to run logic after a new Firebase account has been created and linked to an auth user. This callback is only invoked for new accounts, not for returning users.

This is particularly useful for performing side effects like analytics, sending a welcome email, or storing additional data. The `onBeforeAuthUserCreated` and `onAfterAuthUserCreated` callbacks in the core auth module do not have access to provider-specific data, so this callback fills that gap.

```dart
final firebaseIdpConfig = FirebaseIdpConfigFromPasswords(
  onAfterFirebaseAccountCreated: (
    session,
    authUser,
    firebaseAccount, {
    required transaction,
  }) async {
    // e.g. store additional data, send a welcome email, or log for analytics
  },
);
```

:::info
This callback runs inside the same database transaction as the account creation.
:::

:::caution
If you need to assign Serverpod scopes based on provider account data, note that updating the database alone (via `AuthServices.instance.authUsers.update()`) is **not enough** for the current login session. The token issuance uses the in-memory `authUser.scopes`, which is already set before this callback runs. You would need to update `authUser.scopes` as well for the scopes to be reflected in the issued tokens. For assigning scopes at creation time, consider using `onBeforeAuthUserCreated` to set scopes based on data collected earlier in the flow.
:::
