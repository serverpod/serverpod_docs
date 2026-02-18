# Customizing the UI

When using the Apple identity provider, you can customize the UI to your liking. You can use the `AppleSignInWidget` to display the Apple Sign-In flow in your own custom UI, or you can use the `AppleAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `AppleSignInWidget` internally to display the Apple Sign-In flow. You can also supply a custom `AppleSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  appleSignInWidget: AppleSignInWidget(
    client: client,
    // Customize the widget
    style: AppleButtonStyle.black,
  ),
)
```
:::

## Using the `AppleSignInWidget`

The `AppleSignInWidget` handles the complete Apple Sign-In flow for iOS, macOS, Android, and Web.

You can customize the widget's appearance and behavior:

```dart
AppleSignInWidget(
  client: client,
  // Button customization
  type: AppleButtonText.signIn, // or signInWith, continue, signUp
  style: AppleButtonStyle.black, // or white
  size: AppleButtonSize.large, // or small, medium
  shape: AppleButtonShape.rectangular, // or pill
  logoAlignment: AppleButtonLogoAlignment.left, // or center
  minimumWidth: 200, // or null for automatic width

  // Scopes to request from Apple
  // These are the default, and the only ones supported by Apple Sign-In.
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

### AppleAuthController State Management

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

#### AppleAuthController States

- `AppleAuthState.idle` - Ready for user interaction.
- `AppleAuthState.loading` - Processing a sign-in request.
- `AppleAuthState.error` - An error occurred.
- `AppleAuthState.authenticated` - Authentication was successful.
