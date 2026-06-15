# Customizations

This page covers additional configuration options for the Firebase identity provider beyond the basic setup.

## Loading credentials with FirebaseIdpConfig

The [setup guide](./setup) uses `FirebaseIdpConfigFromPasswords`, which loads the service account key from `passwords.yaml` for you. When you need to load credentials from a different source (a file path, a secrets manager, or just a project ID), use `FirebaseIdpConfig` directly and pass a `FirebaseServiceAccountCredentials` instance.

`FirebaseServiceAccountCredentials` provides four constructors. These are the only supported ways to construct it:

**From a JSON string** (use this when reading the JSON from a secrets manager or environment variable):

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJsonString(
    pod.getPassword('firebaseServiceAccountKey')!,
  ),
);
```

**From a JSON file** (useful for local development or when secrets are mounted as files):

```dart
import 'dart:io';

final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJsonFile(
    File('config/firebase_service_account_key.json'),
  ),
);
```

**From a JSON map** (useful when credentials are assembled programmatically, for example by pulling each field from `passwords.yaml` or a secrets manager):

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: FirebaseServiceAccountCredentials.fromJson({
    'type': 'service_account',
    'project_id': pod.getPassword('firebaseProjectId')!,
    'private_key_id': pod.getPassword('firebasePrivateKeyId')!,
    'private_key': pod.getPassword('firebasePrivateKey')!,
    'client_email': pod.getPassword('firebaseClientEmail')!,
    'client_id': pod.getPassword('firebaseClientId')!,
    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
    'token_uri': 'https://oauth2.googleapis.com/token',
  }),
);
```

:::warning
Do not inline the service account fields (especially `private_key`) directly in source code. Load every sensitive field from a secure source such as `pod.getPassword()` (backed by `passwords.yaml` or `SERVERPOD_PASSWORD_*` environment variables) or a secrets manager.
:::

**Project ID only** (only token verification, no admin operations like deleting Firebase accounts):

```dart
final firebaseIdpConfig = FirebaseIdpConfig(
  credentials: const FirebaseServiceAccountCredentials(
    projectId: 'your-project-id',
  ),
);
```

:::note
Only `projectId` is required to verify Firebase ID tokens. The full service account JSON is only needed if you also use the [admin operations](./admin-operations) on the server.
:::

## Custom account validation

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

### FirebaseAccountDetails properties

The `firebaseAccountDetailsValidation` callback receives a `FirebaseAccountDetails` record with the following properties:

- `userIdentifier` (`String`): Firebase UID.
- `email` (`String?`): Email address, or `null` for phone-only sign-in.
- `fullName` (`String?`): Display name from Firebase.
- `image` (`Uri?`): Profile image URL.
- `verifiedEmail` (`bool?`): Whether the email is verified.
- `phone` (`String?`): Phone number, only populated for phone authentication.

Which properties are populated depends on the Firebase sign-in method the user chose. For example, `phone` is only populated for phone authentication, and `email` may be `null` if the user signed in with phone only.

## Reacting to auth user creation

[`onBeforeAuthUserCreated`](https://pub.dev/documentation/serverpod_auth_idp_server/latest/core/AuthUsersConfig/onBeforeAuthUserCreated.html) and [`onAfterAuthUserCreated`](https://pub.dev/documentation/serverpod_auth_idp_server/latest/core/AuthUsersConfig/onAfterAuthUserCreated.html) are global callbacks on `AuthUsersConfig`. They fire for every identity provider, not just Firebase. See [Working with users](../../working-with-users#reacting-to-the-user-created-event) for full details.

The example below uses Firebase phone numbers as the trigger for assigning a `phone-verified` scope at sign-up, and persists the Firebase UID for later admin lookups:

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

:::warning
Both callbacks run inside the same database transaction as the account creation. Throwing an exception inside either callback aborts the sign-up. Wrap external side-effects (email sending, analytics) in `try`/`catch` so a third-party outage does not block new sign-ups.
:::

## FirebaseIdpConfig parameter reference

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `credentials` | `FirebaseServiceAccountCredentials` | Yes | Firebase service account credentials for verifying ID tokens. Can be loaded via `fromJsonString`, `fromJsonFile`, or `fromJson`. When using `FirebaseIdpConfigFromPasswords`, this is loaded automatically from the `firebaseServiceAccountKey` key in `passwords.yaml` or the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable. |
| `firebaseAccountDetailsValidation` | `FirebaseAccountDetailsValidation?` | No | Custom validation callback for Firebase account details before allowing sign-in. By default, validates that email is verified when present (phone-only auth is allowed). |
| `onAfterFirebaseAccountCreated` | `AfterFirebaseAccountCreatedFunction?` | No | Callback invoked after a new Firebase account has been created and linked to an auth user. Receives the session, the created `AuthUserModel`, the `FirebaseAccount`, and the active `Transaction`. Runs inside the same database transaction as account creation, so the `transaction` can be used to perform additional database operations atomically with sign-up. |
| `clockSkewTolerance` | `Duration` | No | Tolerance for clock skew when validating Firebase ID token timestamps. Defaults to the framework's default clock skew tolerance. |
