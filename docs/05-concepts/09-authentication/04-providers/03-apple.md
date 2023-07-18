# Apple

Sign-in with Apple, requires that you have a subscription to the [Apple developer program](https://developer.apple.com/programs/), even if you only want to test the feature in development mode.

A comprehensive tutorial covering Sign in with Apple is available [here](https://medium.com/serverpod/integrating-apple-sign-in-with-serverpod-authentication-part-3-f5a49d006800).

:::note
Right now, we have official support for iOS and MacOS for Sign in with Apple.
:::

:::caution
You need to install the auth module before you continue, see [Setup](../setup).
:::

## Server-side Configuration

No extra steps outside installing the auth module are required.

## Client-side Configuration

Add the dependency to your `pubspec.yaml` in your flutter project.

```yaml
dependencies:
  ...
  serverpod_auth_apple_flutter: ^1.x.x
```

### Config

Enable the sign-in with Apple capability in your Xcode project, this is the same type of configuration for your iOS and MacOS projects respectively.

![Add capabilities](/img/authentication/providers/apple/1-xcode-add.png)

![Sign in with Apple](/img/authentication/providers/apple/2-xcode-sign-in-with-apple.png)

### Sign in Button

`serverpod_auth_apple_flutter` package comes with the widget `SignInWithAppleButton` that renders a nice Sign in with Apple button and triggers the native sign-in UI.

```dart
import 'package:serverpod_auth_email_flutter/serverpod_auth_email_flutter.dart';

SignInWithAppleButton(
  caller: client.modules.auth,
);
```

The SignInWithAppleButton widget takes a caller parameter that you pass in the authentication module from your Serverpod client, in this case, client.modules.auth.

![Sign-in button](/img/authentication/providers/apple/3-button.png)

## Extra

The `serverpod_auth_apple_flutter` implements the sign-in logic using [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple). The documentation for this package should in most cases also apply to the Serverpod integration.

_Note that Sign in with Apple may not work on some versions of the Simulator (iOS 13.5 works). This issue doesn't affect real devices._
