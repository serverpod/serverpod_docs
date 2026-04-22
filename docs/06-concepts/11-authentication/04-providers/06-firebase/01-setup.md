# Setup

Firebase authentication lets you use any Firebase sign-in method (email/password, phone, Google, Apple, Facebook, etc.) with your Serverpod backend. Firebase handles the sign-in flow through its own SDKs, while Serverpod syncs the authenticated user and manages the server-side session.

## Get your credentials

### Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Create a project** (or **Add project** if you already have projects).

2. Enter a project name, accept the terms, and click **Continue**.

   ![Enter project name](/img/authentication/providers/firebase/2-project-name.png)

3. Follow the remaining prompts (Google Analytics is optional) and click **Create project**.

### Generate a service account key

The server needs service account credentials to verify Firebase ID tokens.

1. In the Firebase Console, navigate to **Project settings** > **Service accounts**.

   ![Service accounts page](/img/authentication/providers/firebase/4-service-accounts.png)

2. Click **Generate new private key**.

   ![Generate new private key button](/img/authentication/providers/firebase/5-generate-key.png)

3. In the confirmation dialog, click **Generate key**.

   ![Generate key confirmation dialog](/img/authentication/providers/firebase/6-generate-key-confirm.png)

4. A JSON file downloads to your machine. This file contains your service account credentials. You will need it in the next step.

### Enable authentication methods

1. In the Firebase Console sidebar, navigate to **Product categories** > **Security** > **Authentication**.

   ![Navigate to Authentication](/img/authentication/providers/firebase/7-navigate-auth.png)

2. If this is your first time, click **Get started** to enable the Authentication service.

   ![Enable Authentication](/img/authentication/providers/firebase/8-enable-auth.png)

3. Select the **Sign-in method** tab.

4. Click on the provider you want to enable (e.g., **Email/Password**) and toggle it on. Click **Save**.

   ![Enable a sign-in provider](/img/authentication/providers/firebase/9-enable-provider.png)

5. Repeat for each provider you want to support (Phone, Google, Apple, etc.). Configure each provider according to the instructions shown in the Firebase Console.

   ![Sign-in providers list](/img/authentication/providers/firebase/10-sign-in-methods.png)

### Store the service account key

Your server's `config/passwords.yaml` already has `development:`, `staging:`, and `production:` sections from the project template. Add the `firebaseServiceAccountKey` key to the `development:` section using the contents of the JSON file you downloaded:

```yaml
development:
  # ... existing keys (database, redis, serviceSecret, etc.) ...
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

For production, add the same `firebaseServiceAccountKey` entry to the `production:` section of `passwords.yaml`, or set the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable on your production server.

:::warning
**Never commit `config/passwords.yaml` to version control.** It contains your service account key, which gives admin access to your Firebase project. Use environment variables or a secrets manager in production.
:::

:::note
**Carefully maintain correct indentation for YAML block scalars.** The `firebaseServiceAccountKey` block uses a `|`; any indentation error will silently break the JSON, resulting in authentication failures.
:::

## Server-side configuration

### Add the Firebase identity provider

Your server's `server.dart` file (e.g., `my_project_server/lib/server.dart`) should already contain a `pod.initializeAuthServices()` call if your project was created with the Serverpod project template (`serverpod create`). If it's not there, see [Setup](../../setup) first to configure the auth module and JWT settings.

Add the Firebase import and `FirebaseIdpConfigFromPasswords()` to the existing `identityProviderBuilders` list:

```dart
import 'package:serverpod_auth_idp_server/providers/firebase.dart';
```

```dart
pod.initializeAuthServices(
  tokenManagerBuilders: [
    JwtConfigFromPasswords(),
  ],
  identityProviderBuilders: [
    // ... any existing providers (e.g., EmailIdpConfigFromPasswords) ...
    FirebaseIdpConfigFromPasswords(),
  ],
);
```

`FirebaseIdpConfigFromPasswords()` automatically loads the service account key from the `firebaseServiceAccountKey` key in `config/passwords.yaml` (or the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable).

:::tip
If you need more control over how the credentials are loaded, you can use `FirebaseIdpConfig(credentials: FirebaseServiceAccountCredentials.fromJsonString(...))` instead. See the [configuration](./configuration) page for details.
:::

### Create the endpoint

Create a new endpoint file in your server project (e.g., `my_project_server/lib/src/auth/firebase_idp_endpoint.dart`) alongside the existing auth endpoints. Extending the base class registers the sign-in methods with your server so the Flutter client can call them to complete the authentication flow:

```dart
import 'package:serverpod_auth_idp_server/providers/firebase.dart';

