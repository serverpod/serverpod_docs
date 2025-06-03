# Setup

Serverpod comes with built-in user management and authentication. It is possible to build a [custom authentication implementation](custom-overrides), but the recommended way to authenticate users is to use the `serverpod_auth` module. The module makes it easy to authenticate with email or social sign-ins and currently supports signing in with email, Google, Apple, and Firebase.

Future versions of the authentication module will include more options. If you write another authentication module, please consider [contributing](/contribute) your code.

![Sign-in with Serverpod](https://github.com/serverpod/serverpod/raw/main/misc/images/sign-in.png)

## Installing the auth module

Serverpod's auth module makes it easy to authenticate users through email or 3rd parties. The authentication module also handles basic user information, such as user names and profile pictures. Make sure to use the same version numbers as for Serverpod itself for all dependencies.

## Server setup

Add the module as a dependency to the server project's `pubspec.yaml`.

```sh
$ dart pub add serverpod_auth_server
```

Add the authentication handler to the Serverpod instance.

```dart
import 'package:serverpod_auth_server/serverpod_auth_server.dart' as auth;

void run(List<String> args) async {
  var pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    authenticationHandler: auth.authenticationHandler, // Add this line
  );

  ...
}
```
Optionally, add a nickname for the module in the `config/generator.yaml` file. This nickname will be used as the name of the module in the code.

```yaml
modules:
  serverpod_auth:
    nickname: auth
```

While still in the server project, generate the client code and endpoint methods for the auth module by running the `serverpod generate` command line tool.

```bash
$ serverpod generate
```

### Initialize the auth database

After adding the module to the server project, you need to initialize the database. First you have to create a new migration that includes the auth module tables. This is done by running the `serverpod create-migration` command line tool in the server project.

```bash
$ serverpod create-migration
```

Start your database container from the server project.

```bash
$ docker compose up --build --detach
```

Then apply the migration by starting the server with the `apply-migrations` flag.

```bash
$ dart run bin/main.dart --role maintenance --apply-migrations
```

The full migration instructions can be found in the [migration guide](../database/migrations).

### Configure Authentication
Serverpod's auth module comes with a default Authentication Configuration. To customize it, go to your main `server.dart` file, import the `serverpod_auth_server` module and set up the authentication configuration:


```dart
import 'package:serverpod_auth_server/module.dart' as auth;  
  
void run(List<String> args) async {

  auth.AuthConfig.set(auth.AuthConfig(  
    minPasswordLength: 12,
  ));  
    
  // Start the Serverpod server.  
  await pod.start();
}

```

| **Property**                         | **Description**                                                                                                                                                                                                                                                   |        **Default**         |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------: |
| **allowUnsecureRandom**              | True if unsecure random number generation is allowed. If set to false, an error will be thrown if the platform does not support secure random number generation.                                                                                                  |           false            |
| **emailSignInFailureResetTime**      | The reset period for email sign in attempts. Defaults to 5 minutes.                                                                                                                                                                                               |            5min            |
| **enableUserImages**                 | True if user images are enabled.                                                                                                                                                                                                                                  |            true            |
| **extraSaltyHash**                   | True if the server should use the accounts email address as part of the salt when storing password hashes (strongly recommended).                                                                                                                                 |            true            |
| **firebaseServiceAccountKeyJson**    | Firebase service account key JSON file. Generate and download from the Firebase console.                                                                                                                                                                          |             -              |
| **importUserImagesFromGoogleSignIn** | True if user images should be imported when signing in with Google.                                                                                                                                                                                               |            true            |
| **legacyUserSignOutBehavior**        | Defines the default behavior for the deprecated `signOut` method used in the status endpoint. This setting controls whether users are signed out from all active devices (`SignOutOption.allDevices`) or just the current device (`SignOutOption.currentDevice`). | `SignOutOption.allDevices` |
| **maxAllowedEmailSignInAttempts**    | Max allowed failed email sign in attempts within the reset period.                                                                                                                                                                                                |             5              |
| **maxPasswordLength**                | The maximum length of passwords when signing up with email.                                                                                                                                                                                                       |            128             |
| **minPasswordLength**                | The minimum length of passwords when signing up with email.                                                                                                                                                                                                       |             8              |
| **onUserCreated**                    | Called after a user has been created. Listen to this callback if you need to do additional setup.                                                                                                                                                                 |             -              |
| **onUserUpdated**                    | Called whenever a user has been updated. This can be when the user name is changed or if the user uploads a new profile picture.                                                                                                                                  |             -              |
| **onUserWillBeCreated**              | Called when a user is about to be created, gives a chance to abort the creation by returning false.                                                                                                                                                               |             -              |
| **passwordResetExpirationTime**      | The time for password resets to be valid.                                                                                                                                                                                                                         |            24h             |
| **sendPasswordResetEmail**           | Called when a user should be sent a reset code by email.                                                                                                                                                                                                          |             -              |
| **sendValidationEmail**              | Called when a user should be sent a validation code on account setup.                                                                                                                                                                                             |             -              |
| **userCanEditFullName**              | True if users can edit their full name.                                                                                                                                                                                                                           |           false            |
| **userCanEditUserImage**             | True if users can update their profile images.                                                                                                                                                                                                                    |            true            |
| **userCanEditUserName**              | True if users can edit their user names.                                                                                                                                                                                                                          |            true            |
| **userCanSeeFullName**               | True if users can view their full name.                                                                                                                                                                                                                           |            true            |
| **userCanSeeUserName**               | True if users can view their user name.                                                                                                                                                                                                                           |            true            |
| **userImageFormat**                  | The format used to store user images.                                                                                                                                                                                                                             |            jpg             |
| **userImageGenerator**               | Generator used to produce default user images.                                                                                                                                                                                                                    |             -              |
| **userImageQuality**                 | The quality setting for images if JPG format is used.                                                                                                                                                                                                             |             70             |
| **userImageSize**                    | The size of user images.                                                                                                                                                                                                                                          |            256             |
| **userInfoCacheLifetime**            | The duration which user infos are cached locally in the server.                                                                                                                                                                                                   |            1min            |
| **validationCodeLength**             | The length of the validation code used in the authentication process. This value determines the number of digits in the validation code. Setting this value to less than 3 reduces security.                                                                      |             8              |

## Client setup

Add the auth client in your client project's `pubspec.yaml`.

```yaml
dependencies:
  ...
  serverpod_auth_client: ^1.x.x
```

## App setup

First, add dependencies to your app's `pubspec.yaml` file for the methods of signing in that you want to support.

```yaml
dependencies:
  flutter:
    sdk: flutter
  serverpod_flutter: ^1.x.x
  auth_example_client:
    path: ../auth_example_client
  
  serverpod_auth_shared_flutter: ^1.x.x
```

Next, you need to set up a `SessionManager`, which keeps track of the user's state. It will also handle the authentication keys passed to the client from the server, upload user profile images, etc.

```dart
late SessionManager sessionManager;
late Client client;

void main() async {
  // Need to call this as we are using Flutter bindings before runApp is called.
  WidgetsFlutterBinding.ensureInitialized();

  // The android emulator does not have access to the localhost of the machine.
  // const ipAddress = '10.0.2.2'; // Android emulator ip for the host

  // On a real device replace the ipAddress with the IP address of your computer.
  const ipAddress = 'localhost';

  // Sets up a singleton client object that can be used to talk to the server from
  // anywhere in our app. The client is generated from your server code.
  // The client is set up to connect to a Serverpod running on a local server on
  // the default port. You will need to modify this to connect to staging or
  // production servers.
  client = Client(
    'http://$ipAddress:8080/',
    authenticationKeyManager: FlutterAuthenticationKeyManager(),
  )..connectivityMonitor = FlutterConnectivityMonitor();

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

The `SessionManager` has useful methods for viewing and monitoring the user's current state.

#### Check authentication state
To check if the user is signed in:

```dart
sessionManager.isSignedIn;
```
Returns `true` if the user is signed in, or `false` otherwise.

#### Access current user
To retrieve information about the current user:

```dart
sessionManager.signedInUser;
```
Returns a `UserInfo` object if the user is currently signed in, or `null` if the user is not.

#### Register authentication
To register a signed in user in the session manager:

```dart
await sessionManager.registerSignedInUser(
  userInfo,
  keyId,
  authKey,
);
```
This will persist the user information and refresh any open streaming connection, see [Custom Providers - Client Setup](providers/custom-providers#client-setup) for more details.

#### Monitor authentication changes
To add a listener that tracks changes in the user's authentication state, useful for updating the UI:

```dart
@override
void initState() {
  super.initState();
  
  // Rebuild the page if authentication state changes.
  sessionManager.addListener(() {
    setState(() {});
  });
}
```
The listener is triggered whenever the user's sign-in state changes.

#### Sign out current device
To sign the user out on from the current device:

```dart
await sessionManager.signOutDevice();
```
Returns `true` if the sign-out is successful, or `false` if it fails.

#### Sign out all devices
To sign the user out across all devices:

```dart
await sessionManager.signOutAllDevices();
```
Returns `true` if the user is successfully signed out from all devices, or `false` if it fails.


:::info

The `signOut` method is deprecated. This method calls the deprecated `signOut` status endpoint. For additional details, see the [deprecated signout endpoint](basics#sign-out-all-devices) section. Use `signOutDevice` or `signOutAllDevices` instead.

```dart
await sessionManager.signOut();  // Deprecated
```
::: 
