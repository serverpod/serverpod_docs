# Setup

Firebase authentication works differently from other identity providers in Serverpod. Instead of handling authentication directly, Serverpod's Firebase integration acts as a bridge between Firebase Authentication and your Serverpod backend. Firebase handles the actual sign-in process through its own SDKs and UI components, while Serverpod syncs the authenticated user and manages the server-side session.

This approach allows you to use any authentication method supported by Firebase (email/password, phone, Google, Apple, Facebook, etc.) while maintaining a unified user system in your Serverpod backend.

:::caution
You need to install the auth module before you continue, see [Setup](../../setup).
:::

## Prerequisites

Before setting up Firebase authentication, ensure you have:

- A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
- Firebase CLI installed (`npm install -g firebase-tools`)
- FlutterFire CLI installed (`dart pub global activate flutterfire_cli`)
- At least one authentication method enabled in your Firebase project

## Create your credentials

### Generate Service Account Key

The server needs service account credentials to verify Firebase ID tokens. To create a new key:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project settings** > **Service accounts**
4. Click **Generate new private key**, then **Generate key**

![Service account](/img/authentication/providers/firebase/1-server-key.png)

This downloads a JSON file containing your service account credentials.

### Enable Authentication Methods

In the Firebase Console, enable the authentication methods you want to support:

1. Go to **Authentication** > **Sign-in method**
2. Enable your desired providers (Email/Password, Phone, Google, Apple, etc.)
3. Configure each provider according to Firebase's documentation

![Auth provider](/img/authentication/providers/firebase/2-auth-provider.png)

## Server-side configuration

### Store the Service Account Key

This can be done by pasting the contents of the JSON file into the `firebaseServiceAccountKey` key in the `config/passwords.yaml` file or setting as value of the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable. Alternatively, you can read the file contents directly using the `FirebaseServiceAccountCredentials.fromJsonFile()` method.

```yaml
development:
  firebaseServiceAccountKey: |
    {
      "type": "service_account",
      "project_id": "your-project-id",
      "private_key_id": "...",
      "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
      "client_id": "...",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token"
    }
```

:::warning
The service account key gives admin access to your Firebase project and should not be version controlled. Store it securely using environment variables or secret management.
:::

### Configure the Firebase Identity Provider

In your main `server.dart` file, configure the Firebase identity provider:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/firebase.dart';

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
      FirebaseIdpConfig(
        credentials: FirebaseServiceAccountCredentials.fromJsonString(
          pod.getPassword('firebaseServiceAccountKey')!,
        ),
      ),
    ],
  );

  await pod.start();
}
```

:::tip
You can use `FirebaseIdpConfigFromPasswords()` to automatically load credentials from `config/passwords.yaml` or the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable:

```dart
identityProviderBuilders: [
  FirebaseIdpConfigFromPasswords(),
],
```

:::

### Expose the Endpoint

Create an endpoint that extends `FirebaseIdpBaseEndpoint` to expose the Firebase authentication API:

```dart
import 'package:serverpod_auth_idp_server/providers/firebase.dart';

class FirebaseIdpEndpoint extends FirebaseIdpBaseEndpoint {}
```

### Generate and Migrate

Run the following commands to generate client code and create the database migration:

```bash
serverpod generate
```

Then create and apply the migration:

```bash
serverpod create-migration
docker compose up --build --detach
dart run bin/main.dart --role maintenance --apply-migrations
```

More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).

### Basic configuration options

- `credentials`: Required. Firebase service account credentials for verifying ID tokens. See the [configuration section](./configuration) for different ways to load credentials.
- `firebaseAccountDetailsValidation`: Optional. Validation function for Firebase account details. By default, this validates that the email is verified when present (phone-only authentication is allowed). See the [configuration section](./configuration#custom-account-validation) for customization options.

## Client-side configuration

### Install Required Packages

Add the Firebase and Serverpod authentication packages to your Flutter project:

```bash
flutter pub add firebase_core firebase_auth serverpod_auth_idp_flutter_firebase
```

If you want to use Firebase's pre-built UI components, also add:

```bash
flutter pub add firebase_ui_auth
```

### Configure FlutterFire

Run the FlutterFire CLI to configure Firebase for your Flutter project:

```bash
flutterfire configure
```

This generates a `firebase_options.dart` file with your platform-specific Firebase configuration.

### Initialize Firebase and Serverpod

In your `main.dart`, initialize both Firebase and the Serverpod client:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:serverpod_flutter/serverpod_flutter.dart';
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';
import 'package:your_client/your_client.dart';
import 'firebase_options.dart';

late Client client;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Create the Serverpod client
  client = Client('http://localhost:8080/')
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  // Initialize Serverpod auth
  await client.auth.initialize();

  // Initialize Firebase sign-in service (enables automatic sign-out sync)
  client.auth.initializeFirebaseSignIn();

  runApp(const MyApp());
}
```

## The authentication flow

Understanding the Firebase authentication flow helps when building custom integrations:

1. **User initiates sign-in** with Firebase using `firebase_auth` or `firebase_ui_auth`
2. **Firebase authenticates** the user and returns a `firebase_auth.User` object
3. **Your app calls** `FirebaseAuthController.login(user)` with the Firebase user
4. **The controller extracts** the Firebase ID token from the user
5. **Token is sent** to your server's `firebaseIdp.login()` endpoint
6. **Server validates** the JWT using the service account credentials
7. **Server creates or updates** the user account and issues a Serverpod session token
8. **Client session is updated** and the user is authenticated with Serverpod

:::info
The `initializeFirebaseSignIn()` call in the client setup automatically signs out from Firebase when the user signs out from Serverpod, keeping both systems in sync.
:::

## Present the authentication UI

### Using FirebaseAuthController

The `FirebaseAuthController` handles syncing Firebase authentication state with your Serverpod backend. After a user signs in with Firebase, pass the Firebase user to the controller:

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';

// Create the controller
final controller = FirebaseAuthController(
  client: client,
  onAuthenticated: () {
    // User successfully synced with Serverpod
    // NOTE: Do not navigate here - use client.auth.authInfoListenable instead
  },
  onError: (error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $error')),
    );
  },
);

// After user signs in with Firebase
final firebaseUser = firebase_auth.FirebaseAuth.instance.currentUser;
if (firebaseUser != null) {
  await controller.login(firebaseUser);
}
```

For details on building custom authentication UIs and integrating with `firebase_ui_auth`, see the [customizing the UI section](./customizing-the-ui).
