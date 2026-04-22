# Troubleshooting

This page helps you identify common Firebase authentication failures with Serverpod, explains why they occur, and shows how to resolve them. For issues with Firebase itself, see the [official Firebase Flutter documentation](https://firebase.google.com/docs/flutter/setup).

## Setup checklist

Go through this before investigating a specific error. Most problems come from a missed step.

* [ ] Create a **Firebase project** in the [Firebase Console](https://console.firebase.google.com/).
* [ ] Generate a **service account key** from Project settings > Service accounts.
* [ ] Paste the service account JSON into `firebaseServiceAccountKey` in `config/passwords.yaml`.
* [ ] Enable the **authentication methods** you want to use in Firebase Console > Authentication > Sign-in method.
* [ ] Run **`serverpod generate`**, then **`serverpod create-migration`**, then apply migrations using `--apply-migrations`.
* [ ] Install **`firebase_core`** and **`firebase_auth`** in your Flutter project.
* [ ] Run **`flutterfire configure`** to generate `firebase_options.dart`.
* [ ] Call **`Firebase.initializeApp()`** before creating the Serverpod client.
* [ ] Call **`client.auth.initializeFirebaseSignIn()`** after initializing the Serverpod client.
* [ ] Call **`controller.login(user)`** after Firebase authentication completes.

## Server crashes on first Firebase sign-in with "no such table"

**Problem:** The server builds and starts, but crashes when a user tries Firebase sign-in. The error cites a missing table (like `serverpod_auth_idp_firebase_account`).

**Cause:** `serverpod generate` has been run, but you didn't create or apply the accompanying database migration.

**Resolution:** Create and apply the migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

## Token verification fails with "invalid signature" or "token expired"

**Problem:** The server rejects Firebase ID tokens with a signature verification or token expiration error.

**Cause:** The service account key in `passwords.yaml` does not belong to the same Firebase project that the client is using, or the YAML indentation broke the JSON.

**Resolution:**

1. Verify the `project_id` in your `firebaseServiceAccountKey` matches the project in `firebase_options.dart`.
2. Check that the JSON in `passwords.yaml` is properly indented under the `|` block scalar. All lines must be indented consistently.
3. If the error is specifically about expiration, check that the server's system clock is accurate. Firebase ID tokens expire after one hour.

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

**Cause:** The Firebase ID token could not be verified by the server. Common reasons: the service account key is missing or invalid, the endpoint is not exposed, or the migration hasn't been applied.

**Resolution:**

1. Check the server logs for the specific error message.
2. Verify the `firebaseServiceAccountKey` is present in `passwords.yaml` and the JSON is valid.
3. Verify you have created the endpoint class extending `FirebaseIdpBaseEndpoint`.
4. Verify migrations have been applied.

## Email validation rejects phone-only users

**Problem:** Users who sign in with phone authentication are rejected with a `FirebaseUserInfoMissingDataException`.

**Cause:** A custom `firebaseAccountDetailsValidation` callback requires a verified email, but phone-only users don't have an email.

**Resolution:** Update your validation to allow phone-only authentication:

```dart
firebaseAccountDetailsValidation: (accountDetails) {
  if (accountDetails.email != null && accountDetails.verifiedEmail != true) {
    throw FirebaseUserInfoMissingDataException();
  }
},
```

This is the default validation behavior. If you overrode it to require email, you need to account for phone-only sign-in.

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

## Firebase UI auth actions not firing

**Problem:** The `AuthStateChangeAction<SignedIn>` or `AuthStateChangeAction<UserCreated>` actions on the `SignInScreen` never fire, so `controller.login()` is never called.

**Cause:** The action types don't match the authentication state changes from the providers you configured. For example, using `EmailAuthProvider` but only listening for `GoogleSignInAction`.

**Resolution:** Make sure you have actions for both `SignedIn` (returning users) and `UserCreated` (new users):

```dart
actions: [
  firebase_ui.AuthStateChangeAction<firebase_ui.SignedIn>((context, state) async {
    final user = firebase_auth.FirebaseAuth.instance.currentUser;
    if (user != null) {
      await controller.login(user);
    }
  }),
  firebase_ui.AuthStateChangeAction<firebase_ui.UserCreated>((context, state) async {
    final user = firebase_auth.FirebaseAuth.instance.currentUser;
    if (user != null) {
      await controller.login(user);
    }
  }),
],
```
