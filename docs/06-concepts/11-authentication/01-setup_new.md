# Setup (`serverpod_auth_*`)

Serverpod comes with built-in support for authentication. It is possible to build a [custom authentication implementation](custom-overrides), but the recommended way to authenticate users is to use one of the provided `serverpod_auth_*` modules. The modules make it easy to authenticate with email or social sign-ins and currently supports signing in with email, Google, Apple, and Firebase.

Future versions of the authentication module will include more options. If you write another authentication module, please consider [contributing](/contribute) your code.

We provide the following packages of ready-to-use authentication providers. They all include a basic user profile courtesy of `serverpod_auth_profile`, and session management through `serverpod_auth_session`.

|Package|Functionality|
|-|-|
|`serverpod_auth_email`|Ready-to-use email authentication.|
|`serverpod_auth_apple`|Ready-to-use "Sign in with Apple" authentication.|
|`serverpod_auth_google`|Ready-to-use "Sign in with Google" authentication.|

If you would like the basic authentication offered by these packages, but combine them with a different approach to session management or another kind of user profile have [a look at the underlying packages below](#low-level-building-blocks).

## Sessions

When using any of the "ready-to-use" authentication providers listed above, session management based on `serverpod_auth_session` is already included.

Just follow any of the individual authentication provider guides to set the `AuthSessions`' `authenticationHandler` on your `Serverpod` instance.

## Email

To get started with email-based authentication, add `serverpod_auth_email` to your project. This will add a sign-up flow with email verification, and support logins and session management (through `serverpod_auth_session`). By default, this adds user profiles for each registration through `serverpod_auth_profile`.

The only requirement for using this module is having a way to send out emails, so users can receive the initial verification email and also request a password reset later on.


### Server setup

Add the module as a dependency to the server project's `pubspec.yaml`.

```sh
$ dart pub add serverpod_auth_email_server
```


As the email auth module does not expose any endpoint by default, but rather just an [`abstract` endpoint](../working-with-endpoints#endpoint-method-inheritance), a subclass of the default implementation has to be added to the current project in order to expose its APIs to clients.

For this, add an `email_account_endpoint.dart` file to the project:

```dart
import 'package:serverpod_auth_email_server/serverpod_auth_email_server.dart'
    as email_account;

/// Endpoint for email-based authentication.
class EmailAccountEndpoint extends email_account.EmailAccountEndpoint {}
```

In this `class` `@override`s could be used to augment the default endpoint implementation.

Next, add the authentication handler to the Serverpod instance.

```dart
import 'package:serverpod_auth_email_server/serverpod_auth_email_server.dart';

void run(List<String> args) async {
  var pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    authenticationHandler: AuthSessions.authenticationHandler, // Add this line
  );

  ...
}
```

In order to generate server and client the code for the newly added endpoint, run:

```bash
$ serverpod generate
```

Additionally, the database schema will need to be extended to add new tables for the email accounts. Create a new migration using the `create-migration` command.

```bash
$ serverpod create-migration
```

As the last step, the email authentication package needs to be configured.  
For this set the `EmailAccounts.config` (from package `serverpod_auth_email_account_server`), which contains the business logic used by the endpoint. This configuration should be added before the `await pod.start();` call. Callbacks need to be provided for at least `sendRegistrationVerificationCode` and `sendPasswordResetVerificationCode`, while the rest can be left to their default values.

```dart
import 'package:serverpod_auth_email_server/serverpod_auth_email_server.dart';

  EmailAccounts.config = EmailAccountConfig(
    sendRegistrationVerificationCode: (
      final session, {
      required final email,
      required final accountRequestId,
      required final verificationCode,
      required final transaction,
    }) {
      // Send out actual email with the verification code
    },
    sendPasswordResetVerificationCode: (
      final session, {
      required final email,
      required final passwordResetRequestId,
      required final transaction,
      required final verificationCode,
    }) {
      // Send out actual email with the verification code
    },
);
```

If you're not hosting on Serverpod Cloud, you might consider an email sendout provider like [Mailjet](https://www.mailjet.com/) or [SendGrid](https://sendgrid.com/en-us).

It is up to the application to decide how to use the callbacks. Basically there are 2 primary approaches possible:
- Send out the `verificationCode` and require that the client initiating the request completes the operation (account creation or password reset). In that case the user could copy/paste or retype the (short) verification into a form on the client.
- Alternatively, emails could contain a deep link with both the respective request ID and the verification code, which would then even support them being opened on any device (e.g. on a desktop, even if the original request was made on mobile).

Additionally, update the `passwords.yaml` file to include secrets for both `serverpod_auth_session_sessionKeyHashPepper` and `serverpod_auth_email_account_passwordHashPepper`.  
These should be random and at least 10 characters long. These pepper values must not be changed after the initial deployment of the server, as they are baked into every session key and stored password, and thus a rotation would invalidate previously created credentials.

After a restart of the Serverpod the new endpoints will be usable from the client.

### Client setup

First, add a dependency on `serverpod_auth_session_flutter` to your app's `pubspec.yaml`, to be able to make use of the sessions generated by the newly created email endpoint.

```yaml
dependencies:
  flutter:
    sdk: flutter
  serverpod_flutter: ^3.0.0
  auth_example_client: # You generated client, name may differ
    path: ../auth_example_client
  
  serverpod_auth_session_flutter: ^3.0.0 # Add this line
``` 

Next, add the `SessionManager` to your app, passing it to the generated Serverpod `Client`.

```dart
import 'package:serverpod_auth_session_flutter/serverpod_auth_session_flutter.dart' show SessionManager;

late SessionManager sessionManager;
late Client client;

void main() async {
  // Need to call this as we are using Flutter bindings before runApp is called.
  WidgetsFlutterBinding.ensureInitialized();

  // The session manager keeps track of the signed-in state of the user. You
  // can query it to see if the user is currently signed in and get information
  // about the user.
  sessionManager = SessionManager();
  await sessionManager.init();

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
    authenticationKeyManager: sessionManager,
  )..connectivityMonitor = FlutterConnectivityMonitor();

  runApp(MyApp());
}
```

### User consolidation

<!-- TODO: Explain how to connect with other providers -->
<!-- Other providers should just refer to this section, as the setup will be similar -->

## Low-level building blocks

### Session Management

|Package|Functionality|
|-|-|
|`serverpod_auth_session`|Database-backed session handling, with flexible configuration per session.|
|`serverpod_auth_jwt`|JWT-based session implemented, which can also generate access token with public/private key cryptography to use with 3rd party services.|

### Authentication

The following package provide the core authentication functionality, but without providing a default `Endpoint` base implementation. Thus they can be combined with another session package and include further modification, like for example a custom user profile.

|Package|Functionality|
|-|-|
|`serverpod_auth_email_account`|Basic email authentication.|
|`serverpod_auth_apple_account`|Basic "Sign in with Apple" authentication.|
|`serverpod_auth_google_account`|Basic "Sign in with Google" authentication.|

