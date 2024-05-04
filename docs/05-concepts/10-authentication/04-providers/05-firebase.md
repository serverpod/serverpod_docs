# Firebase

Serverpod uses [Firebase UI auth](https://pub.dev/packages/firebase_ui_auth) to handle authentication through Firebase. It allows you to add social sign-in types that Serverpod doesn't directly support.

:::warning

Serverpod automatically merges accounts that are using the same email addresses, so make sure only to allow sign-ins where the email has been verified.

:::

## Server-side Configuration

The server needs the service account credentials for access to your Firebase project. To create a new key go to the [Firebase console](https://console.firebase.google.com/) then navigate to `project settings > service accounts` click on `Generate new private key` and then `Generate key`.

![Service account](/img/authentication/providers/firebase/1-server-key.png)

This will download the JSON file, rename it to `firebase_service_account_key.json` and place it in the `config` folder in your server project. Note that if this file is corrupt or if the name does not follow the convention here the authentication with firebase will fail.

:::danger
The firebase_service_account_key.json file gives admin access to your Firebase project, never store it in version control.
:::

## Client-side Configuration

To add authentication with Firebase, you must first install and initialize the Firebase CLI tools and Flutter fire. Follow the instructions [here](https://firebase.google.com/docs/flutter/setup?platform=web) for your Flutter project.

## Firebase config

The short version:

```bash
flutter pub add firebase_core firebase_auth firebase_ui_auth
```

```bash
flutterfire configure
```

In the Firebase console, configure the different social sign-ins you plan to use, under `Authentication > Sign-in method`.

![Auth provider](/img/authentication/providers/firebase/2-auth-provider.png)

In your `main.dart` in your flutter project add:

```dart
import 'package:firebase_ui_auth/firebase_ui_auth.dart' as firebase;
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

...
void main() async {
  ...
  await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

  firebase.FirebaseUIAuth.configureProviders([
    firebase.PhoneAuthProvider(),
  ]);

  ...
  runApp(const MyApp());
}
```

## Trigger the auth UI with Serverpod

Add the [serverpod_auth_firebase_flutter](https://pub.dev/packages/serverpod_auth_firebase_flutter) package.

```bash
flutter pub add serverpod_auth_firebase_flutter
```

The `SignInWithFirebaseButton` is a convenient button that triggers the sign-in flow and can be used like this:

```dart
SignInWithFirebaseButton(
  caller: client.modules.auth,
  authProviders: [
    firebase.PhoneAuthProvider(),
  ],
  onFailure: () => print('Failed to sign in with Firebase.'),
  onSignedIn: () => print('Signed in with Firebase.'),
)
```

Where `caller` is the Serverpod client you use to talk with the server and `authProviders` a list with the firebase auth providers you want to enable in the UI.

You can also trigger the Firebase auth UI by calling the method `signInWithFirebase` like so:

```dart
await signInWithFirebase(
  context: context, 
  caller: client.modules.auth, 
  authProviders: [
    firebase.PhoneAuthProvider(),
  ],
);
```

Where `context` is your `BuildContext`, `caller` and `authProviders` are the same as for the button. The method returns a nullable [UserInfo](../working-with-users) object, if the object is null the Sign-in failed, if not the Sign-in was successful.
