# Customizing the UI

When using the Firebase identity provider, you build your authentication UI using Firebase's own packages (`firebase_auth` or `firebase_ui_auth`). The `FirebaseAuthController` handles syncing the authenticated Firebase user with your Serverpod backend. This page covers two approaches: using the pre-built `SignInScreen` from `firebase_ui_auth`, or building a fully custom UI with `FirebaseAuthController`.

## Using firebase_ui_auth SignInScreen

The `firebase_ui_auth` package provides a complete `SignInScreen` widget that handles the entire authentication flow. You need to connect the Firebase authentication result to Serverpod using the `FirebaseAuthController`.

The two `AuthStateChangeAction` handlers below cover both returning users (`SignedIn`) and newly created accounts (`UserCreated`). Both call `controller.login(user)` to sync the Firebase user with Serverpod.

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

The `SignInScreen` automatically handles the UI for all configured providers. Refer to the [firebase_ui_auth documentation](https://pub.dev/packages/firebase_ui_auth) for configuration details and available providers.

:::note
The `client` variable is the global Serverpod `Client` instance created in `main.dart`. See the [setup guide](./setup#initialize-firebase-and-serverpod) for how it is initialized.
:::

:::note
Do not navigate to a home screen inside `onAuthenticated`. This callback fires every time a sync succeeds, including on app restart. Instead, use `client.auth.authInfoListenable` to listen for auth state changes and navigate accordingly.
:::

## Using the FirebaseAuthController

The `FirebaseAuthController` manages the synchronization between Firebase authentication state and Serverpod sessions. Use it when you want full control over the authentication UI.

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';

final controller = FirebaseAuthController(
  client: client,
  onAuthenticated: () {
    // User successfully synced with Serverpod
  },
  onError: (error) {
    // Handle errors
  },
);
```

### The login method

After a user signs in through Firebase (using any method), pass the `firebase_auth.User` to the controller to sync with Serverpod:

```dart
final firebaseUser = firebase_auth.FirebaseAuth.instance.currentUser;

if (firebaseUser != null) {
  await controller.login(firebaseUser);
}
```

### State management

The controller exposes state properties you can use to build your UI. Listen for changes using `addListener`:

```dart
controller.addListener(() {
  setState(() {});
});
```

The available states are:

- `FirebaseAuthState.idle` -- Ready for user interaction.
- `FirebaseAuthState.loading` -- Processing authentication with Serverpod.
- `FirebaseAuthState.error` -- An error occurred. Check `controller.errorMessage` for details.
- `FirebaseAuthState.authenticated` -- Successfully authenticated with Serverpod.

Convenience properties:

- `controller.isLoading` -- Whether the controller is processing a request.
- `controller.isAuthenticated` -- Whether the user is authenticated.
- `controller.errorMessage` -- The error message string, if any.
- `controller.error` -- The raw error object, for advanced error handling.

## Using firebase_auth directly

For full control over the authentication UI, use the `firebase_auth` package directly. Build your own sign-in UI, call Firebase authentication methods, then pass the result to `controller.login()`:

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

final credential = await firebase_auth.FirebaseAuth.instance
    .signInWithEmailAndPassword(
  email: emailController.text,
  password: passwordController.text,
);

final user = credential.user;
if (user != null) {
  await controller.login(user);
}
```

Refer to the [firebase_auth documentation](https://pub.dev/packages/firebase_auth) for all available authentication methods.

### Listening to Firebase auth state changes

For apps that need to react to Firebase auth state changes automatically, listen to `FirebaseAuth.instance.authStateChanges()` and call `controller.login()` when a user signs in.

:::note
When using the auth state listener pattern, check the controller state before calling `login()` to prevent re-syncing an already authenticated user:

```dart
if (!controller.isAuthenticated) {
  await controller.login(user);
}
```

:::
