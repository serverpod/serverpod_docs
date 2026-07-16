---
sidebar_label: Setup
description: Configure email and password authentication with Serverpod Cloud's email delivery or callbacks for your own email provider.
---

# Set up email sign-in

Email sign-in sends verification codes during registration and password resets. New projects with authentication enabled are configured to use Serverpod Cloud's email service. You can replace it with your own email provider when self-hosting or when you need custom delivery.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Server-side configuration

### Use Serverpod Cloud email delivery

Newly generated projects add `ServerpodCloudEmailIdpConfig` to `pod.initializeAuthServices()` in `server.dart`:

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

Set `appDisplayName` to the application name recipients should see in the verification emails. It can contain up to 64 characters.

The delivery behavior depends on the server's run mode:

- In `development` and `test`, Serverpod writes registration and password-reset codes to the server log instead of sending email.
- In `staging` and `production`, Serverpod sends the codes through the Serverpod Cloud transactional email service.

When you deploy to Serverpod Cloud, the platform automatically injects the `scloudAuthEmailKey` password used by the email service. The configuration reads this password only when it sends an email. This lazy lookup means a self-hosted server can still start when the password is absent. Development and test continue to log codes without it. For self-hosted staging and production environments, replace the configuration with your own email provider.

Delivery is best-effort. If the key is missing, the service is unavailable, a request times out, or the service rejects a request, the email callback records an error in the Serverpod session log and does not throw it to the authentication flow. Check your [server logs](../../../operations/logging) if a user does not receive a code. Registration may continue to the code-entry screen even when delivery fails. Password-reset responses also remain unchanged so they do not reveal whether an email address belongs to an account.

`ServerpodCloudEmailIdpConfig` also reads `emailSecretHashPepper` through Serverpod's password system when it is created. New local projects include this value in their run-mode passwords, and Serverpod Cloud provides it as a platform-managed authentication password.

### Use a custom email provider

Replace `ServerpodCloudEmailIdpConfig` with `EmailIdpConfigFromPasswords` when you want to send verification codes through your own service. For example, the [mailer](https://pub.dev/packages/mailer) package can send email through SMTP services such as Resend, SendGrid, and Mandrill.

Configure the callbacks in your main `server.dart` file:

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

Both configurations require an endpoint that exposes the email authentication routes. Extend the abstract endpoint in a file anywhere under your server's `lib/` directory, for example, `<project>_server/lib/src/endpoints/`:

```dart
import 'package:serverpod_auth_idp_server/providers/email.dart';

class EmailIdpEndpoint extends EmailIdpBaseEndpoint {}
```

Then, start the server with `serverpod start` to generate the client code, then create and apply the migration that initializes the database for the provider (in the `serverpod start` terminal, press **M**, then **A**). More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Configure a custom provider

- `emailSecretHashPepper`: Required by `EmailIdpConfigFromPasswords`. Add this password to `config/passwords.yaml` for each run mode or supply it through the `SERVERPOD_PASSWORD_emailSecretHashPepper` environment variable. It must be at least 10 characters long, but the [recommended pepper length](https://www.ietf.org/archive/id/draft-ietf-kitten-password-storage-04.html#name-storage-2) is 32 bytes.
- `sendRegistrationVerificationCode`: A callback that will be called to send the registration verification code to the user. Here you should call the email sending service to send the verification code to the user.
- `sendPasswordResetVerificationCode`: A callback that will be called to send the password reset verification code to the user. Here you should call the email sending service to send the verification code to the user.

For more details on configuration options, such as customizing password requirements, verification code generation, rate limiting, and more, see the [configuration section](./configuration).

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
