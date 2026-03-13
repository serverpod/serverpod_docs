# Upgrading from `serverpod_auth`

With the release of Serverpod 3.0, the “monolith” `serverpod_auth` package was deprecated and replaced with a set of modular packages providing flexible modules for user management, authentication providers, profiles, and sessions. Switching to the new authentication package enables you to make use of the updated and extended authentication methods (and upcoming ones like Passkeys and magic lines).  
The new package also makes used of the recently introduced support for `UUID` primary key on all its entities. Thus in addition to migrating from the legacy package to the new ones, one also has to update all their own entities which previously referenced the `UserInfo`’s `id`.

For an existing Serverpod application which makes use of `serverpod_auth`[^1] to upgrade to the new packages, there exists the packages `serverpod_auth_migration` to facilitate moving over all authentication- and user-related data into the new modules.  
The package `serverpod_auth_backwards_compatibility` was created to support existing clients with legacy sessions and the migration of social logins and email passwords[^2].

Once the one-time migration is complete, the legacy `serverpod_auth` module and the `serverpod_auth_migration` dependencies can be removed. This will also remove the obsolete tables from the database.
The backwards-compatibility package needs to be kept until all relevant data has been fully migrated.[^3]

ℹ️ The currently provided migration helpers make the following assumptions:

1. That the size of your database is small enough to be migrated in whatever maintenance window you can allot.
2. That clients either get updated immediately (e.g. Flutter Web) or that an update can be forced (for installed apps), in order to align with breaking changes on the API when switching from the legacy to the new endpoints.  \
Clients which update will be able to keep running on their existing session, but clients that do not update won’t work anymore.

As there is no urgency to migrate to the new packages for existing applications, the transition should be carefully planned and tested.

## General timeline

The overall timeline to migrate from `serverpod_auth` to the new modules is given below.

