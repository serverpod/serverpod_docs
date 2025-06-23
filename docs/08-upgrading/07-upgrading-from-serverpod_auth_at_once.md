# Upgrading from `serverpod_auth` at once

With the release of Serverpod 3.0, the single legacy `serverpod_auth` package was replaced with a set of modular packages providing flexible modules for users, authentication providers, profiles, and session management.

For an existing Serverpod application which makes use of `serverpod_auth` (which also still works with Serverpod 3.0) to upgrade to the new package, there exists `serverpod_auth_migration` to facilitate moving over all authentication- and user-related data into the new modules.  
Once the migration is complete, the legacy `serverpod_auth` module and the `serverpod_auth_migration` dependencies can be removed, which will also remove the then obsolete tables from the database.

Due to the modular approach, each used authentication provider (email, Apple, Google, etc.) needs to be configured individually for the migration.  
No matter through which authentication provider(s) a user is migrated, their profile will always be migrated as well by default.

Applications which require strict backwards compatiblity need to go through a long, carefully planned migration phase. For apps which can be upgrade in one swoop, for example because the only frontend is a web app which can be updated immediately or where users can be forced to do a version upgrade, a simplified path can be chosen which migrates all entities to the new structure at once.

## General timeline

The suggested migration timeline applies to all auth providers.

1. Add and configure the new auth modules for the desired providers, e.g. [email](../concepts/authentication/setup_new#email).
  Disable the `serverpod_auth` endpoints. <!-- Add and document flag here -->
2. Update the client code to only use the new endpoints. Ensure all legacy imports are removed from the client.
3. Add the migration module and configure each auth provider and set up a _foreground_ migration job, which also includes migrating your entities.
  Update all code using the legacy `int` user ID to use the new `AuthUser` `UUID` id instead.
4. Deploy the updated backend & frontend and let the migration complete.
5. Remove any references to the old user IDs from your entities, make references to the new auth user ID required where they should be non-optional
6. Deploy the updated schema
7. Once all user sign-ins have been migrated, you can remove the `serverpod_auth` and `serverpod_auth_migration` modules.


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
while (true) {
  final migratedAccounts = await AuthMigrations.migrateNextUserBatch(
    await pod.createSession(),
  );

  if (migratedAccounts == 0) {
    break;
  }
}
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
