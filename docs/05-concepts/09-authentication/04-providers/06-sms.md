# SMS

To properly configure Sign in with SMS, you must connect your Serverpod to an external service that can send the sms. One convenient option is the [twilio](https://pub.dev/packages/twilio) package, which can send sms.

:::caution
You need to install the auth module before you continue, see [Setup](../setup).
:::


## Server-side Configuration

In your main `server.dart` file,  import the `serverpod_auth_server` module, and set up the authentication configuration:

```dart
import 'package:serverpod_auth_server/module.dart' as auth;

auth.AuthConfig.set(auth.AuthConfig(
    sendValidationSMS: (phoneNumber, otp) async {
        // Send the validation sms to the user.
        // Return `true` if the sms was successfully sent, otherwise `false`.
        return true;
    },
));

// Start the Serverpod server.
await pod.start();
```

:::info

For debugging purposes, you can print the validation code to the console. The chat module example does just this. You can view that code [here](https://github.com/serverpod/serverpod/blob/main/examples/chat/chat_server/lib/server.dart).

:::

## Client-side Configuration

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
  serverpod_auth_sms_flutter: ^1.x.x
  serverpod_auth_shared_flutter: ^1.x.x
```

### Prebuilt SignIn Button

The package includes both methods for creating a custom sms sign-in form and a pre-made `SignInWithSMSButton` widget. The widget is easy to use, all you have to do is supply the auth client. It handles everything for you.

```dart
 SignInWithSMSButton(
  caller: client.modules.auth,
  onSignedIn: () {
    // Optional callback when user successfully signs in
  },
),
```

![SignInWithSMSButton](/img/authentication/providers/sms/1-sign-in-with-sms-button.png)

### Modal example

The triggered modal will look like this:

![SignInWithSMSDialog](/img/authentication/providers/sms/2-auth-sms-dialog.png)


## Custom UI with SMSAuthController

The `serverpod_auth_sms_flutter` module provides the `SMSAuthController` class, which encapsulates the functionality for SMS authentication. You can use this class and create a custom UI for user login.

```dart
import 'package:serverpod_auth_sms_flutter/serverpod_auth_sms_flutter.dart';

final authController = SMSAuthController(client.modules.auth);
```

To start a user login first call the `sendSMS` method which will trigger the backend to send an sms to the user with the validation code.

```dart
await authController.sendSMS(phoneNumber);
```

Then let the user type in the code and send it to the backend with the `validateSMS` method. This method will create the user and sign them in if the code is valid.

```dart
await authController.validateSMS(phoneNumber, otp, storedHash);
```
