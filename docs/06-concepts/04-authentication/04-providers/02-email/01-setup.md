---
sidebar_label: Setup
description: Configure email and password authentication, using the built-in delivery for apps deployed to Serverpod Cloud or callbacks for your own email provider.
---

# Set up email sign-in

Email sign-in sends verification codes during registration and password resets. New projects with authentication enabled are set up to have Serverpod Cloud deliver them, which works without configuration once the app is deployed there. Anywhere else, connect your own email provider.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Server-side configuration

The identity provider is registered in `pod.initializeAuthServices()` in your main `server.dart` file. Pick the configuration that matches where the emails are sent from, then expose the endpoints as described below.

### Email delivery on Serverpod Cloud

Newly generated projects come with `ServerpodCloudEmailIdpConfig`, which has Serverpod Cloud deliver the codes for the app deployed there:

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

Set `appDisplayName` to the name recipients should see in the verification emails.

What happens when a code is sent depends on the run mode:

- In `development` and `test`, the registration and password-reset codes are written to the server log and no email is sent. This is how the flow works on your machine.
- In `staging` and `production`, the codes are sent by Serverpod Cloud.

:::warning
This delivery is part of the Serverpod Cloud platform, not a service you can point a server at from elsewhere. It authenticates with an `scloudAuthEmailKey` password that Serverpod Cloud injects into the running instance on deploy, and that key cannot be obtained or set anywhere else. A self-hosted server in `staging` or `production` therefore sends nothing with this configuration, and needs [its own email provider](#a-custom-email-provider) instead.
:::

Because the key is only read at the moment an email is sent, and never at startup, a self-hosted server still starts normally and keeps logging codes in `development` and `test`.

Delivery is best-effort. A missing key, an unavailable service, a timeout, or a rejected request is recorded in the session log and never thrown into the authentication flow. Registration therefore continues to the code-entry screen even when the email never went out, and password-reset responses stay the same either way so they do not reveal whether an address belongs to an account. Check your [server logs](../../../operations/logging) when a user reports a missing code.

The configuration also reads `emailSecretHashPepper` through Serverpod's password system when it is created. New projects ship this value in their run-mode passwords, and Serverpod Cloud provides it as a platform-managed authentication password.

### A custom email provider

Anywhere other than Serverpod Cloud, replace `ServerpodCloudEmailIdpConfig` with `EmailIdpConfigFromPasswords` and send the verification codes through your own service. The [mailer](https://pub.dev/packages/mailer) package, for example, sends email through SMTP services such as Resend, SendGrid, and Mandrill.

Pass your own callbacks for the two code-sending steps:

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
```

The configuration takes these values:

- `emailSecretHashPepper`: Required. `EmailIdpConfigFromPasswords` reads it from the `emailSecretHashPepper` key in `config/passwords.yaml` for each run mode, or from the `SERVERPOD_PASSWORD_emailSecretHashPepper` environment variable. It must be at least 10 characters long, but the [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.
- `sendRegistrationVerificationCode`: A callback that will be called to send the registration verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendPasswordResetVerificationCode`: A callback that will be called to send the password reset verification code to the user. Here you should call the email sending service to send the verification code to the user.

For more details on configuration options, such as customizing password requirements, verification code generation, rate limiting, and more, see the [configuration section](./configuration).

### Email authentication endpoints

Either configuration needs an endpoint that exposes the email authentication routes. Extend the abstract endpoint in a file anywhere under your server's `lib/` directory, for example, `<project>_server/lib/src/endpoints/`:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';

class EmailIdpEndpoint extends EmailIdpBaseEndpoint {}
```

Then, start the server with `serverpod start` to generate the client code, then create and apply the migration that initializes the database for the provider (in the `serverpod start` terminal, press **M**, then **A**). More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

## Client-side configuration

If you have configured the `SignInWidget` as described in the [setup section](../../setup#present-the-authentication-ui), the Email identity provider will be automatically detected and displayed in the sign-in widget.

You can also use the `EmailSignInWidget` to include the email authentication flow in your own custom UI.

```dart
import 'package:serverpod_auth_idp_flutter/serverpod_auth_idp_flutter.dart';

EmailSignInWidget(
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
)
```

The widget automatically handles:

- Login with email and password.
- Registration with terms acceptance and email verification.
- Password reset flow with email verification.
- Navigation between screens.

For details on how to display the email authentication UI in your Flutter app, see the [customizing the UI section](./customizing-the-ui).
