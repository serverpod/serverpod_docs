# Customizing the UI

When using the Microsoft identity provider, you can customize the UI to your liking. You can use the `MicrosoftSignInWidget` to display the Microsoft Sign-In flow in your own custom UI, or you can use the `MicrosoftAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `MicrosoftSignInWidget` internally to display the Microsoft Sign-In flow. You can also supply a custom `MicrosoftSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  microsoftSignInWidget: MicrosoftSignInWidget(
    client: client,
    // Customize the widget
    style: MicrosoftButtonStyle.dark,
  ),
)
```

:::

## Using the `MicrosoftSignInWidget`

The `MicrosoftSignInWidget` handles the complete Microsoft Sign-In flow for your Flutter app.

You can customize the widget's appearance and behavior:

```dart
MicrosoftSignInWidget(
  client: client,
  // Button customization
  text: MicrosoftButtonText.continueWith, // or signIn, signUp
  type: MicrosoftButtonType.standard, // or icon
  style: MicrosoftButtonStyle.light, // or dark
  size: MicrosoftButtonSize.large, // or medium
  shape: MicrosoftButtonShape.pill, // or rectangular, rounded
  logoAlignment: MicrosoftButtonLogoAlignment.left, // or center
  minimumWidth: 240, // or null for automatic width

  // Scopes to request from Microsoft
  // These are the default scopes.
  scopes: const [
    'openid',
    'profile',
    'email',
    'offline_access',
    'https://graph.microsoft.com/User.Read',
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

## Building a custom UI with the `MicrosoftAuthController`

For more control over the UI, you can use the `MicrosoftAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = MicrosoftAuthController(
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
    'openid',
    'profile',
    'email',
    'offline_access',
    'https://graph.microsoft.com/User.Read',
  ],
);

// Initiate sign-in
await controller.signIn();
```

### MicrosoftAuthController state management

Your widget should render the appropriate UI based on the `state` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current state
final state = controller.state; // MicrosoftAuthState enum

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

#### MicrosoftAuthController states

- `MicrosoftAuthState.idle` - Ready for user interaction.
- `MicrosoftAuthState.loading` - Processing a sign-in request.
- `MicrosoftAuthState.error` - An error occurred.
- `MicrosoftAuthState.authenticated` - Authentication was successful.
