# Configuration

This page covers credential loading, custom validation, and account creation callbacks for the Firebase identity provider.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `FirebaseIdpConfig` in-code documentation.

The Firebase identity provider can be configured using one of two classes:

- **`FirebaseIdpConfigFromPasswords`**: Automatically loads the service account key from the `firebaseServiceAccountKey` key in `passwords.yaml` (or the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable). This is the class used in the [setup guide](./setup) and is recommended for most projects.
- **`FirebaseIdpConfig`**: Requires you to pass a `FirebaseServiceAccountCredentials` object directly. Use this when you need to load credentials from a custom source, such as a JSON file, a secrets manager, or a programmatically constructed map.

`FirebaseIdpConfigFromPasswords` is a convenience wrapper around `FirebaseIdpConfig` that handles credential loading for you.

Both classes accept the same optional callbacks shown in the sections below. The examples on this page use `FirebaseIdpConfigFromPasswords` unless the section specifically demonstrates manual credential loading.

### Load credentials using FirebaseIdpConfig

When using `FirebaseIdpConfig`, you must provide the credentials explicitly.

You can load the credentials in several ways:

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

### Custom account validation

You can customize the validation for Firebase account details before allowing sign-in. By default, the validation requires the email to be verified when present (phone-only authentication is allowed without an email).

To customize validation, provide your own `firebaseAccountDetailsValidation` function:

```dart
final firebaseIdpConfig = FirebaseIdpConfigFromPasswords(
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

```dart
firebaseAccountDetailsValidation: (accountDetails) {
  accountDetails.userIdentifier; // String -- Firebase UID
  accountDetails.email;          // String? -- null for phone-only auth
  accountDetails.fullName;       // String? -- display name from Firebase
  accountDetails.image;          // Uri? -- profile image URL
  accountDetails.verifiedEmail;  // bool? -- whether the email is verified
  accountDetails.phone;          // String? -- phone number (phone auth only)
},
```

:::info
The properties available depend on the Firebase authentication method used. For example, `phone` is only populated for phone authentication, and `email` may be null if the user signed in with phone only.
:::

### Reacting to auth user creation

The `onBeforeAuthUserCreated` and `onAfterAuthUserCreated` hooks are global callbacks configured on `AuthUsersConfig` in `initializeAuthServices`. They are not specific to Firebase -- they fire for every identity provider. See the [working with users](../../working-with-users#reacting-to-the-user-created-event) page for full details.

`onBeforeAuthUserCreated` receives the default scopes and blocked status for the new user and must return the final values. Use it to assign custom scopes at creation time:

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    FirebaseIdpConfigFromPasswords(),
  ],
  authUsersConfig: AuthUsersConfig(
    onBeforeAuthUserCreated: (
      session,
      scopes,
      blocked, {
      required transaction,
    }) {
      return (
        scopes: {...scopes, Scope('user')},
        blocked: blocked,
      );
    },
    onAfterAuthUserCreated: (
      session,
      authUser, {
      required transaction,
    }) async {
      // e.g. send a welcome email, log for analytics
    },
  ),
);
```

:::info
Both callbacks run inside the same database transaction as the account creation. Throwing an exception inside either callback will abort the process. If you perform external side-effects, safeguard them with a try/catch to prevent unwanted failures.
:::

## FirebaseIdpConfig parameter reference

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `credentials` | `FirebaseServiceAccountCredentials` | Yes | Firebase service account credentials for verifying ID tokens. Can be loaded via `fromJsonString`, `fromJsonFile`, or `fromJson`. When using `FirebaseIdpConfigFromPasswords`, this is loaded automatically from the `firebaseServiceAccountKey` key in `passwords.yaml` or the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable. |
| `firebaseAccountDetailsValidation` | `FirebaseAccountDetailsValidation?` | No | Custom validation callback for Firebase account details before allowing sign-in. By default, validates that email is verified when present (phone-only auth is allowed). |
