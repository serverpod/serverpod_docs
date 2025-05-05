# Email

To properly configure Sign in with Email, you must connect your Serverpod to an external service that can send the emails. One convenient option is the [mailer](https://pub.dev/packages/mailer) package, which can send emails through any SMTP service. Most email providers, such as Sendgrid or Mandrill, support SMTP.

A comprehensive tutorial covering email/password sign-in complete with sending the validation code via email is available [here](https://medium.com/serverpod/getting-started-with-serverpod-authentication-part-1-72c25280e6e9).

:::caution
You need to install the auth module before you continue, see [Setup](../setup).
:::

## Server-side configuration

In your main `server.dart` file,  import the `serverpod_auth_server` module, and set up the authentication configuration:

```dart
import 'package:serverpod_auth_server/module.dart' as auth;

auth.AuthConfig.set(auth.AuthConfig(
  sendValidationEmail: (session, email, validationCode) async {
    // Send the validation email to the user.
    // Return `true` if the email was successfully sent, otherwise `false`.
    return true;
  },
  sendPasswordResetEmail: (session, userInfo, validationCode) async {
    // Send the password reset email to the user.
    // Return `true` if the email was successfully sent, otherwise `false`.
    return true;
  },
));

// Start the Serverpod server.
await pod.start();
```

:::info

For debugging purposes, you can print the validation code to the console. The chat module example does just this. You can view that code [here](https://github.com/serverpod/serverpod/blob/main/examples/chat/chat_server/lib/server.dart).

:::

## Client-side configuration

Add the dependencies to your `pubspec.yaml` in your **client** project.

```yaml
dependencies:
  ...
  serverpod_auth_client: ^1.x.x
```

Add the dependencies to your `pubspec.yaml` in your **Flutter** project.

```yaml
dependencies:
  ...
  serverpod_auth_email_flutter: ^1.x.x
  serverpod_auth_shared_flutter: ^1.x.x
```

### Prebuilt sign in button

The package includes both methods for creating a custom email sign-in form and a pre-made `SignInWithEmailButton` widget. The widget is easy to use, all you have to do is supply the auth client. It handles everything from user signups, login, and password resets for you.

```dart
 SignInWithEmailButton(
  caller: client.modules.auth,
  onSignedIn: () {
    // Optional callback when user successfully signs in
  },
),
```

![SignInWithEmailButton](/img/authentication/providers/email/1-sign-in-with-email-button.png)

### Modal example

The triggered modal will look like this:

![SignInWithEmailDialog](/img/authentication/providers/email/2-auth-email-dialog.png)

## Custom UI with EmailAuthController

The `serverpod_auth_email_flutter` module provides the `EmailAuthController` class, which encapsulates the functionality for email/password authentication. You can use this class and create a custom UI for user registration, login, and password management.

```dart
import 'package:serverpod_auth_email_flutter/serverpod_auth_email_flutter.dart';

final authController = EmailAuthController(client.modules.auth);
```

To let a user signup first call the `createAccountRequest` method which will trigger the backend to send an email to the user with the validation code.

```dart
await authController.createAccountRequest(userName, email, password);
```

Then let the user type in the code and send it to the backend with the `validateAccount` method. This method will create the user and sign them in if the code is valid.

```dart
await authController.validateAccount(email, verificationCode);
```

To let users log in if they already have an account you can use the `signIn` method.

```dart
await authController.signIn(email, password);
```

Finally to let a user reset their password you first initiate a password reset with the `initiatePasswordReset` this will trigger the backend to send a verification email to the user.

```dart
await authController.initiatePasswordReset(email);
```

Let the user type in the verification code along with the new password and send it to the backend with the `resetPassword` method.

```dart
await authController.resetPassword(email, verificationCode, password);
```

After the password has been reset you have to call the `signIn` method to log in. This can be achieved by either letting the user type in the details again or simply chaining the `resetPassword` method and the `singIn` method for a seamless UX.

## Password storage security

Serverpod provides some additional configurable options to provide extra layers of security for stored password hashes.

:::info
By default, the minimum password length is set to 8 characters. If you wish to modify this requirement, you can utilize the properties within AuthConfig.
:::

### Peppering

For an additional layer of security, it is possible to configure a password hash pepper. A pepper is a server-side secret that is added, along with a unique salt, to a password before it is hashed and stored. The pepper makes it harder for an attacker to crack password hashes if they have only gained access to the database.

The [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.

To configure a pepper, set the `emailPasswordPepper` property in the `config/passwords.yaml` file.

```yaml
development:
  emailPasswordPepper: 'your-pepper'
```

 It is essential to keep the pepper secret and never expose it to the client.

:::warning

If the pepper is changed, all passwords in the database will need to be re-hashed with the new pepper.

:::

### Secure random

Serverpod uses the `dart:math` library to generate random salts for password hashing. By default, if no secure random number generator is available, a cryptographically unsecure random number is used.

It is possible to prevent this fallback by setting the `allowUnsecureRandom` property in the `AuthConfig` to `false`. If the `allowUnsecureRandom` property is false, the server will throw an exception if a secure random number generator is unavailable.

```dart
auth.AuthConfig.set(auth.AuthConfig(
  allowUnsecureRandom: false,
));
```

## Custom password hash generator

It is possible to override the default password hash generator. The `AuthConfig` class allows you to provide a custom hash generator using the field `passwordHashGenerator` and a custom hash validator through the field `passwordHashValidator`.

```dart
AuthConfig(
  passwordHashValidator: (
    password,
    email,
    hash, {
      onError,
      onValidationFailure,
    },
  ) {
  // Custom hash validator.
  },
  passwordHashGenerator: (password) {
  // Custom hash generator.
  },
)

```

It could be useful if you already have stored passwords that should be preserved or migrated.

:::warning

Using a custom hash generator will permanently disrupt compatibility with the default hash generator.

:::
