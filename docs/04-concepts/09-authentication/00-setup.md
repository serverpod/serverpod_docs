# Setup

Serverpod comes with built-in user management and authentication. The recommended way to authenticate users is to use the `serverpod_auth` module. The module makes it easy to authenticate with email or social sign-ins. It is also possible to build a custom authentication integration but that is an advanced use case and won't be necessary for most implementations. Currently supported is Signing in with email, Google, Apple, and Firebase. Future versions of the authentication module will include more options. If you write another authentication module, please consider [contributing](/contribute) your code.

![Sign-in with Serverpod](https://github.com/serverpod/serverpod/raw/main/misc/images/sign-in.png)

## Installing the auth module

Serverpod's auth module makes it easy to authenticate users through email or 3rd parties. The authentication module also handles basic user information, such as user names and profile pictures.

Please refer to the previous section, [Modules](./modules), for in-depth instructions on how to add a module to your project.

## Server setup

Add the module as a dependency to the server projects `pubspec.yaml`

```yaml
dependencies:
  ...
  serverpod_auth: ^1.x.x
```

Add a nickname for the module in the `config/generator.yaml` file. This nickname will be used as the name of the module in the code.

```yaml
modules:
  serverpod_auth:
    nickname: auth
```

Initialize the database tables for the auth module, [get the table definitions](https://github.com/serverpod/serverpod/blob/main/modules/serverpod_auth/serverpod_auth_server/generated/tables.pgsql)

Run the SQL code on your database.

## Client setup

Add the auth client in your client projects `pubspec.yaml`

```yaml
dependencies:
  ...
  serverpod_auth_client: ^1.x.x
```

## App setup

First, add dependencies to your app's `pubspec.yaml` file for the methods of signing in that you want to support. Make sure to use the same version numbers as for Serverpod itself.

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

  // Sets up a singleton client object that can be used to talk to the server
  // from anywhere in our app. The client is generated from your server code.
  // The client is set up to connect to a Serverpod running on a local server on
  // the default port. You will need to modify this to connect to staging or
  // production servers.
  client = Client(
    'http://localhost:8080/',
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

The `SessionManager` has useful methods for viewing and monitoring the user's current state:

- The `signedInUser` will return a `UserInfo` if the user is currently signed in (or `null` if the user isn't signed in).
- Use the `addListener` method to get notified of changes to the user's signed in state.
- Sign out a user by calling the `signOut` method.

For example it can be useful to subscribe to changes in the `SessionManager` and force a rerender of your app.

```dart
@override
void initState() {
  super.initState();

  // Rebuild the page if signed in status changes.
  sessionManager.addListener(() {
    setState(() {});
  });
}
```