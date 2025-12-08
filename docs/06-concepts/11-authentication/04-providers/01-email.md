# Email

To properly configure Sign in with Email, you must connect your Serverpod to an external service that can send the emails. One convenient option is the [mailer](https://pub.dev/packages/mailer) package, which can send emails through any SMTP service. Most email providers, such as Resend, Sendgrid or Mandrill, support SMTP.

:::caution
You need to install the auth module before you continue, see [Setup](../setup).
:::

## Server-side configuration

In your main `server.dart` file, configure the email identity provider using `EmailIdpConfig` and add it to your `pod.initializeAuthServices()` configuration:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfig(
        refreshTokenHashPepper: pod.getPassword('jwtRefreshTokenHashPepper')!,
        algorithm: JwtAlgorithm.hmacSha512(
          SecretKey(pod.getPassword('jwtPrivateKey')!),
        )
      ),
    ],
    identityProviderBuilders: [
      // Configure the email identity provider
      EmailIdpConfig(
        secretHashPepper: pod.getPassword('emailSecretHashPepper')!,
        sendRegistrationVerificationCode: _sendRegistrationCode,
        sendPasswordResetVerificationCode: _sendPasswordResetCode,
      ),
    ],
  );

  await pod.start();
}

void _sendRegistrationCode(
  Session session, {
  required String email,
  required UuidValue accountRequestId,
  required String verificationCode,
  required Transaction? transaction,
}) {
  // NOTE: Here you call your mail service to send the verification code to
  // the user. For testing, we will just log the verification code.
  session.log('[EmailIDP] Registration code ($email): $verificationCode');
}

void _sendPasswordResetCode(
  Session session, {
  required String email,
  required UuidValue passwordResetRequestId,
  required String verificationCode,
  required Transaction? transaction,
}) {
  // NOTE: Here you call your mail service to send the verification code to
  // the user. For testing, we will just log the verification code.
  session.log('[EmailIDP] Password reset code ($email): $verificationCode');
}
```

Then, extend the abstract endpoint to expose it on the server and generate the client code:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';

class EmailIdpEndpoint extends EmailIdpBaseEndpoint {}
```

Run `serverpod generate` to generate the client code with the endpoint methods.

### Configuration options

- `secretHashPepper`: Required. A secret pepper used for hashing passwords and verification codes. Must be at least 10 characters long.

:::tip
If you are using the `config/passwords.yaml` file, you can use the `EmailIdpConfigFromPasswords` constructor to automatically load the secret pepper from the passwords file. It will expect the `emailSecretHashPepper` key to be present with the secret pepper value.
:::

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `EmailIdpConfig` in-code documentation.

#### Customizing Password Requirements

You can customize password validation by providing a custom `passwordValidationFunction`:

```dart
final emailIdpConfig = EmailIdpConfigFromPasswords(
  passwordValidationFunction: (password) {
    // Require at least 12 characters, one uppercase, one lowercase, one number
    if (password.length < 12) return false;
    if (!password.contains(RegExp(r'[A-Z]'))) return false;
    if (!password.contains(RegExp(r'[a-z]'))) return false;
    if (!password.contains(RegExp(r'[0-9]'))) return false;
    return true;
  },
);
```

#### Custom Verification Code Generation

You can customize how verification codes are generated:

```dart
final emailIdpConfig = EmailIdpConfigFromPasswords(
  registrationVerificationCodeGenerator: () {
    // Generate a 6-digit numeric code
    final random = Random();
    return List.generate(6, (_) => random.nextInt(10)).join();
  },
);
```

#### Reacting to events

Beyond the `sendRegistrationVerificationCode` and `sendPasswordResetVerificationCode` callbacks to send verification codes to the user, there are a few callbacks you can configure to react to events, such as `onAfterAccountCreated` and `onPasswordResetCompleted`. These can be useful for sending emails to the user to communicate the successful operation.

#### Rate limiting

The email provider includes built-in rate limiting to prevent abuse, with some sensible defaults:

- **Failed login attempts**: Limited to 5 attempts per 5 minutes
- **Password reset attempts**: Limited to 3 attempts per hour
- **Verification code attempts**: Limited to 3 attempts per code lifetime of 15 minutes

