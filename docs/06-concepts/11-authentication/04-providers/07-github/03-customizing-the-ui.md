# Customizing the UI

When using the GitHub identity provider, you can customize the UI to your liking. You can use the `GitHubSignInWidget` to display the GitHub Sign-In flow in your own custom UI, or you can use the `GitHubAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `GitHubSignInWidget` internally to display the GitHub Sign-In flow. You can also supply a custom `GitHubSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  githubSignInWidget: GitHubSignInWidget(
    client: client,
    // Customize the widget
    style: GitHubButtonStyle.black,
  ),
)
```

:::

## Using the `GitHubSignInWidget`

The `GitHubSignInWidget` handles the complete GitHub Sign-In flow for your Flutter app.

You can customize the widget's appearance and behavior:

```dart
GitHubSignInWidget(
  client: client,
  // Button customization
  text: GitHubButtonText.continueWith, // or signIn, signUp
  type: GitHubButtonType.standard, // or icon
  style: GitHubButtonStyle.black, // or white
  size: GitHubButtonSize.large, // or medium
  shape: GitHubButtonShape.pill, // or rectangular, rounded
  logoAlignment: GitHubButtonLogoAlignment.left, // or center
  minimumWidth: 240, // or null for automatic width

  // Scopes to request from GitHub
  // These are the default.
  scopes: const ['user', 'user:email', 'read:user'],

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

## Building a custom UI with the `GitHubAuthController`

For more control over the UI, you can use the `GitHubAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = GitHubAuthController(
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
  scopes: const ['user', 'user:email', 'read:user'],
);

// Initiate sign-in
await controller.signIn();
```

### GitHubAuthController State Management

Your widget should render the appropriate UI based on the `state` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current state
final state = controller.state; // GitHubAuthState enum

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

#### GitHubAuthController States

- `GitHubAuthState.idle` - Ready for user interaction.
- `GitHubAuthState.loading` - Processing a sign-in request.
- `GitHubAuthState.error` - An error occurred.
- `GitHubAuthState.authenticated` - Authentication was successful.
