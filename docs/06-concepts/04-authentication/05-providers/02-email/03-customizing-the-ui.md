---
sidebar_label: Customizing the UI
description: Customize email sign-in with the EmailOtpSignInWidget, or build your own sign-in UI on top of the EmailOtpAuthController that drives it.
---

# Customize the email sign-in UI

When using the email identity provider, you can customize the UI to your liking. You can use the `EmailOtpSignInWidget` to display email sign-in in your own custom UI, or you can use the `EmailOtpAuthController` to build a completely custom authentication interface. Both handle sign-in with a one-time code and, optionally, with a password.

:::info
The `SignInWidget` uses the `EmailOtpSignInWidget` internally to display email sign-in. You can also supply a custom `EmailOtpSignInWidget` to the `SignInWidget` to override the default behavior.

```dart
SignInWidget(
  client: client,
  emailOtpSignInWidget: EmailOtpSignInWidget(
    client: client,
    // Also let users sign in with their password
    allowPasswordSignIn: true,
    // A custom widget replaces the built-in handling, so pass your own callbacks.
    onAuthenticated: () { /* ... */ },
    onError: (error) { /* ... */ },
  ),
)
```
:::

## Using the `EmailOtpSignInWidget`

The `EmailOtpSignInWidget` handles the complete email sign-in flow: requesting and verifying the one-time code, signing in to an existing account, and creating an account for a new email. It can also offer password sign-in and password reset.

You can customize the widget's behavior using its constructor parameters:

```dart
EmailOtpSignInWidget(
  client: client,
  // Offer password sign-in and password reset on the start screen.
  // Defaults to false.
  allowPasswordSignIn: true,
  // Customize the one-time code input. Must match the server's code format.
  // The default matches the default server code generation: 6 digits.
  otpVerificationCodeConfig: VerificationCodeConfig(
    length: 6,
    keyboardType: TextInputType.number,
    allowedCharactersPattern: RegExp(r'[0-9]'),
  ),
  // Customize the password reset code input, used with allowPasswordSignIn.
  // The default matches the server's 8-digit password reset codes.
  verificationCodeConfig: VerificationCodeConfig(
    resendCountdownDuration: Duration(minutes: 1),
  ),
  // Custom email validation function. Throw InvalidEmailException so the
  // widget shows the message. Other exceptions block sign-in silently.
  emailValidation: (email) {
    if (!email.contains('@example.com')) {
      throw const InvalidEmailException('Only @example.com emails allowed');
    }
  },
  // Requirements for the password set on password reset, or on account
  // creation if the server allows it.
  passwordRequirements: [
    PasswordRequirement.minLength(12),
  ],
  onTermsAndConditionsPressed: () {
    // Open terms and conditions
  },
  onPrivacyPolicyPressed: () {
    // Open privacy policy
  },
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

If you change the code format on the server, update `otpVerificationCodeConfig` to match. See [custom verification code generation](./configuration#custom-verification-code-generation).

By default, the widget accepts email aliases, such as `name+alias@example.com`. To reject them, pass `emailValidation: (email) => EmailFlowController.validateEmail(email, allowEmailAliases: false)`.

For a new email, the account creation screen shows the terms checkbox if you provide `onTermsAndConditionsPressed` or `onPrivacyPolicyPressed`. It also offers an optional password if the server enables [`allowPasswordOnOtpRegistration`](./configuration#allowing-a-password-on-account-creation).

Optionally, you can provide an externally managed `EmailOtpAuthController` instance to the widget. A controller and a `client` are mutually exclusive, and `onAuthenticated` and `onError` belong on the controller in that case. The controller carries `allowPasswordSignIn`, `emailValidation`, and `passwordRequirements`, while the code configurations and the terms callbacks stay on the widget.

```dart
EmailOtpSignInWidget(
  controller: controller,
)
```

### Customizing the default widget's appearance

Since the `EmailOtpSignInWidget` uses the Material Design system, it will react to your app's Material theme. You can also wrap it in a `Theme` widget to apply a custom theme.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

Theme(
  data: Theme.of(context).copyWith(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
    // Use the AuthIdpTheme to customize the verification code input look
    extensions: <ThemeExtension<dynamic>>[
      AuthIdpTheme.defaultTheme(
        errorPinTheme: PinTheme(...),
      ),
    ],
  ),
  child: EmailOtpSignInWidget(client: client),
)
```

## Building a custom UI with the `EmailOtpAuthController`

For more control over the UI, you can use the `EmailOtpAuthController` class, which provides all the authentication logic without any UI components. This allows you to build a completely custom authentication interface.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = EmailOtpAuthController(
  client: client,
  allowPasswordSignIn: true,
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
  },
);
```

### State management

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

The email sign-in flow uses the following screens:

- `EmailOtpFlowScreen.start` - Enter email to request a code, or sign in with a password
- `EmailOtpFlowScreen.verify` - Enter the one-time code
- `EmailOtpFlowScreen.completeRegistration` - Create an account for a new email
- `EmailOtpFlowScreen.requestPasswordReset` - Request password reset
- `EmailOtpFlowScreen.verifyPasswordReset` - Verify password reset code
- `EmailOtpFlowScreen.completePasswordReset` - Set new password

### Navigating between screens

The controller handles navigation between screens automatically when calling the methods associated with each screen, but you can also navigate manually:

```dart
// Navigate to a specific screen
controller.navigateTo(EmailOtpFlowScreen.requestPasswordReset);

