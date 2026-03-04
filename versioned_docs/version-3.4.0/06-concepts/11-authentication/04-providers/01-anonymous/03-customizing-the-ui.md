# Customizing the UI

When using the anonymous identity provider, you can customize the UI to your liking. You can use the `AnonymousSignInWidget` to display the anonymous sign-in button in your own layout, or you can use the `AnonymousAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `AnonymousSignInWidget` internally when the anonymous provider is enabled. You can supply a custom `AnonymousSignInWidget` to the `SignInWidget` to override the default (e.g. to pass `createAnonymousToken` or change size and shape).

```dart
SignInWidget(
  client: client,
  anonymousSignInWidget: AnonymousSignInWidget(
    client: client,
    createAnonymousToken: () async => await getAppCheckToken(),
    size: AnonymousButtonSize.medium,
    shape: AnonymousButtonShape.rectangular,
  ),
)
```
:::

## Using the `AnonymousSignInWidget`

The `AnonymousSignInWidget` displays a single "Continue without account" button that starts the anonymous sign-in flow when pressed. You can customize the widget's behavior and appearance using its constructor parameters:

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

AnonymousSignInWidget(
  client: client,
  createAnonymousToken: () async {
    // Optional: provide a token for app attestation (e.g. Firebase App Check)
    return await getAppCheckToken();
  },
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
  },
  size: AnonymousButtonSize.large, // large (default), medium, or small
  shape: AnonymousButtonShape.pill, // pill (default) or rectangular
)
```

Optionally, you can provide an externally managed `AnonymousAuthController` instance to the widget. When a controller is provided, `client`, `onAuthenticated`, and `onError` are ignored in favor of the controller's configuration.

```dart
AnonymousSignInWidget(
  controller: controller,
  size: AnonymousButtonSize.medium,
  shape: AnonymousButtonShape.rectangular,
)
```

### Customizing the button appearance

The widget renders a single **TextButton** with the label "Continue without account". The button uses Flutter's material design system, so it reacts to your app's `Theme`. You can wrap the widget in a `Theme` (or `ThemeData`) to change colors and typography:

```dart
Theme(
  data: Theme.of(context).copyWith(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: Colors.blue,
      ),
    ),
  ),
  child: AnonymousSignInWidget(client: client),
)
```

The widget constrains the button to a minimum width of 240 and maximum width of 400; you can place it in a `SizedBox`, `Expanded`, or `Flex` to control layout.

## Building a custom UI with the `AnonymousAuthController`

For full control over the UI, use the `AnonymousAuthController` class. It provides the anonymous sign-in logic without any built-in widget, so you can trigger login from your own button or flow and build a completely custom layout.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = AnonymousAuthController(
  client: client,
  createAnonymousToken: () async => await getAppCheckToken(),
  onAuthenticated: () {
    // Do something when the user is authenticated.
  },
  onError: (error) {
    // Handle errors
  },
);
```

### AnonymousAuthController state management

The controller notifies listeners when its state changes. Use these properties to drive your UI:

```dart
// Check if a request is in progress
final isLoading = controller.isLoading;

// Check current state (idle, loading, error, authenticated)
final state = controller.state;

// Listen to state changes
controller.addListener(() {
  setState(() {
    // Rebuild when controller state changes
  });
});
```

### AnonymousAuthController methods

The controller exposes a single action for anonymous sign-in:

```dart
// Start anonymous sign-in.
// Obtains token if `createAnonymousToken` is set, then calls the login endpoint.
await controller.login();
```

Call `controller.login()` from your custom button's `onPressed`, or from any other trigger (e.g. after a delay or when the user performs an action). The controller handles loading state, success, and errors and invokes `onAuthenticated` or `onError` as appropriate.

:::tip
Remember to dispose the controller when it is no longer needed (e.g. in your widget's `dispose`), unless the widget manages its own controller and disposes it for you.
:::
