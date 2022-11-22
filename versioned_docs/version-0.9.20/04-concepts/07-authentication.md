# Authentication
In Serverpod, authentication is managed through the `serverpod_auth` module. It makes it easy to authenticate users through email or 3rd parties. Currently supported is Signing in with email, Google, and Apple. Future versions of the authentication module will include more options. Using this module requires some setup with Google and Apple for things to work.

The authentication module also handles basic user information, such as user names and profile pictures.

![Sign-in with Serverpod](https://github.com/serverpod/serverpod/raw/main/misc/images/sign-in.png)

## Installing the module
Please refer to the previous section, [Modules](./modules), for instructions on how to add a module to your project.

## Setting up Sign in with Email
To properly configure Sign in with Email, you must connect your Serverpod to an external service that can send the emails. One convenient option is the [mailer](https://pub.dev/packages/mailer)](https://pub.dev/packages/mailer) package, which can send emails through any SMTP service. Most email providers, such as Sendgrid or Mandrill, support SMTP.

In your main `server.dart` file, you can configure the auth module. First, make sure to include the module:

```dart
import 'package:serverpod_auth_server/module.dart' as auth;
```

Then, add the configuration before you start your Serverpod:

```dart
auth.AuthConfig.set(auth.AuthConfig(
  sendValidationEmail: (session, email, validationCode) async {
    // Send your validation email here.
  },
  sendPasswordResetEmail: (session, userInfo, validationCode) async {
    // Send a password reset email here.
  },
));

// Start the server.
await pod.start();
```
:::info

For debugging purposes, you can print the validation code to the console. The chat module example does just this. You can view that code [here](https://github.com/serverpod/serverpod/blob/main/examples/chat/chat_server/lib/server.dart).

:::




## Setting up Sign in with Google
To set up Sign in with Google, you will need a Google account for your organization and set up a new project. For the project, you need to set up _Credentials_ and _Oauth consent screen_. You will need an OAuth 2.0 Client id of type _Web application_.

1. Follow the instructions in the [google_sign_in](https://pub.dev/packages/google_sign_in) plug-in for iOS and Android.
   - For iOS, make sure that you obtain the `GoogleService-Info.plist` and add it to your Xcode project.
   - For Android, there are other setup steps you need to take.
2. In Google cloud, you need to do some additional setup.
   - Activate the _People API_ on your project.
   - Set up the OAuth consent screen. You must add the `../auth/userinfo.email` and `../auth/userinfo.profile` scopes. You can also set up additional scopes and access them through Google's APIs on the client or server side.
3. Finally, you need to set up the Google client secret so your server can authenticate the user with Google. In GCP's _APIs & Services_, select the _Credentials tab_. Download the JSON from your _OAuth 2.0 Client IDs_. Rename it to `google_client_secret.json` and place it in the `config` directory of your server.

## Setting up Sign in with Apple
You will need an Apple developer account to configure Sign in with Apple. Follow the instructions in [sign_in_with_apple](https://pub.dev/packages/sign_in_with_apple).

_Note that Sign in with Apple may not work on some versions of the Simulator (iOS 13.5 works). This issue doesn't affect real devices._

## Setting up Sign in with Firebase
Serverpod uses FlutterFire UI to handle authentication through Firebase. It allows you to add social sign-in types that Serverpod doesn't directly support.

To add authentication with Firebase, you must first install and initialize the Firebase CLI tools and Flutter fire. Follow the instructions [here](https://firebase.google.com/docs/flutter/setup?platform=web) for your Flutter project. In the Firebase console, configure the different social sign-ins you plan to use. Then pass your provider configurations to either the signInWithFirebase method or the SignInWithFirebaseButton of the [serverpod_auth_firebase_flutter](https://pub.dev/packages/serverpod_auth_firebase_flutter) package.

Server-side, you need to create a set of authentication keys in the [Firebase console](https://console.firebase.google.com/), download the JSON file, rename it to firebase_service_account_key.json and place it in the config folder.

:::warning

Serverpod automatically merges accounts that are using the same email addresses, so make sure only to allow sign-ins where the email has been verified.

:::

## Add sign-in buttons in your code
First, you need to add dependencies to your app's `pubspec.yaml` file for the methods of signing in that you want to support. Make sure to use the same version numbers as for serverpod itself.

```yaml
dependencies:
  flutter:
    sdk: flutter
  example_client:
    path: ../example_client
  serverpod_auth_google_flutter: ^0.9.5
  serverpod_auth_apple_flutter: ^0.9.5
```

Next, you need to set up a `SessionManager`, which keeps track of the user's state. It will also handle the authentication keys passed to the client from the server, upload user profile images, etc.

```dart
void main() async {
  // Need to call this as we are using Flutter bindings before runApp is called.
  WidgetsFlutterBinding.ensureInitialized();

  // Sets up a singleton client object that can be used to talk to the server
  // from anywhere in our app. The client is generated from your server code.
  // The client is set up to connect to a Serverpod running on a local server on
  // the default port. You will need to modify this to connect to staging or
  // production servers.
  client = Client(
    'http://localhost:8080/',
    authenticationKeyManager: FlutterAuthenticationKeyManager(),
  );

  // The session manager keeps track of the signed-in state of the user. You
  // can query it to see if the user is currently signed in and get information
  // about the user.
  sessionManager = SessionManager(
    caller: client.modules.auth,
  );
  await sessionManager.initialize();

  runApp(MyApp());
}
```

Now, you can simply add the sign-in buttons to your code.

```dart
SignInWithGoogleButton(
  caller: client.modules.auth,
  onSignedIn: () { ... handle sign in here ... },
  onFailure: () { ... handle fail to sign in here ... },
)
```


This is a complete example of a sign-in dialog: [sign_in_dialog.dart](https://github.com/serverpod/serverpod/blob/main/packages/serverpod/example/example_flutter/lib/src/sign_in_dialog.dart).

## Displaying or editing user images
The module has built-in methods for handling a user's basic settings, including uploading new profile pictures.

![UserImageButton](https://github.com/serverpod/serverpod/raw/main/misc/images/user-image-button.png)

To display a user's profile picture, use the `CircularUserImage` widget and pass a `UserInfo` retrieved from the `SessionManager`.

To edit a user profile image, use the `UserImageButton` widget. It will automatically fetch the signed-in user's profile picture and communicate with the server.

## Supported authentication methods

Currently, sign-in with Google, Apple, Firebase, and email is natively supported. If you write another authentication module, please consider [contributing](/contribute) your code.
