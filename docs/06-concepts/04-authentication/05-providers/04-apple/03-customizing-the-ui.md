---
sidebar_label: Customizing the UI
description: Apple sign-in UI can be customized with the AppleSignInWidget and AppleAuthController to build a custom authentication flow in your app.
---

# Customize the Apple sign-in UI

When using the Apple identity provider, you can customize the UI to your liking. You can use the `AppleSignInWidget` to display the Apple Sign-In flow in your own custom UI, or you can use the `AppleAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `AppleSignInWidget` internally to display the Apple Sign-In flow. You can also supply a custom `AppleSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  appleSignInWidget: AppleSignInWidget(
    client: client,
    // Shape and label survive inside SignInWidget, unless its buttonStyle
    // sets them. Brand colors do not.
    shape: SignInButtonShape.rounded,
    text: SignInButtonTextVariant.signInWith,
    // A custom widget replaces the built-in handling, so pass your own callbacks.
    onAuthenticated: () { /* ... */ },
    onError: (error) { /* ... */ },
  ),
)
```
:::

## Using the `AppleSignInWidget`

The `AppleSignInWidget` handles the complete Apple Sign-In flow for iOS, macOS, Android, and Web.

You can customize the widget's appearance and behavior:

```dart
// AppleIDAuthorizationScopes comes from the sign_in_with_apple package.
// Add it to your app's dependencies to import it.
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

AppleSignInWidget(
  client: client,
  // Button customization. The values shown are the defaults.
  style: AppleButtonStyle.black, // or white, whiteOutlined
  size: SignInButtonSize.large, // or medium, small
  text: SignInButtonTextVariant.continueWith, // or signInWith, signUpWith, signIn
  shape: SignInButtonShape.pill, // or rounded, rectangular
  logoAlignment: SignInButtonLogoAlignment.center, // or left
  minimumWidth: 240, // at most 400
  textStyle: null, // TextStyle for the label

  // Scopes to request from Apple.
  // These are the default, and the only ones Sign in with Apple supports.
  scopes: const [
    AppleIDAuthorizationScopes.email,
    AppleIDAuthorizationScopes.fullName,
  ],

  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
  },
)
```

## Building a custom UI with the `AppleAuthController`

For more control over the UI, you can use the `AppleAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

// Also import sign_in_with_apple here for AppleIDAuthorizationScopes.
final controller = AppleAuthController(
  client: client,
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
  },
  scopes: const [
    AppleIDAuthorizationScopes.email,
    AppleIDAuthorizationScopes.fullName,
  ],
);

// Initiate sign-in
await controller.signIn();
```

### AppleAuthController state management

Your widget should render the appropriate UI based on the `state` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current state
final state = controller.state; // AppleAuthState enum

// Check if loading
final isLoading = controller.isLoading;

// Check if authenticated
final isAuthenticated = controller.isAuthenticated;

// Get error message
final errorMessage = controller.errorMessage;

// Listen to state changes
controller.addListener(() {
  setState(() {
    // Rebuild UI when controller state changes
  });
});
```

#### AppleAuthController states

- `AppleAuthState.idle` - Ready for user interaction.
- `AppleAuthState.loading` - Processing a sign-in request.
- `AppleAuthState.error` - An error occurred.
- `AppleAuthState.authenticated` - Authentication was successful.
