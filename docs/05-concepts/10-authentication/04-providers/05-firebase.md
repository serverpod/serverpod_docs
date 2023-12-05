# Firebase

Serverpod uses FlutterFire UI to handle authentication through Firebase. It allows you to add social sign-in types that Serverpod doesn't directly support.

To add authentication with Firebase, you must first install and initialize the Firebase CLI tools and Flutter fire. Follow the instructions [here](https://firebase.google.com/docs/flutter/setup?platform=web) for your Flutter project. In the Firebase console, configure the different social sign-ins you plan to use. Then pass your provider configurations to either the signInWithFirebase method or the SignInWithFirebaseButton of the [serverpod_auth_firebase_flutter](https://pub.dev/packages/serverpod_auth_firebase_flutter) package.

Server-side, you need to create a set of authentication keys in the [Firebase console](https://console.firebase.google.com/), download the JSON file, rename it to firebase_service_account_key.json and place it in the config folder.

:::warning

Serverpod automatically merges accounts that are using the same email addresses, so make sure only to allow sign-ins where the email has been verified.

:::
