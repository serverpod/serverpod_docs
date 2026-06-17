---
sidebar_label: Customizing the UI
description: Firebase authentication UI is built on firebase_auth and synced with Serverpod through the FirebaseAuthController.
---

# Customize the Firebase authentication UI

When using the Firebase identity provider, you build your authentication UI on top of [`firebase_auth`](https://pub.dev/packages/firebase_auth), optionally with [`firebase_ui_auth`](https://pub.dev/packages/firebase_ui_auth) for the pre-built sign-in screens. The [`FirebaseAuthController`](https://pub.dev/documentation/serverpod_auth_idp_flutter_firebase/latest/serverpod_auth_idp_flutter_firebase/FirebaseAuthController-class.html) handles syncing the authenticated Firebase user with your Serverpod backend. This page breaks down the gate widget shown in the [setup guide](./setup#present-the-authentication-ui) and then covers building a fully custom UI with `firebase_auth` directly.

## Anatomy of the gate widget

The [setup guide](./setup#present-the-authentication-ui) shows a `SignInScreen` widget that wraps your app and only renders the `child` once the user is authenticated. Three pieces drive that flow:

### FirebaseAuthController

The controller manages the sync between Firebase authentication state and your Serverpod session. The `client` argument is the global Serverpod `Client` instance created in `main.dart` (see [Initialize Firebase and Serverpod](./setup#3-initialize-firebase-and-serverpod)).

```dart
controller = FirebaseAuthController(
  client: client,
  onAuthenticated: () => context.showSnackBar(
    message: 'User authenticated.',
    backgroundColor: Colors.green,
  ),
  onError: (error) => context.showSnackBar(
    message: 'Authentication failed: $error',
    backgroundColor: Colors.red,
  ),
);
```

:::warning
Do not navigate to a home screen inside `onAuthenticated`. This callback fires every time a sync succeeds, including on app restart. Instead, gate the UI on `controller.isAuthenticated` (as the setup example does), or listen to `client.auth.authInfoListenable`.
:::

### Action handlers

`firebase_ui_auth` emits state changes through [`AuthStateChangeAction`](https://pub.dev/documentation/firebase_ui_auth/latest/firebase_ui_auth/AuthStateChangeAction-class.html). Two handlers cover the cases that need a Serverpod sync:

- [`SignedIn`](https://pub.dev/documentation/firebase_ui_auth/latest/firebase_ui_auth/SignedIn-class.html) -- a returning user signed in.
- [`UserCreated`](https://pub.dev/documentation/firebase_ui_auth/latest/firebase_ui_auth/UserCreated-class.html) -- a brand-new account was just created.

Both call [`controller.login(user)`](https://pub.dev/documentation/serverpod_auth_idp_flutter_firebase/latest/serverpod_auth_idp_flutter_firebase/FirebaseAuthController/login.html) so the Firebase user is registered with Serverpod:

```dart
Future<void> _handleAuthStateChange() async {
  final user = firebase_auth.FirebaseAuth.instance.currentUser;
  if (user != null) await controller.login(user);
}
```

### controller.isAuthenticated

The `build` method checks `controller.isAuthenticated` to decide whether to show the sign-in UI or the wrapped `child`:

```dart
if (controller.isAuthenticated) return widget.child;
```

Add more providers to the `firebase_ui.SignInScreen` as needed (see the [firebase_ui_auth documentation](https://pub.dev/packages/firebase_ui_auth)):

```dart
providers: [
  firebase_ui.EmailAuthProvider(),
  // firebase_ui.PhoneAuthProvider(),
  // firebase_ui.GoogleProvider(clientId: '...'),
],
```

## Controller reference

### The login method

After a user signs in through Firebase (using any method), pass the `firebase_auth.User` to the controller to sync with Serverpod:

```dart
final firebaseUser = firebase_auth.FirebaseAuth.instance.currentUser;

if (firebaseUser != null) {
  await controller.login(firebaseUser);
}
```

### State management

The controller is a `ChangeNotifier`, so it notifies your widget whenever its state changes. Register a listener inside `initState` and call `setState` to trigger a rebuild:

```dart
@override
void initState() {
  super.initState();
  controller = FirebaseAuthController(client: client);

  controller.addListener(() {
    if (mounted) setState(() {});
  });
}
```

The controller exposes a few properties for your `build` method:

- `controller.isLoading` -- Whether the controller is processing a request.
- `controller.isAuthenticated` -- Whether the user is authenticated.
- `controller.errorMessage` -- The error message string, if any.
- `controller.error` -- The raw error object, for advanced error handling.

Use them in your `build` method to render the right UI for the current state:

```dart
@override
Widget build(BuildContext context) {
  if (controller.isLoading) {
    return const Center(child: CircularProgressIndicator());
  }

  if (controller.errorMessage != null) {
    return Center(child: Text('Error: ${controller.errorMessage}'));
  }

  if (controller.isAuthenticated) {
    return widget.child;
  }

  // Otherwise, show the sign-in UI.
  return const SignInForm();
}
```

If you need finer-grained control, switch on `controller.state` directly:

```dart
@override
Widget build(BuildContext context) {
  return switch (controller.state) {
    FirebaseAuthState.idle => const SignInForm(),
    FirebaseAuthState.loading => const Center(child: CircularProgressIndicator()),
    FirebaseAuthState.error => Center(child: Text('Error: ${controller.errorMessage}')),
    FirebaseAuthState.authenticated => widget.child,
  };
}
```

## Using firebase_auth directly

For full control over the authentication UI, use the [`firebase_auth`](https://pub.dev/packages/firebase_auth) package directly. Build your own sign-in UI, call [`FirebaseAuth`](https://pub.dev/documentation/firebase_auth/latest/firebase_auth/FirebaseAuth-class.html) methods, then pass the result to `controller.login()`:

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

For apps that need to react to Firebase auth state changes automatically (e.g., the user signs in on another device, or the session is restored after an app restart), subscribe to [`FirebaseAuth.instance.authStateChanges()`](https://pub.dev/documentation/firebase_auth/latest/firebase_auth/FirebaseAuth/authStateChanges.html). The stream emits the current `User` whenever Firebase's auth state changes; pass that user to `controller.login()` to sync with Serverpod.

```dart
firebase_auth.FirebaseAuth.instance.authStateChanges().listen((user) async {
  if (user == null) return;

  // Guard against re-syncing an already authenticated user.
  if (!controller.isAuthenticated) {
    await controller.login(user);
  }
});
```

:::warning
Always check `controller.isAuthenticated` before calling `login()` inside the listener. The stream fires on every app start with the cached Firebase user, and `login()` would otherwise re-sync on every launch.
:::
