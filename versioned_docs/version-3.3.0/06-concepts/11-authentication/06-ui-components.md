# UI Components

The authentication system provides a comprehensive set of UI components and controllers for building authentication interfaces. These components handle the complete authentication flow, including sign-in, registration, and password management.

## Overview

The UI component architecture consists of:

- **Common widgets**: Reusable widgets for building custom authentication interfaces.
- **Provider-specific widgets**: Pre-built UI components that are used in specific providers.
- **Controllers**: Business logic classes that can be used with custom UI.

## SignInWidget

The `SignInWidget` is an all-in-one widget that automatically detects available authentication providers and displays the appropriate sign-in options.

```dart
import 'package:flutter/material.dart';
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';
import 'package:your_client/your_client.dart';

class SignInPage extends StatelessWidget {
  final Client client;

  const SignInPage({required this.client, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SignInWidget(
        client: client,
        onAuthenticated: () {
          // Do something when the user is authenticated.
          //
          // NOTE: You should not navigate to the home screen here, otherwise
          // the user will have to sign in again every time they open the app.
        },
        onError: (error) {
          // Handle errors
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $error')),
          );
        },
      ),
    );
  }
}
```

### Disabling Providers

It is not possible to forcefully enable a provider, since this depends on the configuration of the identity providers, as described in the [setup section](./setup#identity-providers-configuration).

But, even though the `SignInWidget` automatically detects enabled providers, you can disable specific providers if you want to hide them on the client, but still keep them available on the server.

This is useful if you want gradually disable a provider, but still keep compatibility with older clients.

```dart
SignInWidget(
  client: client,
  disableEmailSignInWidget: false,
  disableGoogleSignInWidget: false,
  disableAppleSignInWidget: true, // Disable Apple sign-in
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
)
```

### Customizing SignInWidget

You can customize individual provider widgets:

```dart
SignInWidget(
  client: client,
  emailSignInWidget: EmailSignInWidget(
    client: client,
    startScreen: EmailFlowScreen.login,
    // NOTE: When you opt-out of the internal widget, you need to provide your
    // own `onAuthenticated` and `onError` callbacks.
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  googleSignInWidget: GoogleSignInWidget(
    client: client,
    theme: GSIButtonTheme.filledBlack,
    scopes: const [
      ...GoogleAuthController.defaultScopes,
      'https://www.googleapis.com/auth/youtube',
    ],
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  appleSignInWidget: AppleSignInWidget(
    client: client,
    style: AppleButtonStyle.black,
    onAuthenticated: _onAuthenticated,
    onError: _onError,
    // ... custom configuration
  ),
  onAuthenticated: _onAuthenticated,
  onError: _onError,
)

void _onAuthenticated() {
  // Handle successful authentication
}

void _onError(Object error) {
  // Handle errors
}
```

For more details on all options of each provider widget, see the "Customizing UI" section of the specific provider documentation. There you will also find information on how to build a custom UI with the controller. For example, see the [Email Provider](./providers/email/customizing-the-ui) documentation.
