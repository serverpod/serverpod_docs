---
sidebar_label: Customizing the UI
description: GitHub sign-in UI can be customized with the GitHubSignInWidget and GitHubAuthController to build a custom authentication flow in your app.
---

# Customize the GitHub sign-in UI

When using the GitHub identity provider, you can customize the UI to your liking. You can use the `GitHubSignInWidget` to display the GitHub Sign-In flow in your own custom UI, or you can use the `GitHubAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `GitHubSignInWidget` internally to display the GitHub Sign-In flow. You can also supply a custom `GitHubSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  githubSignInWidget: GitHubSignInWidget(
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

## Using the `GitHubSignInWidget`

The `GitHubSignInWidget` handles the complete GitHub Sign-In flow for your Flutter app.

You can customize the widget's appearance and behavior:

```dart
GitHubSignInWidget(
  client: client,
  // Button customization. The values shown are the defaults.
  style: GitHubButtonStyle.black, // or white
  size: SignInButtonSize.large, // or medium, small
  text: SignInButtonTextVariant.continueWith, // or signInWith, signUpWith, signIn
  shape: SignInButtonShape.pill, // or rounded, rectangular
  logoAlignment: SignInButtonLogoAlignment.center, // or left
  minimumWidth: 240, // at most 400
  textStyle: null, // TextStyle for the label

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

:::note
The `scopes` argument applies to **OAuth Apps**. For a **GitHub App**, the App's [Permissions](./setup#set-permissions) configured on the GitHub side control access and the `scopes` argument is ignored.
:::

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

### GitHubAuthController state management

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

#### GitHubAuthController states

- `GitHubAuthState.idle` - Ready for user interaction.
- `GitHubAuthState.loading` - Processing a sign-in request.
- `GitHubAuthState.error` - An error occurred.
- `GitHubAuthState.authenticated` - Authentication was successful.
