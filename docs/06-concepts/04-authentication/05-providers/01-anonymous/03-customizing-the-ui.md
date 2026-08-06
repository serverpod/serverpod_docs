---
sidebar_label: Customizing the UI
description: Anonymous sign-in UI can be customized with the AnonymousSignInWidget and AnonymousAuthController to match the rest of your app's design.
---

# Customize the anonymous sign-in UI

When using the anonymous identity provider, you can customize the UI to your liking. You can use the `AnonymousSignInWidget` to display the anonymous sign-in button in your own layout, or you can use the `AnonymousAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `AnonymousSignInWidget` internally when the anonymous provider is enabled. You can supply a custom `AnonymousSignInWidget` to the `SignInWidget` to override the default (e.g. to pass `createAnonymousToken` or change size and shape).

```dart
SignInWidget(
  client: client,
  anonymousSignInWidget: AnonymousSignInWidget(
    client: client,
    createAnonymousToken: () async => await getAppCheckToken(),
    size: SignInButtonSize.medium,
    shape: SignInButtonShape.rectangular,
    // A custom widget replaces the built-in handling, so pass your own callbacks.
    onAuthenticated: () { /* ... */ },
    onError: (error) { /* ... */ },
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
  // Button customization. The values shown are the defaults.
  size: SignInButtonSize.large, // or medium, small
  shape: SignInButtonShape.pill, // or rounded, rectangular
)
```

Optionally, you can provide an externally managed `AnonymousAuthController` instance to the widget. A controller and a `client` are mutually exclusive, and `onAuthenticated` and `onError` belong on the controller in that case. Passing them alongside a controller trips an assertion, so a debug build throws.

```dart
AnonymousSignInWidget(
  controller: controller,
  size: SignInButtonSize.medium,
  shape: SignInButtonShape.rectangular,
)
```

### Customizing the button appearance

The button renders flat, with no background fill and no border, and follows your app's theme brightness for its label color. It sets its own colors and corner radius, so a `TextButtonThemeData` does not reach it and an `ElevatedButtonThemeData` cannot change those. Properties the button leaves unset, such as `side` and `textStyle`, still fall through from that theme.

To change the label's text style, pass `textStyle` to the widget:

```dart
AnonymousSignInWidget(
  client: client,
  textStyle: const TextStyle(fontWeight: FontWeight.w600),
)
```

Inside a `SignInWidget`, style every provider button at once with `buttonStyle` instead. See [Styling the buttons](../../ui-components#styling-the-buttons).

The button is at least 240 pixels wide and at most 400. Place it in a `SizedBox`, `Expanded`, or `Flex` to control layout.

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
