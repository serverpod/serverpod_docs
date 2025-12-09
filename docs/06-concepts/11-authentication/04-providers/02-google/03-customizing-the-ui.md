# Customizing the UI

When using the Google identity provider, you can customize the UI to your liking. You can use the `GoogleSignInWidget` to display the Google Sign-In flow in your own custom UI, or you can use the `GoogleAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `GoogleSignInWidget` internally to display the Google Sign-In flow. You can also supply a custom `GoogleSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  googleSignInWidget: GoogleSignInWidget(
    client: client,
    // Customize the widget theme
    theme: GSIButtonTheme.filledBlack,
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
  // Button customization
  type: GSIButtonType.standard, // or icon
  theme: GSIButtonTheme.outlined, // or filledBlue, filledBlack, etc.
  size: GSIButtonSize.large, // or medium
  text: GSIButtonText.signIn, // or continueWith, signinWith, signUpWith
  shape: GSIButtonShape.pill, // or rectangular
  logoAlignment: GSIButtonLogoAlignment.left, // or center
  minimumWidth: 200, // or null for automatic width

  // Scopes to request from Google
  // These are the default scopes, you can add additional scopes as needed.
  scopes: const [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],

  // Whether to attempt lightweight sign-in (One Tap, FedCM)
  attemptLightweightSignIn: true,

  onAuthenticated: () {
    // Handle successful authentication
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
    // Handle successful authentication
  },
  onError: (error) {
    // Handle errors
  },
  attemptLightweightSignIn: true,
  scopes: const [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
);

// Initiate sign-in
await controller.signIn();
```

:::warning
When using Google Sign-In on web, be mindful that the button will be rendered by the underlying `google_sign_in` package, so customizing the button might not work as expected. The included `GoogleSignInWidget` is a wrapper around the original widgets that already applies some customizations to make its design compatible between all platforms.
:::

### GoogleAuthController State Management

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

#### GoogleAuthController States

- `GoogleAuthState.initializing` - Controller is initializing.
- `GoogleAuthState.idle` - Ready for user interaction.
- `GoogleAuthState.loading` - Processing a sign-in request.
- `GoogleAuthState.error` - An error occurred.
- `GoogleAuthState.authenticated` - Authentication was successful.
