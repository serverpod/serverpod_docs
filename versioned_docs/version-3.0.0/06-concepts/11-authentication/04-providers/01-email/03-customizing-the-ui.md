# Customizing the UI

When using the email identity provider, you can customize the UI to your liking. You can use the `EmailSignInWidget` to display the email authentication flow in your own custom UI, or you can use the `EmailAuthController` to build a completely custom authentication interface.

:::info
The `SignInWidget` uses the `EmailSignInWidget` internally to display the email authentication flow. You can also supply a custom `EmailSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  emailSignInWidget: EmailSignInWidget(
    client: client,
    // Change the initial screen to start registration
    startScreen: EmailFlowScreen.startRegistration,
  ),
)
```
:::

## Using the `EmailSignInWidget`

The `EmailSignInWidget` handles the complete email authentication flow including login, registration, email verification, and password reset.

You can customize the widget's behavior using its constructor parameters:

```dart
EmailSignInWidget(
  client: client,
  startScreen: EmailFlowScreen.login, // or startRegistration
  // Customize the verification code configuration
  // The default matches the default server verification code generation
  verificationCodeConfig: VerificationCodeConfig(
    length: 6,
    keyboardType: TextInputType.number,
    allowedLetterCase: LetterCase.lowercase,
    allowedCharactersPattern: RegExp(r'[0-9]'),
    resendCountdownDuration: Duration(minutes: 1),
  ),
  // Custom email validation function
  emailValidation: (email) {
    if (!email.contains('@example.com')) {
      throw FormatException('Only @example.com emails allowed');
    }
  },
  // Customize the password requirements
  // If omitted, uses the default configuration below
  passwordRequirements: [
    PasswordRequirement.minLength(12),
    PasswordRequirement.containsUppercase(),
    PasswordRequirement.containsLowercase(),
    PasswordRequirement.containsNumber(),
    PasswordRequirement.containsSpecialCharacter(),
  ],
  onTermsAndConditionsPressed: () {
    // Open terms and conditions
  },
  onPrivacyPolicyPressed: () {
    // Open privacy policy
  },
  onAuthenticated: () {
    // Handle successful authentication
  },
  onError: (error) {
    // Handle errors
  },
  // Change the wait time before a user can request a new verification code
  resendCountdownDuration: Duration(minutes: 2),
)
```

Optionally, you can provide an externally managed `EmailAuthController` instance to the widget, which will ignore all other configuration options in favor of the controller's state. The controller contains all options above - with the exception of the `verificationCodeConfig` option, which is only used by the widget.

```dart
EmailSignInWidget(
  client: client,
  controller: controller,
)
```

:::info
The terms and conditions and privacy policy checkbox on the registration screen are optional and disabled by default. The checkbox will only be shown if you provide both `onTermsAndConditionsPressed` and `onPrivacyPolicyPressed` callbacks.
:::

### Customizing the default widget's appearance

Since the `EmailSignInWidget` uses the material design system, it will react to your app's material theme. You can also wrap it in a `Theme` widget to apply a custom theme.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

Theme(
  data: Theme.of(context).copyWith(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
    // Use the AuthIdpTheme to customize the verification code input look
    extensions: <ThemeExtension<dynamic>>[
      AuthIdpTheme(
        defaultPinTheme: PinTheme(...),
        errorPinTheme: PinTheme(...),
        successPinTheme: PinTheme(...),
      ),
    ],
  ),
  child: EmailSignInWidget(client: client),
)
```

## Building a custom UI with the `EmailAuthController`

For more control over the UI, you can use the `EmailAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = EmailAuthController(
  client: client,
  startScreen: EmailFlowScreen.login,
  onAuthenticated: () {
    // Handle successful authentication
  },
  onError: (error) {
    // Handle errors
  },
);
```

### EmailAuthController State Management

Your widget should render the appropriate screen based on the `currentScreen` property of the controller. You can also use the below state properties to build your UI:

```dart
// Check current screen
final currentScreen = controller.currentScreen;

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

## The email authentication flow

The email authentication flow uses the following screens:

- `EmailFlowScreen.login` - Login with email and password
- `EmailFlowScreen.startRegistration` - Start registration with email
- `EmailFlowScreen.verifyRegistration` - Verify registration code
- `EmailFlowScreen.completeRegistration` - Set password to complete registration
- `EmailFlowScreen.requestPasswordReset` - Request password reset
- `EmailFlowScreen.verifyPasswordReset` - Verify password reset code
- `EmailFlowScreen.completePasswordReset` - Set new password

### Navigating between screens

The controller handles navigation between screens automatically when calling the methods associated with each screen, but you can also navigate manually:

```dart
// Navigate to a specific screen
controller.navigateTo(EmailFlowScreen.startRegistration);

// Navigate back
if (controller.canNavigateBack) {
  controller.navigateBack();
}
```

### EmailAuthController Methods

The controller provides methods for each step of the authentication flow:

:::info
The `EmailAuthController` already exposes internal text controllers for the email, password and verification code inputs. You can use these to build your own custom UI. All controllers are shared between login, registration and password reset flows for good UX. The `EmailAuthController` will handle the cleanup of the text controllers upon navigation as needed.
:::

#### Login

```dart
// Set email and password in the controller's text controllers
controller.emailController.text = 'user@example.com';
controller.passwordController.text = 'password123';

// Call login
await controller.login();
```

#### Registration Flow

The registration flow consists of three steps:

1. **Start Registration** - Request a verification code:

```dart
controller.emailController.text = 'user@example.com';
await controller.startRegistration();
// Controller navigates to verification screen
```

2. **Verify Registration Code** - Enter the verification code:

```dart
controller.verificationCodeController.text = '12345678';
await controller.verifyRegistrationCode();
// Controller navigates to password setup screen
```

3. **Complete Registration** - Set password:

```dart
controller.passwordController.text = 'securePassword123';
await controller.finishRegistration();
// User is now authenticated
```

#### Password Reset Flow

The password reset flow also consists of three steps:

1. **Request Password Reset**:

```dart
controller.emailController.text = 'user@example.com';
await controller.startPasswordReset();
// Controller navigates to verification screen
```

2. **Verify Reset Code**:

```dart
controller.verificationCodeController.text = '12345678';
await controller.verifyPasswordResetCode();
// Controller navigates to new password screen
```

3. **Complete Password Reset**:

```dart
controller.passwordController.text = 'newSecurePassword123';
await controller.finishPasswordReset();
// User is authenticated with new password
```

### Resending Verification Codes

To resend a verification code:

```dart
await controller.resendVerificationCode();
```

This will resend the code based on the current screen (registration or password reset).
