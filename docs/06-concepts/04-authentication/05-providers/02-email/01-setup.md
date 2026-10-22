---
sidebar_label: Setup
description: Sign in with Email lets users authenticate with a one-time code or a password, with codes delivered by Serverpod Cloud or your own email provider.
---

# Set up email sign-in

Sign in with Email supports two flows:

- **Passwordless sign-in.** The user enters their email and receives a one-time code. Entering the code signs them in, or creates an account if there is none for the email yet. New projects use this flow.
- **Password sign-in.** The user registers with an email and a password, and signs in with them. A code sent by email verifies the address on registration and on password reset.

Both flows share the same accounts, and passwordless sign-in can optionally let users sign in with a password too.

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

For password sign-in only, extend `EmailIdpBaseEndpoint` instead.

Then start the server with `serverpod start` to generate the client code, and create and apply the migration that initializes the database for the provider (in the `serverpod start` terminal, press **M**). More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

#### Switch an existing project to passwordless sign-in

Projects created before Serverpod 4.1 extend `EmailIdpBaseEndpoint` and use password sign-in. To switch to passwordless sign-in:

1. In your email endpoint file, change the base class to `EmailOtpIdpBaseEndpoint`:

    ```dart
    class EmailIdpEndpoint extends EmailOtpIdpBaseEndpoint {}
    ```

2. Start the server with `serverpod start` to regenerate the client code, then create and apply the migration (in the `serverpod start` terminal, press **M**).
3. If you use [your own email provider](#use-your-own-email-provider), add a `sendOtpLoginVerificationCode` callback.

Existing accounts keep working, and users who registered with a password can sign in with a code sent to the same email. To keep password sign-in available in the app as well, set `allowPasswordSignIn: true` on the widget, as shown in [client-side configuration](#client-side-configuration).

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
        // Callback to send the one-time sign-in code to the user.
        sendOtpLoginVerificationCode: _sendOtpLoginCode,
        // Callback to send the registration verification code to the user.
        sendRegistrationVerificationCode: _sendRegistrationCode,
        // Callback to send the password reset verification code to the user.
        sendPasswordResetVerificationCode: _sendPasswordResetCode,
      ),
    ],
  );

  await pod.start();
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
```

#### Basic configuration options

- `sendOtpLoginVerificationCode`: A callback that will be called to send the one-time code for passwordless sign-in. It is called whether or not the email already has an account, so write the email to work for both signing in and creating an account.
- `sendRegistrationVerificationCode`: A callback that will be called to send the registration verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendPasswordResetVerificationCode`: A callback that will be called to send the password reset verification code to the user. Here you should call the email sending service to send the verification code to the user.

:::warning
If you don't set `sendOtpLoginVerificationCode`, sign-in codes are sent through `sendRegistrationVerificationCode` instead, and a warning is logged the first time this happens. That callback then receives the ID of the sign-in request as its `accountRequestId`, so any links built from it, such as a link to complete the registration, won't work. Set `sendOtpLoginVerificationCode` if your registration emails contain more than the code. If neither callback is set, requesting a code fails with a `StateError`.
:::

Both configurations hash passwords and verification codes with a secret pepper, which `EmailIdpConfigFromPasswords` reads from the `emailSecretHashPepper` key in `config/passwords.yaml` or the `SERVERPOD_PASSWORD_emailSecretHashPepper` environment variable. Newly generated projects already have a value for every run mode. To pass the pepper directly instead, use `EmailIdpConfig` with its `secretHashPepper` parameter.

For more details on configuration options, such as customizing password requirements, verification code generation, rate limiting, and more, see the [configuration section](./configuration).

## Client-side configuration

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Email identity provider will be automatically detected and displayed in the sign-in widget. It shows passwordless sign-in when your endpoint extends `EmailOtpIdpBaseEndpoint`, and password sign-in when it extends `EmailIdpBaseEndpoint`.

You can also use the `EmailOtpSignInWidget` to include passwordless sign-in in your own custom UI.

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
- Sign-in to an existing account, or account creation with terms acceptance for a new email.
- Password sign-in and password reset, if `allowPasswordSignIn` is `true`.
- Navigation between screens.

For password sign-in, use the `EmailSignInWidget` with the same `client`, `onAuthenticated`, and `onError` parameters. It handles login with email and password, registration with email verification, and password reset.

For details on how to display the email authentication UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).
