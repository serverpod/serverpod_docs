# Overview

Serverpod 3 introduced a new authentication system (`serverpod_auth_idp`) that replaces the legacy `serverpod_auth` module. The new system uses UUID-based user identifiers, modern Argon2id password hashing, and flexible token managers (JWT or server-side sessions).

Two helper packages bridge the gap between the old and new systems:

- `serverpod_auth_migration_server` performs a one-time batch migration of user accounts, email credentials, sessions, and profiles from the legacy tables into the new auth module.
- `serverpod_auth_bridge_server` / `serverpod_auth_bridge_flutter` provide runtime backwards compatibility so legacy password hashes and session tokens continue to work during the transition.

:::info
This guide currently covers **email** and **Google** migration paths. Apple and Firebase migration guides will be added in future updates.
:::

## Prerequisites

Before starting the migration:

- Upgrade to Serverpod 3.0 or later (see [Upgrade to 3.0](../upgrade-to-three)).
- Set up the new auth module and verify it works for new users (see [Authentication Setup](../../concepts/authentication/setup)).
- Have a working legacy `serverpod_auth` installation with existing users in the database.

## How the migration works

The migration happens in four layers:

1. **Server-side batch migration** -- `AuthMigrations.migrateUsers()` copies user accounts, email credentials, sessions, and profiles from the legacy tables into the new auth module. Passwords are stored in a bridge table because the hash formats are incompatible.

2. **Client session conversion** -- when a returning user opens the updated app, `initAndImportLegacySessionIfNeeded()` transparently exchanges their legacy session token for a new one.

3. **Provider-specific import/link on login** -- when a migrated user signs in for the first time after migration, bridge helpers can import provider-specific legacy state (for example `importLegacyPasswordIfNeeded()` for email, or Google account linking during legacy ID-token authentication).

4. **Legacy client request compatibility (optional)** -- `enableLegacyClientSupport()` and `LegacySessionTokenManagerBuilder()` allow old clients to keep using selected legacy auth calls while the server routes those calls to the bridge module.

## Migration timeline

### 1. Set up the new auth module

Add and configure the new authentication providers as described in the [Authentication Setup](../../concepts/authentication/setup) guide.

### 2. Add migration and bridge packages

Add the migration and bridge packages to your server, client, and Flutter app. See the provider-specific guide for exact dependencies:

