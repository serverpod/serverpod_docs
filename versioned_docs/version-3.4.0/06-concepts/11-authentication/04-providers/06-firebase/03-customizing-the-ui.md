# Customizing the UI

When using the Firebase identity provider, you build your authentication UI using Firebase's own packages (`firebase_auth` or `firebase_ui_auth`). The `FirebaseAuthController` handles syncing the authenticated Firebase user with your Serverpod backend.

:::info
Unlike other Serverpod identity providers, Firebase does not provide built-in sign-in widgets. You use Firebase's official packages for the UI, then sync the result with Serverpod using `FirebaseAuthController`.
:::

## Using firebase_ui_auth SignInScreen

The `firebase_ui_auth` package provides a complete `SignInScreen` widget that handles the entire authentication flow. Here's a full example:

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:firebase_ui_auth/firebase_ui_auth.dart' as firebase_ui;
import 'package:flutter/material.dart';
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late final FirebaseAuthController controller;

  @override
  void initState() {
    super.initState();
    controller = FirebaseAuthController(
      client: client,
      onAuthenticated: () {
        // User successfully synced with Serverpod
        // NOTE: Do not navigate here - use client.auth.authInfoListenable instead
      },
      onError: (error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $error')),
        );
      },
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return firebase_ui.SignInScreen(
      providers: [
        firebase_ui.EmailAuthProvider(),
        // Add more providers as needed:
        // firebase_ui.PhoneAuthProvider(),
        // firebase_ui.GoogleProvider(clientId: '...'),
      ],
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
    );
  }
}
```

The `SignInScreen` automatically handles the UI for all configured providers. You only need to connect the Firebase authentication result to Serverpod using the `FirebaseAuthController`.

Refer to the [firebase_ui_auth documentation](https://pub.dev/packages/firebase_ui_auth) for configuration details and available providers.

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

- `FirebaseAuthState.idle` - Ready for user interaction.
- `FirebaseAuthState.loading` - Processing authentication with Serverpod.
- `FirebaseAuthState.error` - An error occurred.
- `FirebaseAuthState.authenticated` - Successfully authenticated with Serverpod.

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

1. Build your own sign-in UI with text fields and buttons.
2. Call Firebase authentication methods (e.g., `signInWithEmailAndPassword`).
3. On success, pass the `firebase_auth.User` to `controller.login()`.
4. Handle errors from both Firebase and the Serverpod sync.

Refer to the [firebase_auth documentation](https://pub.dev/packages/firebase_auth) for available authentication methods.

### Listening to Firebase auth state changes

For apps that need to react to Firebase auth state changes automatically, listen to `FirebaseAuth.instance.authStateChanges()` and call `controller.login()` when a user signs in.

:::note
When using the auth state listener pattern, check the Serverpod auth state before calling `login()` to prevent re-syncing an already authenticated user.
:::