1. Add and configure the new auth modules for the desired providers, e.g. [email](../concepts/authentication/setup_new#email).
2. Add the migration module `serverpod_auth_migration` and configure the migration the server’s `run` method.
3. Update the `authenticationHandler` to use the new `serverpod_auth_session` package.
4. Add the `serverpod_auth_backwards_compatibility` module and connect its helpers in the account login methods.
5. Disable the `serverpod_auth` endpoint.
6. Update the client to only use the new endpoints and the `SessionManager` from `serverpod_auth_session_flutter`. Ensure that `serverpod_auth_client` and `serverpod_auth_shared_flutter` are not used anymore.  
   If deploying to an app store with long lead times, prepare this well in advance, so that new updates / downloads will be able to login and register against the new APIs.
7. Once the updated app is available for users, deploy the backed and force the client to upgrade.
8. Remove the `serverpod_auth_migration` and `serverpod_auth` module from the server.
9. Deploy the server with the legacy and migration dependencies removed.
   For any migrated entities, drop the `int` user ID column and make the new `UUID` auth user ID required
10. Once the backwards compatibility is not needed anymore (because all passwords and sessions have been fully imported into the new module), drop the dependency on `serverpod_auth_backwards_compatibility`

Since the actual data migration in step 5 should only take a few seconds to complete in most cases, it is recommended to already build out the "next" release beforehand, so that you can directly switch to the post-migration version of your backend.

### Detailed Steps

#### Add new authentication modules

Add all desired authentication packages as described [here](../concepts/authentication/setup_new#email). The general flow is always the same:

- Add the dependency
- Configure the package
- Subclass the endpoint in the application’s code to get it exposed
- Make use of the new endpoint from the client

#### Set up the one-time migration

In order to run the migration once with the next deployment of the sever, add a dependency on `serverpod_auth_migration_server` and modify the `run` method as follows:

```dart
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart' show AuthMigrations;

…

void run(final List<String> args) async {
  …
  // Start the server.
  await pod.start();

  // This is how a "one stop" migration could look like
  await AuthMigrations.migrateUsers(
    await pod.createSession(),
    userMigration: (
      final session, {
      required final newAuthUserId,
      required final oldUserId,
      final transaction,
    }) async {
      // Run any custom migration updating the mapping from old to new IDs here.
      // Be sure to run the migration in the `transaction`, so a failure can be fully reverted.
      print('Migrated account $newAuthUserId');
    },
  );
}
```

The `userMigration` parameter shown above is also the place where you should migrate all references to a legacy `UserInfo` `int` id to the new `AuthUser` `UUID` id.

A possible way to upgrade is to add an optional relation to the `AuthUser` (`authUser: module:auth_user:AuthUser?, relation(optional)`) to every entity which currently references `UserInfo` or the user ID. (Beware that you have to configure the `serverpod_auth_user` module in your `config/generator.yaml` for the code generator to find it.)

Inside the callback then find all entities for the currently migrated user and set the `authUserId` for them.

Later in step 9, once the migration has completed, drop the field relating to the legacy `UserInfo` and make the `AuthUser` one required (non-optional) where possible.

#### Switch to the new authentication handler

By default all new auth packages use database-backed sessions from `serverpod_auth_session`.

Replace the `authenticationHandler` in the `Serverpod` instance with the new one like this:

```dart
import 'package:serverpod_auth_email_server/serverpod_auth_email_server.dart'
    show AuthSessions;

void run(final List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    authenticationHandler: AuthSessions.authenticationHandler,
  );
  
  …
}
```

#### Add backwards compatibility to be able to import legacy sessions and passwords

The migration package stores all legacy sessions and password mapped to the new user IDs in a transitional table. But since we can only fully migrate the passwords once the clients send the clear-text one upon login and migrate sessions on a “per use” basis on demand from the client, we need to add the `serverpod_auth_backwards_compatibility_server` module to the server.

This will automatically expose a new endpoint where updated clients can exchange their legacy session for a new one backed by the `serverpod_auth_session` module.

In order to support importing passwords set in the legacy module into the new `serverpod_auth_email_account` one you have to update your email account endpoint subclass to see whether the password can be imported like this:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_backwards_compatibility_server/serverpod_auth_backwards_compatibility_server.dart';
import 'package:serverpod_auth_email_server/serverpod_auth_email_server.dart'
    as email_account;

/// Endpoint for email-based authentication which imports the legacy passwords.
class PasswordImportingEmailAccountEndpoint extends email_account.EmailAccountEndpoint {
  /// Logs in the user and returns a new session.
  ///
  /// In case an expected error occurs, this throws a `EmailAccountLoginException`.
  @override
  Future<email_account.AuthSuccess> login(
    final Session session, {
    required final String email,
    required final String password,
  }) async {
    await AuthBackwardsCompatibility.importLegacyPasswordIfNeeded(
      session,
      email: email,
      password: password,
    );

    return super.login(session, email: email, password: password);
  }

  /// Starts the registration for a new user account with an email-based login associated to it.
  ///
  /// Upon successful completion of this method, an email will have been
  /// sent to [email] with a verification link, which the user must open to complete the registration.
  @override
  Future<void> startRegistration(
    final Session session, {
    required final String email,
    required final String password,
  }) async {
    await AuthBackwardsCompatibility.importLegacyPasswordIfNeeded(
      session,
      email: email,
      password: password,
    );

    return super.startRegistration(session, email: email, password: password);
  }
}
```

This checks on every login and registration request whether the email and password existed in the legacy system, and if the account does not yet have a password set in the new module migrates the previous one over.

#### Disable `serverpod_auth`

The `serverpod_auth` module can not yet be removed from the server’s source code, but nonetheless we should disable its endpoint. This will make sure that for example no new registration take place once the migration is underway.

Update the `AuthConfig` as follows (this likely is done in the `run` method as well:

```dart
import 'package:serverpod_auth_server/serverpod_auth_server.dart' as auth;

auth.AuthConfig.set(
  auth.AuthConfig(
    … // retain all previous configurations
    disableAccountEndpoints: true
  ),
);
```

This prevents any further logins or registrations on the legacy endpoints, so that no new user data is create while the migration is underway.

<!-- TODO: This is fine to cover the auth modules, but the application's own entities could still get created, causing problems in the next deploy/migration.
           So we need to find a complete way to shut down the external API. -->

#### Update the client’s `SessionManager`

The client should drop all dependencies on `serverpod_auth_client` and `serverpod_auth_shared_flutter` and instead make use of the new `SessionManager` from `serverpod_auth_session_flutter` like this:

```dart
import 'package:serverpod_auth_session_flutter/serverpod_auth_session_flutter.dart';
import 'package:serverpod_auth_backwards_compatibility_flutter/serverpod_auth_backwards_compatibility_flutter.dart';

// Ensure the one from `serverpod_auth_session_flutter` is used
final sessionManager = SessionManager();

final client = Client(
  'http://localhost:8080/', // leave this as it's in your app
  authenticationKeyManager: sessionManager,
);

await sessionManager.initAndImportLegacySessionIfNeeded(
  client.modules.serverpod_auth_backwards_compatibility,
  legacyStringGetter: null,
);
```

In case the app was using a custom `Storage` for its session manager, the `legacyStringGetter` would need to be set to point to the correct source. By default it will use `SharedPreferences`, where the legacy package stored the session key.

The `initAndImportLegacySessionIfNeeded` checks whether the session manager does not already have a session attached. If not, then it tries to obtain the previous session key from the legacy module’s storage location. In case it receives one, it’ll exchange the legacy session key for a new session on the server and set that session on the session manager. Returning a new session from the server automatically deletes it from the database, so this can only be done once.  
On subsequent launches, it will detect that a key is present and not attempt any further imports.

#### Release the app update and deploy the server

Once (or in conjunction with, when talking about a Flutter web app) the client application is made available to consumers, deploy the backend and force the clients to update by your preferred means.

Upon first start the server will now run the migration for all entities.

#### Remove the `serverpod_auth_migration` and `serverpod_auth` module from the server

Now the legacy and migration module can be fully removed from the server’s codebase.

Furthermore the database schemas can be updated to drop the old `int` user ID columns, and instead make the new `UUID` columns required wherever the previous `int` ID was mandatory.

#### Final deployment without the legacy tables

Generate the code & migrations, and deploy the server without the legacy modules. This will remove the no-longer-needed tables.

The previous created client is already compatible with this backend, as no further usages of legacy code path should be included.

#### Eventual removal of `serverpod_auth_backwards_compatibility`

As mentioned above, the legacy sessions and email authentication password get migrated upon use. Each session when the user’s client application is started on the new version, and the passwords whenever the user logs in again.

Whenever the migration of such an entity is thus completed, the respective row gets deleted from the compatibility module’s database table. This way the progress can be monitored.

For the sessions is might be appropriate the drop all unused ones after for example 30 days, at which points clients are probably unlikely to update and the session can be deemed abandoned.

Passwords and social login “external user identifiers” should probably be kept around longer, as the whole migration was build in a way that there was no need for the user to log in again.

---

🥳 Congratulations, your server is now up to date with the latest authentication modules and best practices!

[^1]: Which also still works with Serverpod 3.0, if you want to continue using that.

[^2]: As passwords are stored in a secure fashion (hashed, salted, and peppered), they can not be directly moved from the legacy system to the new one. Thus the migration can only happen once a client logs in again, providing the backend with the plain-text password, at which point the migrated authentication method can be updated.

[^3]: The remaining un-migrated data in the backwards compatibility package can be monitored by inspecting the size of the package’s tables.