- [Email accounts](./email#server-setup)
- [Google accounts](./google#server-setup)

### 3. Run the batch user migration

Call `AuthMigrations.migrateUsers()` to migrate all existing users. This can run at server startup or from a maintenance endpoint:

```dart
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart';

final migratedCount = await AuthMigrations.migrateUsers(
  session,
  userMigration: (
    session, {
    required int oldUserId,
    required UuidValue newAuthUserId,
    Transaction? transaction,
  }) async {
    // Update your custom tables that reference the old int user ID.
    // See the provider-specific guide for detailed examples.
  },
);
```

:::tip
For large databases, run the migration in batches by setting `maxUsers` and calling `migrateUsers` in a loop until it returns `0`.
:::

### 4. Configure backwards compatibility

Wire up the bridge package so:

- legacy passwords get imported on login,
- legacy sessions get converted on app startup for updated clients,
- and (optionally) legacy client calls keep working during rollout.

See the provider-specific guide for details:

- [Email accounts](./email#password-import-integration)
- [Google accounts](./google#legacy-google-linking-flow)

### 5. Update the Flutter client

Replace the standard session manager initialization with one that imports legacy sessions:

- [Email accounts](./email#client-setup)

### 6. Disable legacy auth endpoints

Prevent new logins and registrations through the old `serverpod_auth` endpoints:

```dart
import 'package:serverpod_auth_server/serverpod_auth_server.dart' as legacy_auth;

legacy_auth.AuthConfig.set(
  legacy_auth.AuthConfig(
    // Retain all previous configuration options...
    disableAccountEndpoints: true,
  ),
);
```

:::note
If you enabled legacy client support via the bridge, old clients can still authenticate through supported forwarded methods even after disabling legacy account endpoints. Unsupported legacy methods (for example registration and password reset) still fail. See the provider-specific migration guide for the exact supported method set.
:::

### 7. Deploy and update clients

Deploy the server with both old and new modules active. On first startup, the batch migration runs and populates the new tables.

Updated clients handle the transition automatically -- `initAndImportLegacySessionIfNeeded()` converts their legacy session token into a new one on first launch, so the user stays signed in without interruption.

If you do **not** enable legacy client support, old clients using `keyId:secret` tokens will get authentication errors on protected endpoints.

If you **do** enable legacy client support, old clients can continue using supported legacy auth methods while you roll out updates. Unsupported methods fail according to endpoint behavior (for example `404`, `false`, or `internalError`).

Even with legacy client support enabled, ensure clients eventually update to the new app version so they use the new auth flows end-to-end.

### 8. Remove legacy and migration packages

This step is for **phase 1 (batch data migration)**.

Do this when all of the following are true:

- `AuthMigrations.migrateUsers(...)` returns `0` (no remaining legacy users to migrate).
- Any `userMigration` callback logic has finished migrating your custom table references from legacy `int` IDs to UUID-based auth user IDs.
- Your app code and schema no longer depend on legacy `serverpod_auth` tables for active flows.

Complete this phase first, then remove the bridge once legacy passwords and sessions have been drained.

1. Remove `serverpod_auth_server` and `serverpod_auth_migration_server` from your server's `pubspec.yaml`.
2. Remove the `userMigration` callback code and any migration-specific logic.
3. For any custom entities, drop the old `int` user ID column and make the new `UuidValue` auth user ID column required.
4. Run `serverpod generate` and `serverpod create-migration` to update the database schema.

### 9. Remove the bridge package

The bridge package should be kept until all legacy passwords and sessions have been consumed. Monitor progress by checking the row counts in the bridge tables.

Once the bridge tables are empty:

1. Remove `serverpod_auth_bridge_server` from the server, `serverpod_auth_bridge_client` from the client, and `serverpod_auth_bridge_flutter` from the Flutter app.
2. Replace `initAndImportLegacySessionIfNeeded()` with the standard `initialize()` call.
3. Remove any `importLegacyPasswordIfNeeded` calls from your endpoint overrides.
4. Run `serverpod generate` and `serverpod create-migration` to drop the bridge tables.

## Package reference

### serverpod_auth_migration_server

| Method                                                            | Description                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AuthMigrations.migrateUsers(session, userMigration:, maxUsers:)` | Batch migrate users from legacy to new auth. Returns the number of users migrated.      |
| `AuthMigrations.isUserMigrated(session, userId)`                  | Check whether a legacy user has been migrated.                                          |
| `AuthMigrations.getNewAuthUserId(session, userId)`                | Get the new UUID auth user ID for a legacy int user ID. Returns `null` if not migrated. |

**Configuration:** `AuthMigrationConfig`

| Option           | Default  | Description                                  |
| ---------------- | -------- | -------------------------------------------- |
| `importProfile`  | `true`   | Import `UserInfo` data into `UserProfile`.   |
| `importSessions` | `true`   | Import `AuthKey` sessions into bridge table. |
| `emailIdp`       | required | Reference to the email identity provider.    |

**Migration callback:**

```dart
typedef UserMigrationFunction = Future<void> Function(
  Session session, {
  required int oldUserId,
  required UuidValue newAuthUserId,
  required Transaction? transaction,
});
```

### serverpod_auth_bridge_server

| Method                                                                                         | Description                                                                                                               |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `AuthBackwardsCompatibility.importLegacyPasswordIfNeeded(session, email:, password:)`         | Validate password against a legacy hash and import it into the new system.                                               |
| `AuthBackwardsCompatibility.isLegacyPasswordValid(session, emailAccountId:, email:, password:)` | Check if a password matches the legacy hash without importing.                                                            |
| `AuthBackwardsCompatibility.clearLegacyPassword(session, emailAccountId:)`                    | Delete a legacy password hash from the bridge table.                                                                      |
| `AuthBackwardsCompatibility.importGoogleAccount(session, idToken:, accessToken:)`             | Fetch Google account details, link to a migrated user when a legacy identifier matches, and clear the consumed mapping. |
| `AuthBackwardsCompatibility.importGoogleAccountFromDetails(session, accountDetails:)`         | Same Google linking behavior using provided account details (useful for non-interactive tests).                          |
| `pod.enableLegacyClientSupport()`                                                              | Forward supported `serverpod_auth.*` legacy requests to bridge endpoints.                                                |
| `LegacySessionTokenManagerBuilder()`                                                          | Register legacy `keyId:secret` token validation in auth services.                                                        |

**Configuration:** `AuthBackwardsCompatibilityConfig`

| Option           | Default  | Description                                                                                                           |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `extraSaltyHash` | `true`   | Use the email address as additional salt when validating legacy hashes. Must match the legacy system's configuration. |
| `emailIdp`       | required | Reference to the email identity provider.                                                                             |

:::warning
If `extraSaltyHash` does not match the setting used by the legacy `serverpod_auth` installation, password validation will silently fail and no passwords will be imported.
:::

### serverpod_auth_bridge_flutter

| Method                                                            | Description                                                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `initAndImportLegacySessionIfNeeded(caller, legacyStringGetter:)` | Initialize the session manager and convert any legacy session token to a new one. Extension on `FlutterAuthSessionManager`. |

## Bridge tables

These tables are created by the migration and bridge packages:

| Table                                    | Package   | Purpose                                                | Remove when                                 |
| ---------------------------------------- | --------- | ------------------------------------------------------ | ------------------------------------------- |
| `serverpod_auth_migration_migrated_user` | Migration | Maps old `int` user ID to new `UuidValue` auth user ID | After migration is complete and verified    |
| `serverpod_auth_bridge_session`          | Bridge    | Stores imported legacy session hashes                  | All sessions converted or expired           |
| `serverpod_auth_bridge_email_password`   | Bridge    | Stores imported legacy password hashes                 | All passwords imported on login             |
| `serverpod_auth_bridge_external_user_id` | Bridge    | Stores legacy external user identifiers                | All identifiers consumed (social providers) |

## Troubleshooting

### Migration is idempotent

`migrateUsers()` skips users that have already been migrated. It is safe to run multiple times -- for example, if the server restarts during migration or if you run it in batches.

### User tries to log in before batch migration

Until a user is migrated, the legacy `serverpod_auth` endpoints still work (unless you have disabled them).

After a user is migrated:

- updated clients should use new auth flows,
- legacy clients can keep using supported legacy methods if legacy client support is enabled,
- unsupported methods fail according to endpoint behavior (for example `404`, `false`, or `internalError`).

### Legacy session conversion fails

If `convertSession` returns `null` (e.g., the session has expired or was already converted), the user needs to sign in again with their credentials. The password import flow handles this case.

### Monitoring progress

Query the bridge tables to monitor migration progress:

- `serverpod_auth_bridge_email_password`: rows remaining = users who haven't logged in since migration.
- `serverpod_auth_bridge_session`: rows remaining = clients that haven't opened the app since migration.
- `serverpod_auth_bridge_external_user_id`: rows remaining = social identities that have not been linked on first migrated login.

For sessions, consider dropping all remaining rows after a reasonable period (e.g., 30 days) since those sessions are likely abandoned.
