# Troubleshooting

This page helps you identify common Firebase authentication failures with Serverpod, explains why they occur, and shows how to resolve them. For issues with Firebase itself, see the [Firebase Auth documentation](https://firebase.google.com/docs/auth).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

#### Firebase Console

- [ ] Create a **Firebase project** in the [Firebase Console](https://console.firebase.google.com/).
- [ ] Generate a **service account key** from Project settings > Service accounts.
- [ ] Enable the **authentication methods** you want to use in Firebase Console > Authentication > Sign-in method.

#### Server

- [ ] Paste the service account JSON into `firebaseServiceAccountKey` in `config/passwords.yaml`. See [Store the service account key](./setup#store-the-service-account-key).
- [ ] Add `FirebaseIdpConfigFromPasswords()` to `identityProviderBuilders` in `server.dart`.
- [ ] Create a `FirebaseIdpEndpoint` file in `lib/src/auth/` extending `FirebaseIdpBaseEndpoint`.
- [ ] Run **`serverpod generate`**, then **`serverpod create-migration`**, then apply migrations with `dart run bin/main.dart --apply-migrations`.

#### Client

- [ ] Install **`firebase_core`**, **`firebase_auth`**, and **`serverpod_auth_idp_flutter_firebase`** in your Flutter project.
- [ ] Run **`flutterfire configure`** to generate `firebase_options.dart`.
- [ ] Call **`Firebase.initializeApp()`** before creating the Serverpod client.
- [ ] Call **`client.auth.initializeFirebaseSignIn()`** after `client.auth.initialize()` in your Flutter app's `main.dart`.
- [ ] Call **`controller.login(user)`** after Firebase authentication completes.

## Server crashes on first Firebase sign-in with "no such table"

**Problem:** The server builds and starts, but crashes when a user tries Firebase sign-in. The error cites a missing table (like `serverpod_auth_idp_firebase_account`).

**Cause:** `serverpod generate` has been run, but you didn't create or apply the accompanying database migration.

**Resolution:** Create and apply the migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

## Token verification fails with "invalid signature"

**Problem:** The server rejects Firebase ID tokens with a signature verification error.

**Cause:** The service account key in `passwords.yaml` does not belong to the same Firebase project that the client is using, or the YAML indentation broke the JSON.

**Resolution:**

1. Verify the `project_id` in your `firebaseServiceAccountKey` matches the project in `firebase_options.dart`.
2. Check that the JSON in `passwords.yaml` is properly indented under the `|` block scalar. All lines must be indented consistently.

## Token verification fails with "token expired"

**Problem:** The server rejects Firebase ID tokens with a token expiration error.

**Cause:** Firebase ID tokens expire after one hour. If the server's system clock is significantly off, valid tokens may appear expired.

**Resolution:** Check that the server's system clock is accurate. If the client token is genuinely expired (e.g., the user's app was backgrounded for a long time), the client should re-authenticate with Firebase to obtain a fresh ID token before calling `controller.login()`.

## Server fails to parse firebaseServiceAccountKey from passwords.yaml

**Problem:** The server crashes on startup with a JSON parsing error related to `firebaseServiceAccountKey`.

**Cause:** The YAML block scalar indentation is incorrect. The `firebaseServiceAccountKey` key uses `|` (literal block scalar), which requires every line of the JSON to be indented at the same level relative to the key.

**Resolution:** Make sure the JSON block is indented consistently under the `|`:

```yaml
development:
  firebaseServiceAccountKey: |
    {
      "type": "service_account",
      "project_id": "...",
      "private_key": "..."
    }
```

Every line of the JSON must be indented by at least one level more than `firebaseServiceAccountKey:`. Mixing tabs and spaces can also cause issues.

## FirebaseAuth.instance.currentUser is null after sign-in

**Problem:** After the Firebase sign-in flow completes, `FirebaseAuth.instance.currentUser` returns null, so `controller.login(user)` never gets called.

**Cause:** `Firebase.initializeApp()` was not called before attempting authentication, or was called with the wrong options.

**Resolution:** Make sure `Firebase.initializeApp()` is called in your `main()` function before any Firebase operations:

```dart
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

If you haven't run `flutterfire configure`, do so to generate the `firebase_options.dart` file.

## Sign-in succeeds in Firebase but fails to sync with Serverpod

**Problem:** The user authenticates with Firebase (the Firebase UI shows success), but the Serverpod session is never created. The `onError` callback on `FirebaseAuthController` fires.

**Cause:** The Firebase ID token could not be verified by the server. The most likely causes, in order:

1. **Missing service account key:** The `firebaseServiceAccountKey` is not present in `passwords.yaml`, or the JSON is invalid. Check the server logs for the specific error.
2. **Missing endpoint:** You did not create the endpoint class extending `FirebaseIdpBaseEndpoint`. Without it, the client has no endpoint to call.
3. **Missing migration:** The provider's database tables don't exist yet. Apply migrations with `dart run bin/main.dart --apply-migrations`.
4. **Project mismatch:** The service account key belongs to a different Firebase project than the one configured in your Flutter app.

## Email validation rejects phone-only users

**Problem:** Users who sign in with phone authentication are rejected with a `FirebaseUserInfoMissingDataException`.

**Cause:** A custom `firebaseAccountDetailsValidation` callback requires a verified email, but phone-only users don't have an email. The default validation allows phone-only authentication. If you overrode the default with a stricter check, you need to account for phone-only sign-in.

**Resolution:** Update your validation to allow phone-only authentication by checking for the presence of an email before requiring verification:

```dart
firebaseAccountDetailsValidation: (accountDetails) {
  if (accountDetails.email != null && accountDetails.verifiedEmail != true) {
    throw FirebaseUserInfoMissingDataException();
  }
},
```

## User signed out of Serverpod but still signed in to Firebase

**Problem:** After calling sign-out on Serverpod, the user's Firebase session remains active. The next time the app opens, Firebase still has an authenticated user.

**Cause:** `initializeFirebaseSignIn()` was not called during app initialization. This method sets up the automatic sign-out sync between Serverpod and Firebase.

**Resolution:** Make sure you call `initializeFirebaseSignIn()` after initializing the Serverpod client:

```dart
client.auth.initialize();
client.auth.initializeFirebaseSignIn();
```

## FlutterFire configure fails or generates wrong config

**Problem:** `flutterfire configure` fails, or the generated `firebase_options.dart` has wrong project details.

**Cause:** The Firebase CLI is not installed, not logged in, or is pointing to the wrong project.

**Resolution:**

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. Install FlutterFire CLI: `dart pub global activate flutterfire_cli`
4. Run `flutterfire configure` and select the correct project when prompted.

See the [FlutterFire CLI documentation](https://firebase.flutter.dev/docs/cli/) for more details.

## Firebase UI auth actions not firing

**Problem:** The `AuthStateChangeAction<SignedIn>` or `AuthStateChangeAction<UserCreated>` actions on the `SignInScreen` never fire, so `controller.login()` is never called.

**Cause:** The action types don't match the authentication state changes from the providers you configured. For example, using `EmailAuthProvider` but only listening for one of the two states.

**Resolution:** Make sure you have actions for both `SignedIn` (returning users) and `UserCreated` (new users). See the [customizing the UI page](./customizing-the-ui#using-firebase_ui_auth-signinscreen) for the complete code example.

## Platform-specific Firebase SDK configuration issues

**Problem:** Firebase operations fail on a specific platform (iOS, Android, or Web) with errors about missing configuration.

**Cause:** The `flutterfire configure` command may not have configured all platforms, or platform-specific files were not placed correctly.

**Resolution:**

1. Re-run `flutterfire configure` and ensure you select all platforms you want to support.
2. For **iOS**: Verify that `GoogleService-Info.plist` is included in the Xcode project's Runner target.
3. For **Android**: Verify that `google-services.json` is in `android/app/`.
4. For **Web**: Verify that the Firebase config is loaded in `web/index.html` or via `firebase_options.dart`.
