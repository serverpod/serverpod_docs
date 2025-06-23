# Upgrading from `serverpod_auth`

With the release of Serverpod 3.0, the single legacy `serverpod_auth` package was replaced with a set of modular packages providing flexible modules for users, authentication providers, profiles, and session management.

For an existing Serverpod application which makes use of `serverpod_auth` (which also still works with Serverpod 3.0) to upgrade to the new package, there exists `serverpod_auth_migration` to facilitate moving over all authentication- and user-related data into the new modules.  
Once the migration is complete, the legacy `serverpod_auth` module and the `serverpod_auth_migration` dependencies can be removed, which will also remove the then obsolete tables from the database.

Due to the modular approach, each used authentication provider (email, Apple, Google, etc.) needs to be configured individually for the migration.  
No matter through which authentication provider(s) a user is migrated, their profile will always be migrated as well by default.

## General timeline

The suggested migration timeline applies to all auth providers.

1. Add and configure the new auth modules for the desired providers, e.g. [email](../concepts/authentication/setup_new#email)
2. Add the migration module and configure each auth provider and set up a background migration job <!-- TODO: Build and document Future call for migration -->
3. Switch over all clients to use the new authentication endpoints
4. After a sufficient percentage of the userbase has migrated to the new endpoints, disable sign-ups throught the legacy package <!-- TODO: Build and showcase "off switch" in legacy package -->
5. Later on also disable logins and password resets on the `serverpod_auth` APIs
6. Once all users have been migrated (some of them via the background processes, albeit without passwords) remove the dependency on `serverpod_auth` and `serverpod_auth_migration` and delete all obsolete code
7. The next migration will then also remove obsolete tables

If the Serverpod application stores data with a relation to the `int` `UserInfo` ID, this needs to be migrated to the new `UUID` id of the `AuthUser`.  
To support this the `serverpod_auth_migration` packages provides a single hooks which is run for each user migration in which any related entities from your app can be migrated as well.

## Sessions

In order to support both sessions created by the legacy `serverpod_auth` and through the new `serverpod_auth_session` package, the `authenticationHandler` has to be updated to try both of them.  
Since an invalid/unknown session key just yields a `null` result, they can be chained like this:

```dart
import 'package:serverpod_auth_server/serverpod_auth_server.dart' as auth;
import 'package:serverpod_auth_email/serverpod_auth_email.dart' show AuthSessions;


final pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  authenticationHandler: (session, key) async {
    return await AuthSessions.authenticationHandler(session, key) ??
        await auth.authenticationHandler(session, key);
  },
);
```

All high-level authentication provider packages use `serverpod_auth_session` under the hood, and only a single handler needs to be registered to support all of them.

## Migrating Email Authentications

Before starting with the email account migration, the email authentication from `serverpod_auth_email` must be [set up as described](../concepts/authentication/setup_new#email).

Since the password storage format changed between the legacy and new modules, and because we only have access to the plain text password during `login` (when it's sent from the client), there are 2 scenarios of migrating user accounts and the email authentication.

During a login, we can verify the incoming credentials, and then migrate the entire account including the password.  
In all other cases (e.g. a password reset or a background migration job) we can migrate the user profile and account, but not set its password. The password could be set on a subsequent login (if it matches the one from the legacy module), or in case the user did not log in during the migration phase, they will have to resort to a password reset.

In order to avoid creating duplicate accounts for the "same" user in both the legacy and new system, one needs to ensure that the migration is always called before the new module would attempt any user lookups or creations.  
To support this in the new endpoint, which now exists as a subclass in the Serverpod application, the migration methods need to be added to each affected endpoint.


<!-- TODO: Update to show new endpoint instead -->
```dart
class EmailAccountEndpointWithMigration
    extends email_account.EmailAccountEndpoint {
  @override
  Future<AuthSuccess> login(
    final Session session, {
    required final String email,
    required final String password,
  }) async {
    // Add this before the call to `super` in the endpoint subclass
    await AuthMigrationEmail.migrateOnLogin(
      session,
      email: email,
      password: password,
    );

    return super.login(session, email: email, password: password);
  }

  @override
  Future<void> startRegistration(
    final Session session, {
    required final String email,
    required final String password,
  }) async {
    // Add this before the call to `super` in the endpoint subclass
    await AuthMigrationEmail.migrateOnLogin(
      session,
      email: email,
      password: password,
    );

    return super.startRegistration(session, email: email, password: password);
  }

  @override
  Future<void> startPasswordReset(
    final Session session, {
    required final String email,
  }) async {
    // Add this before the call to `super` in the endpoint subclass
    await AuthMigrationEmail.migrateWithoutPassword(session, email: email);

    return super.startPasswordReset(session, email: email);
  }
}
```

After this modification, the endpoint will always attempt a migration first, before then proceeding with the desired request (e.g. registering a new account if none exists yet).

The migration works fully out of the box. But in case the existing `UserInfo` should not be moved to a new `serverpod_auth_profile` `UserProfile`, this can be disabled through the `AuthMigrationEmailConfig`:

```dart
AuthMigrationEmail.config = AuthMigrationConfig(
  importProfile: false,
  userMigrationHook: (session, {required newAuthUserId, required oldUserId, transaction}) => …,
);
```

## User ID Migration

The `userMigrationHook` shown above is also the place where you should migraten all references to a legacy `UserInfo` id to the new `AuthUser` `UUID`.

Commonly there are 2 approach how this could be handled:

One way would be to extend any database table that currently points to a `UserInfo` to also gain an optional `AuthUser` id column.  
Then during the migration identify all rows belonging to the user and set their `AuthUser` id value. Later on the `UserInfo`-relation column will just be dropped when the migration is done.
Care needs to be taken that one does not keep writing new rows with just a `UserInfo` relation, as the migration for the previous user will not be run again, and thus this would become unreachable with the user's new ID.
A benefit of this approach is that existing queries for the user's entities (e.g. team memberships) could easily be accommodated by looking for the `int` or `UUID` value depending on the ID type of the `AuthenticationInfo`.

Alternatively, especially if one wants to make further changes to one schema in conjunction with the user migration, one could migrate to altogether new tables in the migration, which only point to `AuthUser`s and where the relation would not need to be optional.
All future reads and writes (for migrated users) should then go to the new tables – which might not be feasible if the data is shared between both legacy and new users. But potentially one could just run a migration for all users in a team/company so all users in that group could start using the new tables.
<!-- For this to work with old session, we would probably need another migration layer to look up the "new ID" in a request (which was started with a legacy session) (on the session? might easily get races on app start up) -->

## Future calls (background migration)

<!-- TODO -->