You can customize these limits in the `EmailIdpConfig`:

```dart
final emailIdpConfig = EmailIdpConfigFromPasswords(
  registrationVerificationCodeLifetime: Duration(minutes: 15),
  registrationVerificationCodeAllowedAttempts: 3,
  passwordResetVerificationCodeLifetime: Duration(minutes: 15),
  passwordResetVerificationCodeAllowedAttempts: 3,
  failedLoginRateLimit: RateLimit(
    maxAttempts: 10,
    timeframe: Duration(minutes: 10),
  ),
  maxPasswordResetAttempts: RateLimit(
    maxAttempts: 5,
    timeframe: Duration(hours: 2),
  ),
);
```

#### Rotating secret hash peppers

When rotating the secret hash pepper, you can provide a list of fallback peppers to support the old pepper. This is useful for allowing old sessions to be validated after a rotation.

```dart
final emailIdpConfig = EmailIdpConfigFromPasswords(
  fallbackSecretHashPeppers: [
    pod.getPassword('oldEmailSecretHashPepper')!,
  ],
);
```

## Client-side configuration

Add the dependencies to your `pubspec.yaml` in your **Flutter** project.

```yaml
dependencies:
  ...
  serverpod_auth_idp_flutter: ^3.x.x
```

## Using EmailSignInWidget

The `serverpod_auth_idp_flutter` package provides the `EmailSignInWidget`, which handles the complete email authentication flow including login, registration, email verification, and password reset.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

