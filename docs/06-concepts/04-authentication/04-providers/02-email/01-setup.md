---
sidebar_label: Setup
description: Sign in with Email lets users authenticate with an email and password. Connect Serverpod to an SMTP service and configure the email identity provider.
---

# Set up email sign-in

Sign in with Email verifies the user's address with a code, both when they register and when they reset their password.

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

Set `appDisplayName` to the name recipients should see in the verification emails. In the `development` and `test` run modes the codes are written to the server log instead of being sent, so you can complete the flow locally. Once the app is deployed to Serverpod Cloud, they are sent as email.

:::info
`ServerpodCloudEmailIdpConfig` sends email only for apps running on Serverpod Cloud, which injects the key it authenticates with on deploy. If you host the server yourself, switch to [your own email provider](#use-your-own-email-provider) before you go to staging or production.
:::

Then extend the abstract endpoint to expose the email authentication routes on the server. Create the file anywhere under your server's `lib/` directory (for example, `<project>_server/lib/src/endpoints/`); the generator picks it up:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';

class EmailIdpEndpoint extends EmailIdpBaseEndpoint {}
```

Then, start the server with `serverpod start` to generate the client code, then create and apply the migration that initializes the database for the provider (in the `serverpod start` terminal, press **M**, then **A**). More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

If a code cannot be sent, the failure is recorded in the session log and the sign-in flow continues unchanged, so check your [server logs](../../../operations/logging) when a user reports a missing code.

### Use your own email provider

Serverpod Cloud delivery is there to get sign-in working quickly, and it sends a standard message carrying your `appDisplayName`. You might prefer using a custom email provider to have full control over the body, layout, and language of the emails. For servers hosted outside of Serverpod Cloud, it is the only option.

Changing the email provider is done by replacing `ServerpodCloudEmailIdpConfig` with `EmailIdpConfig`, which requires you to pass your own callbacks for the two codes. One convenient option is the [mailer](https://pub.dev/packages/mailer) package, which can send emails through any SMTP service. Most email providers, such as Resend, Sendgrid or Mandrill, support SMTP.

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
      EmailIdpConfig(
        // Secret pepper to hash the password and verification code.
        secretHashPepper: pod.getPassword('emailSecretHashPepper')!,
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

#### Basic configuration options

- `secretHashPepper`: Required. A secret pepper used for hashing passwords and verification codes. Must be at least 10 characters long, but the [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.
- `sendRegistrationVerificationCode`: A callback that will be called to send the registration verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendPasswordResetVerificationCode`: A callback that will be called to send the password reset verification code to the user. Here you should call the email sending service to send the verification code to the user.

For more details on configuration options, such as customizing password requirements, verification code generation, rate limiting, and more, see the [configuration section](./configuration).

:::tip
If you are using the `config/passwords.yaml` file or environment variables, you can use the `EmailIdpConfigFromPasswords` constructor to automatically load the secret pepper. It will expect the `emailSecretHashPepper` key or the `SERVERPOD_PASSWORD_emailSecretHashPepper` environment variable to be set with the secret pepper value.
:::

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
