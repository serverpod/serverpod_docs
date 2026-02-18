# Configuration

This page covers configuration options for the email identity provider beyond the basic setup.

## Configuration options

Below is a non-exhaustive list of some of the most common configuration options. For more details on all options, check the `EmailIdpConfig` in-code documentation.

### Peppering

A pepper is a server-side secret that is added, along with a unique salt, to a password before it is hashed and stored. The pepper makes it harder for an attacker to crack password hashes if they have only gained access to the database.

The pepper is configured via the `secretHashPepper` property in `EmailIdpConfig`, as shown in the [server-side configuration](./setup#server-side-configuration) section. Its [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.

:::warning
If the pepper is changed, all passwords in the database will need to be re-hashed with the new pepper, or the old pepper needs to be added as a fallback pepper. Store the pepper securely and never expose it to the client.
:::

#### Rotating secret hash peppers

To keep old passwords valid after a pepper change, use the `fallbackSecretHashPeppers` configuration option to add the old pepper as a fallback pepper.

```dart
final emailIdpConfig = EmailIdpConfigFromPasswords(
  fallbackSecretHashPeppers: [
    pod.getPassword('oldEmailSecretHashPepper')!,
  ],
);
```

### Customizing Password Requirements

By default, the minimum password length is set to 8 characters. If you wish to modify this requirement, you can utilize the `passwordValidationFunction` configuration option.

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

:::tip
This is useful to ensure password policies on the server-side. It is a best practice to pair it with a configuration on the client-side to provide a better UX when creating a new password. The `EmailSignInWidget` and `EmailAuthController` have a `passwordRequirements` parameter that can be used to configure the password requirements.
:::

### Custom Verification Code Generation

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

:::warning
Remember to configure the `verificationCodeConfig` parameter on the `EmailSignInWidget` to match the length of the verification code you generate. Otherwise, users will never be able to enter the verification code correctly. See the [customizing the UI section](./customizing-the-ui) for more details.
:::

#### Bypassing verification code in development

To simplify testing, it is possible to bypass the verification code by using a custom verification code generator that always returns the same code. This can be configured only for the development run mode as below:

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    EmailIdpConfigFromPasswords(
      registrationVerificationCodeGenerator: pod.runMode == 'development'
          ? () => 'aaaaaaaa' // Be sure to match the length used in production.
          : defaultVerificationCodeGenerator,
    ),
  ],
);
```

### Reacting to events

Beyond the `sendRegistrationVerificationCode` and `sendPasswordResetVerificationCode` callbacks to send verification codes to the user, there are a few callbacks that can be used to react to events, such as `onAfterAccountCreated` and `onPasswordResetCompleted`. These can be useful for sending emails to the user to communicate the successful operation.

### Rate limiting

The email provider includes built-in rate limiting to prevent abuse, with some sensible defaults:

- **Failed login attempts**: Limited to 5 attempts per 5 minutes
- **Password reset attempts**: Limited to 3 attempts per hour
- **Verification code attempts**: Limited to 3 attempts per code lifetime of 15 minutes

You can customize all rate limits in the `EmailIdpConfig`:

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
