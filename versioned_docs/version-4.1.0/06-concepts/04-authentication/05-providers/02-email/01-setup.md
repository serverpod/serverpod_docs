---
sidebar_label: Setup
description: Sign in with Email lets users authenticate with a one-time code or a password, with codes delivered by Serverpod Cloud or your own email provider.
---

# Set up email sign-in

Sign in with Email offers two ways to sign in:

- **One-time code.** The user enters their email and the code sent to it. A new email gets an account.
- **Password.** The user enters their email and password. This is off by default.

Both work for the same account.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Server-side configuration

Newly generated projects already configure the email identity provider in `pod.initializeAuthServices()` in your main `server.dart` file:

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    ServerpodCloudEmailIdpConfig(
      appDisplayName: 'My App',
    ),
  ],
);
```

Set `appDisplayName` to the name recipients should see in the verification emails. In the `development` and `test` run modes the codes are written to the server log instead of being sent, so you can complete the flow locally. In the `staging` and `production` run modes, the codes are sent as email through the Serverpod Cloud email service.

Sending is authenticated with the `scloudAuthEmailKey` password, which Serverpod Cloud sets for you on deploy. The password is read when an email is sent rather than at startup, so a self-hosted server still starts without it, but it cannot deliver any codes. If you host the server yourself, switch to [your own email provider](#use-your-own-email-provider) before you go to staging or production.

If a code cannot be sent, the failure is recorded in the session log and the sign-in flow continues unchanged, so check your [server logs](../../../operations/logging) when a user reports a missing code.

### Expose the endpoints

Newly generated projects already include the email endpoint at `lib/src/auth/email_idp_endpoint.dart` and the migration that initializes the database, so running `serverpod start` is all that is needed.

If you are adding the auth module to an existing project, extend the abstract endpoint yourself. Create the file anywhere under your server's `lib/` directory (for example, `<project>_server/lib/src/endpoints/`). The generator picks it up:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';

class EmailIdpEndpoint extends EmailOtpIdpBaseEndpoint {}
```

Then start the server with `serverpod start` to generate the client code, and create and apply the migration that initializes the database for the provider (in the `serverpod start` terminal, press **M**). More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Use your own email provider

Serverpod Cloud delivery is there to get sign-in working quickly, and it sends a standard message carrying your `appDisplayName`. You might prefer using a custom email provider to have full control over the body, layout, and language of the emails. For servers hosted outside of Serverpod Cloud, it is the only option.

Changing the email provider is done by replacing `ServerpodCloudEmailIdpConfig` with `EmailIdpConfigFromPasswords`, which requires you to pass your own callbacks for sending the codes. One convenient option is the [mailer](https://pub.dev/packages/mailer) package, which can send emails through any SMTP service. Most email providers, such as Resend, SendGrid, or Mandrill, support SMTP.

```dart
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';

import 'src/generated/serverpod.dart';

void run(List<String> args) async {
  final pod = Serverpod(args);

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
    ],
    identityProviderBuilders: [
      // Configure the Email Identity Provider
      // This is the basic configuration for the Email IDP to work.
      EmailIdpConfigFromPasswords(
        // Callback to send the registration verification code to the user.
        sendRegistrationVerificationCode: _sendRegistrationCode,
        // Callback to send the password reset verification code to the user.
        sendPasswordResetVerificationCode: _sendPasswordResetCode,
        // Optional callback to send the one-time sign-in code to the user.
        // Defaults to sendRegistrationVerificationCode if not set.
        sendOtpLoginVerificationCode: _sendOtpLoginCode,
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
  // the user. For testing, we will log the verification code.
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
  // the user. For testing, we will log the verification code.
  session.log('[EmailIDP] Password reset code ($email): $verificationCode');
}

void _sendOtpLoginCode(
  Session session, {
  required String email,
  required UuidValue otpLoginRequestId,
  required String verificationCode,
  required Transaction? transaction,
}) {
  // NOTE: Here you call your mail service to send the sign-in code to the
  // user. For testing, we will log the code.
  session.log('[EmailIDP] Login code ($email): $verificationCode');
}
```

#### Basic configuration options

- `sendRegistrationVerificationCode`: A callback that will be called to send the registration verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendPasswordResetVerificationCode`: A callback that will be called to send the password reset verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendOtpLoginVerificationCode`: An optional callback that will be called to send the one-time sign-in code. If it is not set, the code is sent with `sendRegistrationVerificationCode`. Set it to send a different email for signing in than for registering. A user signing in with a new email also receives this email, since the code is sent before the account is created.

Both configurations hash passwords and verification codes with a secret pepper, which `EmailIdpConfigFromPasswords` reads from the `emailSecretHashPepper` key in `config/passwords.yaml` or the `SERVERPOD_PASSWORD_emailSecretHashPepper` environment variable. Newly generated projects already have a value for every run mode. To pass the pepper directly instead, use `EmailIdpConfig` with its `secretHashPepper` parameter.

For more details on configuration options, such as customizing password requirements, verification code generation, rate limiting, and more, see the [configuration section](./configuration).

## Client-side configuration

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Email identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `EmailOtpSignInWidget` to include email sign-in in your own custom UI.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

EmailOtpSignInWidget(
  client: client,
  // Also let users sign in with a password and reset a forgotten one.
  // Defaults to false.
  allowPasswordSignIn: true,
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
)
```

The widget automatically handles:

- Sending and verifying the one-time code.
- Sign-in to an existing account, or account creation for a new email, with optional terms acceptance.
- Password sign-in and password reset, if `allowPasswordSignIn` is `true`.
- Navigation between screens.

For details on how to display the email authentication UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).

## Switch from password-only sign-in

Projects created before Serverpod 4.1 extend `EmailIdpBaseEndpoint`, which supports password sign-in only. For these projects, the `SignInWidget` shows the `EmailSignInWidget`, where users register with an email and a password. To switch to the `EmailOtpIdpBaseEndpoint`:

1. In your email endpoint file, change the base class to `EmailOtpIdpBaseEndpoint`:

    ```dart
    class EmailIdpEndpoint extends EmailOtpIdpBaseEndpoint {}
    ```

2. Start the server with `serverpod start` to regenerate the client code, then create and apply the migration (in the `serverpod start` terminal, press **M**).
3. If you pass your own `EmailSignInWidget` to the `SignInWidget` as `emailSignInWidget`, replace it with an `EmailOtpSignInWidget` passed as `emailOtpSignInWidget`.

Existing accounts keep working, and users can sign in with a code sent to the email they registered with. To let them keep signing in with their password, set `allowPasswordSignIn: true` on the widget, as shown in [client-side configuration](#client-side-configuration).

:::warning
If you use [your own email provider](#use-your-own-email-provider) and don't set `sendOtpLoginVerificationCode`, sign-in codes are sent with `sendRegistrationVerificationCode`, and a warning is logged the first time this happens. That callback then receives the ID of the sign-in request as its `accountRequestId`, so any links built from it, such as a link to complete the registration, won't work. Set `sendOtpLoginVerificationCode` if your registration emails contain more than the code.
:::