class FirebaseIdpEndpoint extends FirebaseIdpBaseEndpoint {}
```

### Generate code and apply migrations

Run the following commands from your server project directory (e.g., `my_project_server/`) to generate client code and apply the database migration:

```bash
serverpod generate
serverpod create-migration
dart run bin/main.dart --apply-migrations
```

:::note
Skipping the migration will cause the server to crash at runtime when the Firebase provider tries to read or write user data. More detailed instructions can be found in the general [identity providers setup section](../../setup#identity-providers-configuration).
:::

## Client-side configuration

### Install required packages

Add the Firebase and Serverpod authentication packages to your Flutter project:

```bash
flutter pub add firebase_core firebase_auth serverpod_auth_idp_flutter_firebase
```

If you want to use Firebase's pre-built UI components, also add:

```bash
flutter pub add firebase_ui_auth
```

### Configure FlutterFire

If you haven't already, install the Firebase CLI and FlutterFire CLI:

```bash
npm install -g firebase-tools
dart pub global activate flutterfire_cli
```

Then run the FlutterFire CLI to configure Firebase for your Flutter project:

```bash
flutterfire configure
```

Select your Firebase project when prompted, and choose the platforms you want to support.

![FlutterFire configure terminal output](/img/authentication/providers/firebase/11-flutterfire-configure.png)

This generates a `firebase_options.dart` file with your platform-specific Firebase configuration.

### Initialize Firebase and Serverpod

In your Flutter app's `main.dart` file (e.g., `my_project_flutter/lib/main.dart`), the template already sets up the `Client`. Initialize both Firebase and the Serverpod auth services:

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

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  client = Client('http://localhost:8080/')
    ..connectivityMonitor = FlutterConnectivityMonitor()
    ..authSessionManager = FlutterAuthSessionManager();

  await client.auth.initialize();

  client.auth.initializeFirebaseSignIn();

  runApp(const MyApp());
}
```

:::info
The `initializeFirebaseSignIn()` call ensures that the user gets automatically signed out from Firebase when signing out from Serverpod, keeping both systems in sync.
:::

## Present the authentication UI

### Using firebase_ui_auth

The easiest way to add Firebase authentication is using the `firebase_ui_auth` package with its pre-built `SignInScreen`. The key integration points are:

- **Two action handlers** for `SignedIn` (returning users) and `UserCreated` (new accounts). Both call `controller.login(user)` to sync the Firebase user with Serverpod.
- **`FirebaseAuthController`** manages the sync between Firebase and Serverpod. The `client` variable is the global Serverpod `Client` instance created in `main.dart`.

```dart
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:firebase_ui_auth/firebase_ui_auth.dart' as firebase_ui;
import 'package:flutter/material.dart';
import 'package:serverpod_auth_idp_flutter_firebase/serverpod_auth_idp_flutter_firebase.dart';

class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  late final FirebaseAuthController controller;

  @override
  void initState() {
    super.initState();
    controller = FirebaseAuthController(
      client: client,
      onError: (error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $error')),
        );
      },
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return firebase_ui.SignInScreen(
      providers: [
        firebase_ui.EmailAuthProvider(),
      ],
      actions: [
        firebase_ui.AuthStateChangeAction<firebase_ui.SignedIn>((context, state) async {
          final user = firebase_auth.FirebaseAuth.instance.currentUser;
          if (user != null) {
            await controller.login(user);
          }
        }),
        firebase_ui.AuthStateChangeAction<firebase_ui.UserCreated>((context, state) async {
          final user = firebase_auth.FirebaseAuth.instance.currentUser;
          if (user != null) {
            await controller.login(user);
          }
        }),
      ],
    );
  }
}
```

For details on using the `FirebaseAuthController` directly and building custom authentication UIs, see the [customizing the UI section](./customizing-the-ui).

:::tip
If you run into issues, see the [troubleshooting guide](./troubleshooting).
:::

## Publishing to production

Before going live, complete the following steps:

### 1. Store the production credentials

Add the `firebaseServiceAccountKey` entry to the `production:` section of `config/passwords.yaml`:

```yaml
production:
  # ... existing keys ...
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

Alternatively, set the `SERVERPOD_PASSWORD_firebaseServiceAccountKey` environment variable on your production server with the same JSON value.

### 2. Update Firebase project settings

Ensure your Firebase project's authorized domains include your production domain. In the Firebase Console, navigate to **Authentication** > **Settings** > **Authorized domains** and add your production domain (e.g., `my-awesome-project.serverpod.space`).

### 3. Review authentication providers

Verify that all sign-in providers you plan to use in production are enabled and properly configured in the Firebase Console under **Authentication** > **Sign-in method**. Some providers (e.g., Google, Apple) require additional configuration for production domains.
