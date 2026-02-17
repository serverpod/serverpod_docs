# Customizing the UI

When using the Facebook identity provider, you can customize the UI to your liking. You can use the `FacebookSignInWidget` to display the Facebook Sign-In flow in your own custom UI, or you can use the `FacebookAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` automatically detects and displays the Facebook sign-in flow when the `serverpod_auth_idp_flutter_facebook` package is installed and initialized. The Facebook provider registers itself dynamically with the sign-in widget.
:::

## Using the `FacebookSignInWidget`

The `FacebookSignInWidget` handles the complete Facebook Sign-In flow for iOS, Android, Web, and macOS.

You can customize the widget's appearance and behavior:

```dart
import 'package:serverpod_auth_idp_flutter_facebook/serverpod_auth_idp_flutter_facebook.dart';

FacebookSignInWidget(
  client: client,
  // Button customization
  text: FacebookButtonText.continueWith, // or signIn, signInWith, signUp
  type: FacebookButtonType.standard, // or icon
  style: FacebookButtonStyle.blue, // or white
  size: FacebookButtonSize.large, // or medium
  shape: FacebookButtonShape.pill, // or rectangular, rounded
  logoAlignment: FacebookButtonLogoAlignment.left, // or center

  // Permissions to request from Facebook
  // These are the default permissions.
  permissions: const ['email', 'public_profile'],

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

## Using the FacebookAuthController

For more control over the UI, you can use the `FacebookAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter_facebook/serverpod_auth_idp_flutter_facebook.dart';

final controller = FacebookAuthController(
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
  permissions: const ['email', 'public_profile'],
);

// Initiate sign-in
await controller.signIn();
```

### FacebookAuthController State Management

Your widget should render the appropriate UI based on the `state` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current state
final state = controller.state; // FacebookAuthState enum

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

### FacebookAuthController States

- `FacebookAuthState.initializing` - Controller is initializing.
- `FacebookAuthState.idle` - Ready for user interaction.
- `FacebookAuthState.loading` - Processing a sign-in request.
- `FacebookAuthState.error` - An error occurred.
- `FacebookAuthState.authenticated` - Authentication was successful.