EmailSignInWidget(
  client: client,
  onAuthenticated: () {
    // Navigate to home screen or update UI
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => HomePage()),
    );
  },
  onError: (error) {
    // Handle errors
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $error')),
    );
  },
)
```

The widget automatically handles:
- Login with email and password
- Registration with terms acceptance and email verification
- Password reset flow
- Navigation between screens

### Configuring the `EmailSignInWidget`

You can customize the widget's behavior using its constructor parameters:

```dart
EmailSignInWidget(
  client: client,
  startScreen: EmailFlowScreen.login, // or startRegistration
  emailValidation: (email) {
    // Custom email validation
    if (!email.contains('@example.com')) {
      throw FormatException('Only @example.com emails allowed');
    }
  },
  // Customize the password requirements
  passwordRequirements: [
    PasswordRequirement.minLength(12),
    PasswordRequirement.hasUppercase(),
    PasswordRequirement.hasLowercase(),
    PasswordRequirement.hasNumber(),
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

Optionally, you can provide an externally managed `EmailAuthController` instance to the widget, which will ignore all other configuration options in favor of the controller's state.

```dart
EmailSignInWidget(
  client: client,
  controller: controller,
)
```

:::info
The terms and conditions and privacy policy checkbox on the registration screen are optional and disabled by default. They will only be shown if you provide both `onTermsAndConditionsPressed` and `onPrivacyPolicyPressed` callbacks.
:::

## Customizing the widget's appearance

Since the `EmailSignInWidget` uses the material design system, it will react to your app's material theme. You can also wrap it in a `Theme` widget to apply a custom theme.

```dart
Theme(
  data: Theme.of(context).copyWith(
    colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
  ),
  child: EmailSignInWidget(client: client),
)
```

:::info
The verification code input look is configurable by using an `AuthIdpTheme` theme extension in your app's theme.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

Theme(
  data: Theme.of(context).copyWith(
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
:::

## Custom UI with EmailAuthController

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

## Email Flow Screens

The email authentication flow uses the following screens:

- `EmailFlowScreen.login` - Login with email and password
- `EmailFlowScreen.startRegistration` - Start registration with email
- `EmailFlowScreen.verifyRegistration` - Verify registration code
- `EmailFlowScreen.completeRegistration` - Set password to complete registration
- `EmailFlowScreen.requestPasswordReset` - Request password reset
- `EmailFlowScreen.verifyPasswordReset` - Verify password reset code
- `EmailFlowScreen.completePasswordReset` - Set new password

### Navigation

The controller handles navigation between screens automatically, but you can also navigate manually:

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

## Password storage security

Serverpod provides some additional configurable options to provide extra layers of security for stored password hashes.

:::info
By default, the minimum password length is set to 8 characters. If you wish to modify this requirement, you can utilize the `passwordValidationFunction` configuration option.
:::

### Peppering

A pepper is a server-side secret that is added, along with a unique salt, to a password before it is hashed and stored. The pepper makes it harder for an attacker to crack password hashes if they have only gained access to the database.

The [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.

The pepper is configured via the `secretHashPepper` property in `EmailIdpConfig`, as shown in the [server-side configuration](#configuration-options) section.

:::warning
If the pepper is changed, all passwords in the database will need to be re-hashed with the new pepper, or the old pepper needs to be added as a fallback pepper. Store the pepper securely and never expose it to the client.
:::

## Admin operations

The email identity provider provides admin operations through `EmailIdpAdmin` for managing email accounts and cleaning up expired or dangling requests. These operations are useful for administrative tasks, maintenance, and preventing database bloat.

### Accessing EmailIdpAdmin

You can access the admin operations through `AuthServices`:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';
import 'package:serverpod_auth_idp_server/core.dart';

// Get the EmailIdp instance
final emailIdp = AuthServices.instance.emailIdp;

// Access admin operations
final admin = emailIdp.admin;
```

### Account Management

The admin API provides methods for managing email accounts:

#### Finding Accounts

```dart
// Find an account by email
final account = await admin.findAccount(
  session,
  email: 'user@example.com',
);
```

#### Creating Accounts

```dart
// Create an email authentication account
final emailAccountId = await admin.createEmailAuthentication(
  session,
  authUserId: userId,
  email: 'user@example.com',
  password: 'securePassword123',
);
```

#### Deleting Accounts

```dart
// Delete an account by email
await admin.deleteEmailAccount(
  session,
  email: 'user@example.com',
);

// Delete all email accounts for a user
await admin.deleteEmailAccountByAuthUserId(
  session,
  authUserId: userId,
);
```

#### Setting Passwords

```dart
// Set or update a password for an account
await admin.setPassword(
  session,
  email: 'user@example.com',
  password: 'newSecurePassword123',
);
```

:::warning
The `setPassword` method does not validate the password against the configured password policy. Make sure to validate the password before calling this method if needed.
:::

### Finding Active Account Requests

You can also check for active account requests:

```dart
final accountRequest = await admin.findActiveEmailAccountRequest(
  session,
  accountRequestId: requestId,
);
```

This is useful for checking the status of a registration request or verifying if a request is still valid.

### Cleanup Operations

Over time, expired account requests, password reset requests, and failed login attempts can accumulate in the database, leading to database bloat and potential performance issues. It's important to periodically clean these up to prevent database bloat. Such requests are not automatically cleaned up since they can be useful for auditing purposes, so it is up to each application to decide when to clean them up.

#### Cleaning Up Expired Account Requests

Account requests that have expired (users who started registration but never completed it) should be cleaned up:

```dart
// Delete all expired account requests
await admin.deleteExpiredAccountRequests(session);

// Delete a specific account request
await admin.deleteEmailAccountRequestById(
  session,
  accountRequestId: requestId,
);
```

#### Cleaning Up Expired Password Reset Requests

Password reset requests that have expired (users who requested a password reset but never completed it) should be cleaned up:

```dart
// Delete all expired password reset requests
await admin.deleteExpiredPasswordResetRequests(session);

// Delete password reset request attempts for a specific email
// Useful when you want to allow a user to request a new password
// even though they have hit the rate limit
await admin.deletePasswordResetRequestsAttemptsForEmail(
  session,
  email: 'user@example.com',
);
```

#### Cleaning Up Failed Login Attempts

Failed login attempts are tracked for rate limiting should also be cleaned up when no longer useful for auditing purposes:

```dart
// Delete all failed login attempts
await admin.deleteFailedLoginAttempts(session);

// Delete failed login attempts older than a specific duration
await admin.deleteFailedLoginAttempts(
  session,
  olderThan: Duration(days: 30),
);
```