// Navigate back
if (controller.canNavigateBack) {
  controller.navigateBack();
}
```

:::info
The `EmailOtpAuthController` already exposes internal text controllers for the email, password, and verification code inputs. You can use these to build your own custom UI. All controllers are shared between the sign-in, account creation, and password reset flows for good UX. The `EmailOtpAuthController` will handle the cleanup of the text controllers upon navigation as needed.
:::

### Sign in with a one-time code

The sign-in flow consists of up to three steps:

1. **Request a code** - Send a one-time code to the email:

```dart
controller.emailController.text = 'user@example.com';
await controller.startOtpLogin();
// Controller navigates to the verify screen
```

2. **Verify the code** - Sign in, or continue to account creation:

```dart
controller.verificationCodeController.text = '123456';
await controller.verifyOtpCode();
// If an account exists, the user is now authenticated.
// Otherwise, the controller navigates to the completeRegistration screen.
```

3. **Create the account** - Only for a new email, once the user has accepted the terms:

```dart
// Optional, only if the server allows a password on account creation.
if (controller.otpAllowPassword) {
  controller.toggleRegistrationPassword();
  controller.passwordController.text = 'securePassword123';
}
await controller.finishOtpRegistration();
// User is now authenticated
```

If the code is accepted but completing the sign-in fails, for example because of a network error, call `verifyOtpCode()` again. It retries the sign-in without checking the code a second time. If the server rejects the retry, the controller's `error` is an `OtpLoginRejectedException`, `onError` receives a message asking for a new code, and the user needs to request one with `resendVerificationCode()`.

### Sign in with a password

With `allowPasswordSignIn` set to `true`, call `togglePasswordSignIn()` to show the password field on the start screen, then `login()` to sign in.

```dart
controller.togglePasswordSignIn();
controller.emailController.text = 'user@example.com';
controller.passwordController.text = 'password123';
await controller.login();
```

### Password reset flow

The password reset flow consists of three steps:

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

### Resending verification codes

To resend a verification code:

```dart
await controller.resendVerificationCode();
```

This will resend the code based on the current screen (sign-in or password reset).

## Password-only sign-in

Projects that extend `EmailIdpBaseEndpoint`, such as those created before Serverpod 4.1, use the `EmailSignInWidget` and the `EmailAuthController` instead. They support sign-in with a password only, and users register with an email and a password. To move to the `EmailOtpSignInWidget`, see [Switch from password-only sign-in](./setup#switch-from-password-only-sign-in).

To override the default widget, pass your own `EmailSignInWidget` to the `SignInWidget` as `emailSignInWidget`.

### Using the `EmailSignInWidget`

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
    allowedCharactersPattern: RegExp(r'[0-9]'),
    // The wait before the user can request a new code.
    resendCountdownDuration: Duration(minutes: 1),
  ),
  // Custom email validation function. Throw InvalidEmailException so the
  // widget shows the message. Other exceptions block sign-in silently.
  emailValidation: (email) {
    if (!email.contains('@example.com')) {
      throw const InvalidEmailException('Only @example.com emails allowed');
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

Optionally, you can provide an externally managed `EmailAuthController` instance to the widget. A controller and a `client` are mutually exclusive, and `onAuthenticated` and `onError` belong on the controller in that case. Passing either alongside a controller trips an assertion, so a debug build throws. The controller carries the sign-in options, while `verificationCodeConfig`, `onTermsAndConditionsPressed`, and `onPrivacyPolicyPressed` stay on the widget.

```dart
EmailSignInWidget(
  controller: controller,
)
```

:::info
The terms and conditions and privacy policy checkbox on the registration screen are optional and disabled by default. The checkbox is shown as soon as you provide either `onTermsAndConditionsPressed` or `onPrivacyPolicyPressed`.
:::

### Building a custom UI with the `EmailAuthController`

The `EmailAuthController` provides the same [state properties](#state-management), [navigation](#navigating-between-screens), [password reset](#password-reset-flow), and [code resending](#resending-verification-codes) as the `EmailOtpAuthController`, with its own screens and methods for login and registration.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

final controller = EmailAuthController(
  client: client,
  startScreen: EmailFlowScreen.login,
  onAuthenticated: () {
    // Do something when the user is authenticated.
    //
    // NOTE: You should not navigate to the home screen here, otherwise
    // the user will have to sign in again every time they open the app.
  },
  onError: (error) {
    // Handle errors
  },
);
```

The controller uses the following screens:

- `EmailFlowScreen.login` - Login with email and password
- `EmailFlowScreen.startRegistration` - Start registration with email
- `EmailFlowScreen.verifyRegistration` - Verify registration code
- `EmailFlowScreen.completeRegistration` - Set password to complete registration
- `EmailFlowScreen.requestPasswordReset` - Request password reset
- `EmailFlowScreen.verifyPasswordReset` - Verify password reset code
- `EmailFlowScreen.completePasswordReset` - Set new password

#### Login

```dart
// Set email and password in the controller's text controllers
controller.emailController.text = 'user@example.com';
controller.passwordController.text = 'password123';

// Call login
await controller.login();
```

#### Registration flow

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
