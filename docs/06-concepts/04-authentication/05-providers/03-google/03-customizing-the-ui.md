---
sidebar_label: Customizing the UI
description: Google sign-in UI can be customized with the GoogleSignInWidget and GoogleAuthController to build a custom authentication flow in your app.
---

# Customize the Google sign-in UI

When using the Google identity provider, you can customize the UI to your liking. You can use the `GoogleSignInWidget` to display the Google sign-in flow in your own custom UI, or you can use the `GoogleAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `GoogleSignInWidget` internally to display the Google sign-in flow. You can also supply a custom `GoogleSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  googleSignInWidget: GoogleSignInWidget(
    client: client,
    // Shape and label survive inside SignInWidget. Brand colors do not.
    shape: SignInButtonShape.rounded,
    text: SignInButtonTextVariant.signInWith,
    // A custom widget replaces the built-in handling, so pass your own callbacks.
    onAuthenticated: () { /* ... */ },
    onError: (error) { /* ... */ },
  ),
)
```

:::

## Using the `GoogleSignInWidget`

The `GoogleSignInWidget` handles the complete Google Sign-In flow for iOS, Android, and Web.

You can customize the widget's appearance and behavior:

```dart
GoogleSignInWidget(
  client: client,
  // Button customization. The values shown are the defaults.
  style: GoogleButtonStyle.outline, // or filledBlue, filledBlack
  size: SignInButtonSize.large, // or medium, small
  text: SignInButtonTextVariant.continueWith, // or signInWith, signUpWith, signIn
  shape: SignInButtonShape.pill, // or rounded, rectangular
  logoAlignment: SignInButtonLogoAlignment.center, // or left
  minimumWidth: 240, // at most 400
  textStyle: null, // TextStyle for the label

  // Scopes to request from Google
  // These are the default scopes, you can add additional scopes as needed.
  scopes: const [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],

  // Whether to attempt lightweight sign-in (Android and iOS only)
  attemptLightweightSignIn: false,

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

## Building a custom UI with the `GoogleAuthController`

For more control over the UI, you can use the `GoogleAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = GoogleAuthController(
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
  attemptLightweightSignIn: false,
  scopes: const [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
);

// Initiate sign-in
await controller.signIn();
```

:::note
On web, sign-in always runs through the OAuth2 redirect flow, and your customized widget renders directly. Both `clientId` and `redirectUri` must be passed to `initializeGoogleSignIn`, or the button does not render at all. Set them up as described in [Web setup](./setup#web).
:::

### GoogleAuthController state management

Your widget should render the appropriate UI based on the `state` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current state
final state = controller.state; // GoogleAuthState enum

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

#### GoogleAuthController states

- `GoogleAuthState.initializing` - Controller is initializing.
- `GoogleAuthState.idle` - Ready for user interaction.
- `GoogleAuthState.loading` - Processing a sign-in request.
- `GoogleAuthState.error` - An error occurred.
- `GoogleAuthState.authenticated` - Authentication was successful.
