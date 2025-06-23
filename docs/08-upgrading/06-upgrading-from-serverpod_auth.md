# Upgrading from `serverpod_auth` (in one go)

With the release of Serverpod 3.0, the single legacy `serverpod_auth` package was replaced with a set of modular packages providing flexible modules for users, authentication providers, profiles, and session management.

For an existing Serverpod application which makes use of `serverpod_auth`[^1] to upgrade to the new packages, there exists the packages `serverpod_auth_migration` to facilitate moving over all authentication- and user-related data into the new modules.  
The package `serverpod_auth_backwards_compatibility` was created to support existing clients with legacy sessions and the migration of social logins and email passwords[^2].

Once the one-time migration is complete, the legacy `serverpod_auth` module and the `serverpod_auth_migration` dependencies can be removed. This will also remove the then obsolete tables from the database.
The backwards compatibility needs to kept until all (or all relevant) data has been fully migrated.

Due to the modular approach, each used authentication provider (email, Apple, Google, etc.) needs to be configured individually for the migration.  
No matter through which authentication provider(s) a user is migrated, their profile will always be migrated as well by default.

## General timeline

The overall timeline to migrate from `serverpod_auth` to the new modules generally looks like this:

1. Add and configure the new auth modules for the desired providers, e.g. [email](../concepts/authentication/setup_new#email).
2. Add the migration module `serverpod_auth_migration` and configure the migration your `run` method
3. Update the `authenticationHandler` to support both legacy (migrated) and new sessions
4. Set up the `serverpod_auth_backwards_compatibility` in your email and social account endpoints
<!-- Since `serverpod_auth` is going to get broken with the next deploy in a few seconds, 
     we should probably disable it already at this point. Else the developer needs to use the other guide. -->
4. Release client working against the new endpoints, make sure the legacy `serverpod_auth` ones will not be used anymore  
   If deploying to an app store with long lead times, prepare this well in advance, so that new updates / downloads will be able to login and register against the new APIs.
5. Start the server and run the migration to finish
6. Remove the `serverpod_auth_migration` and `serverpod_auth` module  
   ⚠️ This will remove the ability to login or register through the old endpoints. If this is a problem for your application, see the [guide for a continuous migration].
   <!-- TODO: The old `SessionManger` might to a check which then fails. Ensure that the user does not get logged out because of that -> 'serverpod_auth.status.getUserInfo' will cause issues here -->
7. Deploy the server with the legacy and migration dependencies removed  
   For any migrated entities, drop the `int` user ID column and make the new `UUID` auth user ID required
   <!-- TODO: Probably the `int` column needs to be kept around (and the other stay optional),
              in order to support old clients adding new data? -->
8. Once the backwards compatibility is not needed anymore (because all passwords have been imported and the legacy session are not in use anymore), drop the dependency on `serverpod_auth_backwards_compatibility`

Since the actual data migration in step 5 should only take a few seconds to complete in most cases, it is recommended to already build out the "next" release beforehand, so that you can directly switch to the post-migration version of your backend. This then also ensures the final version works properly and that no further entities are created against in `serverpod_auth`, which would then not be migrated anymore.

## Sessions

In order to support both sessions created by the legacy `serverpod_auth` and through the new `serverpod_auth_session` package, the `authenticationHandler` has to be updated to try both of them.  
Since an invalid/unknown session key just yields a `null` result, they can be chained like this:

```dart
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart' show AuthMigrations;


final pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  authenticationHandler: AuthMigrations.authenticationHandler
);


// … 

AuthMigrations.config = AuthMigrationConfig(
  userMigrationHook: (
    final session, {
    required final newAuthUserId,
    required final oldUserId,
    final transaction,
  }) async {
    // Run any custom migration updating the mapping from old to new IDs here.
    // ignore: avoid_print
    print('Migrated account $newAuthUserId');
  },
);

// Start the server.
await pod.start();

// This is how a "one stop" migration could look like

await AuthMigrations.migrateUsers(
  await pod.createSession(),
  customUserMigration: (
    final session, {
    required final newAuthUserId,
    required final oldUserId,
    required final transaction,
  }) async {
    // Run any custom migration updating the mapping from old to new IDs here.
    // Be sure to run the migration in the `transaction`, so a failure can be fully reverted.
    print('Migrated account $newAuthUserId');
  },
);
```

All high-level authentication provider packages use `serverpod_auth_session` under the hood, and only a single handler needs to be registered to support all of them.

## User ID Migration

The `userMigrationHook` shown above is also the place where you should migraten all references to a legacy `UserInfo` id to the new `AuthUser` `UUID`.

A possible way to upgrade with this hook is to add an optional relation to the `AuthUser` (`authUser: module:auth_user:AuthUser?, relation(optional)`) to every entity which currently references `UserInfo` or the user ID.

Inside the hook then find all entities for the currently migration user and set the `authUserId` for them.

Once the migration has completed, drop the field relating to the legacy `UserInfo` and make the `AuthUser` one required (non-optional) if possible.

Then complete the migration by deploying the updated schema, dropping the legacy columns.

## Email passwords and social logins

Unfortunately the migration can not migrate email passwords or social logins automatically.

The storage of passwords changed between the modules, and thus they need to be written anew in the database. Since the plain text password is only available upon login, we have to migrate them at that point if the credentials are valid in the old system and the user does not yet have a password in the new one.

<!-- Document endpoint overwrite for login only -->

Similar the legacy "user identifiers" used for social logins could not be migrated as they did not store any information which provider they were from.

This is why you must keep a dependency on `serverpod_auth_migration` and keep the migration in the endpoints until all (relevant) accounts have been migrated.

[^1]: Which also still works with Serverpod 3.0, if you want to continue using that.

[^2]: As passwords are stored in a secure fashion (hashed, salted, and peppered), they can not be directly moved from the old system to the new one. Thus the migration can only happen once a client logs in again, providing the backend with the plain-text password, at which point the migrated account can be updated.