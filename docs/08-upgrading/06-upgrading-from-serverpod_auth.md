# Upgrading from `serverpod_auth`

With the release of Serverpod 3.0, the single legacy `serverpod_auth` package was replace with a set of modular packages providing flexible modules for users and profiles, authentication, and session management.

For an existing Serverpod application which makes use of `serverpod_auth` (which still works totally fine with 3.0) to upgrade to the new package, there exists `serverpod_auth_migration` to facilitate moving over all authentication data into the new models.  
Once the migration is complete, the legacy `serverpod_auth` module and the `serverpod_auth_migration` module can be removed (which will also remove the then obsolete tables from the database).

Due to the modular approach, each used authentication provider (email, Apple, Google, etc.) needs to be configured individually for the migration.  
No matter through which authentication provider(s) a user is migrated, their profile will always be migrated as well (unless the developers opts out of this).

## General timeline

The suggested migration timeline applies to all auth providers.

1. Add and configure the new auth modules for the desired providers
2. Add the migration module and configure each auth provider and set up a background migration job <!-- TODO: Showcase this -->
3. Switch over all clients to use the new authentication endpoints
4. After a sufficient percentage of the userbase has migrated to the new endpoints, disable sign-ups via the legacy package <!-- TODO: Showcase this -->
5. Later on also disable logins and password resets on the `serverpod_auth` APIs
6. Once all users have been migrated (also via the background processes, albeit without passwords) remove the dependency on `serverpod_auth` and `serverpod_auth_migration` and delete all related code
7. The next migration will then also remove obsolete tables

If the Serverpod application stores data with a relation to the `UserInfo` / user ID, this needs to be migrated to the new `UUID` id of the `AuthUser`.
During the migration a mapping, if the user has been migrated, can be looked up via the `MigratedUser` entity. But as this model will be dropped with the removal of the `serverpod_auth_migration` package in step 6, one needs to ensure to also update ones own data to point to the new `AuthUser` IDs.

## UserInfo / User ID

<!-- TODO: Explain how a look up can be made during the transition, but finally any foreign keys need to be migrated. 
     Depending on the project scale this might be easiest to do "at once", if possible.
     We should probably showcase a full example here, and figure out how to integrate that into the migration that will drop the final tables.

     Maybe add optional AuthUser relation, and then in the end make it required (while dropping the `serverpod_auth` `UserInfo`)
     -->

## Sessions

<!-- TODO: Explain how all default modules use the new `serverpod_auth_session` and thus this only need to be configured once -->

## Migrating Email Authentications

<!-- TODO: The update with the final link -->
Before starting with the email account migration, the email authentication from `serverpod_auth_email` must be [set up as described](06-concepts/11-authentication/01-setup_new.md#email).

Since the password storage format changed between the legacy and new modules, and because we only have access to the plain text password during `login` (when it's sent from the client), there are 2 scenarios of migrating user accounts and the email authentication.

During a login we can verify the incoming credentials, and then migrate the entire account including the password.  
In all other cases (e.g. a password reset or a background migration job) we can migrate the user profile and account, but not set its password. The password could be set on a subsequent login (if it matches the one from the legacy module), or in case the user did not log in during the migration phase, they will have to resort to a password reset.

In order to avoid creating duplicate accounts for the "same" user in both the legacy and new system, one needs to ensure that the migration is always called before the new module would attempt any user lookups or creations.  
To support this in the new endpoint, which now exists as a subclass in the Serverpod application, the migration methods need to each affected endpoint.

```dart
class EmailAccountEndpointWithMigration
    extends email_account.EmailAccountEndpoint {
  @override
  Future<String> login(
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

After this modification, the endpoint will always attempt a migration first, because then proceeding with the desired request (eg. registering a new account if none exists yet).

The migration works fully out of the box. But in case the existing `UserInfo` should not be moved to a new `serverpod_auth_profile` `UserProfile`, this can be disabled through the `AuthMigrationEmailConfig`.

```dart
AuthMigrationEmail.config = AuthMigrationEmailConfig(
  importProfile: false,
);
```
