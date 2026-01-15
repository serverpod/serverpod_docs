# Customizing the UI

When using the Firebase identity provider, you build your authentication UI using Firebase's own packages (`firebase_auth` or `firebase_ui_auth`). The `FirebaseAuthController` handles syncing the authenticated Firebase user with your Serverpod backend.

:::info
Unlike other Serverpod identity providers, Firebase does not provide built-in sign-in widgets. You use Firebase's official packages for the UI, then sync the result with Serverpod using `FirebaseAuthController`.
:::

## Using the FirebaseAuthController

The `FirebaseAuthController` manages the synchronization between Firebase authentication state and Serverpod sessions.

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';

final controller = FirebaseAuthController(
  client: client,
  onAuthenticated: () {
    // User successfully synced with Serverpod
    // NOTE: Do not navigate here - use client.auth.authInfoListenable instead
  },
  onError: (error) {
    // Handle errors
  },
);
```

### FirebaseAuthController State Management

Your widget should render the appropriate UI based on the controller's state:

```dart
// Check current state
final state = controller.state; // FirebaseAuthState enum

// Check if loading
final isLoading = controller.isLoading;

// Check if authenticated
final isAuthenticated = controller.isAuthenticated;

// Get error message
final errorMessage = controller.errorMessage;

// Get error object
final error = controller.error;

// Listen to state changes
controller.addListener(() {
  setState(() {
    // Rebuild UI when controller state changes
  });
});
```

### FirebaseAuthController States

- `FirebaseAuthState.idle` - Ready for user interaction
- `FirebaseAuthState.loading` - Processing authentication with Serverpod
- `FirebaseAuthState.error` - An error occurred
- `FirebaseAuthState.authenticated` - Successfully authenticated with Serverpod

### The login method

The `login` method accepts a `firebase_auth.User` object and syncs it with Serverpod:

```dart
// Get the current Firebase user after sign-in
final firebaseUser = firebase_auth.FirebaseAuth.instance.currentUser;

if (firebaseUser != null) {
  await controller.login(firebaseUser);
}
```

## Integration patterns

### Using firebase_auth directly

For full control over the authentication UI, use the `firebase_auth` package directly. The basic flow is:

1. Build your own sign-in UI with text fields and buttons
2. Call Firebase authentication methods (e.g., `signInWithEmailAndPassword`)
3. On success, pass the `firebase_auth.User` to `controller.login()`
4. Handle errors from both Firebase and the Serverpod sync

Refer to the [firebase_auth documentation](https://pub.dev/packages/firebase_auth) for available authentication methods.

### Using firebase_ui_auth

For a pre-built UI experience, use the `firebase_ui_auth` package. This provides ready-made screens for various authentication methods.

1. Add the package: `flutter pub add firebase_ui_auth`
2. Use `firebase_ui.SignInScreen` with your desired providers
3. Add `AuthStateChangeAction` handlers for `SignedIn` and `UserCreated` events
4. In each handler, call `controller.login()` with the Firebase user

```dart
actions: [
  firebase_ui.AuthStateChangeAction<firebase_ui.SignedIn>((context, state) async {
    final user = firebase_auth.FirebaseAuth.instance.currentUser;
    if (user != null) {
      await controller.login(user);
    }
  }),
],
```

Refer to the [firebase_ui_auth documentation](https://pub.dev/packages/firebase_ui_auth) for configuration details and available providers.

### Listening to Firebase auth state changes

For apps that need to react to Firebase auth state changes automatically, listen to `FirebaseAuth.instance.authStateChanges()` and call `controller.login()` when a user signs in.

:::note
When using the auth state listener pattern, check the Serverpod auth state before calling `login()` to prevent re-syncing an already authenticated user.
:::
