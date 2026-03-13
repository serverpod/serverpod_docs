# Email accounts

This guide covers the specifics of migrating email-based accounts from legacy `serverpod_auth` to the new authentication system.

:::caution
Make sure you have read the [migration overview](./overview) before following this guide. You should have the new auth module set up and working before starting the migration.
:::

## What gets migrated

For each legacy email user, the batch migration creates:

1. A new `AuthUser` with a UUID identifier.
2. A new `EmailAccount` with the same email address but a `NULL` password.
3. A `LegacyEmailPassword` row in the bridge table containing the legacy SHA-256 password hash.
4. A `LegacySession` row in the bridge table for each active session (if `importSessions` is enabled).
5. A `UserProfile` imported from the legacy `UserInfo` (if `importProfile` is enabled).

The password cannot be migrated directly because the legacy system uses SHA-256 hashing while the new system uses Argon2id. Instead, the bridge validates the legacy hash when the user next logs in and re-hashes the password with Argon2id at that point.

## Server setup

### Dependencies

Add the migration, bridge, and legacy packages alongside the new auth packages:

```yaml
# server/pubspec.yaml
dependencies:
  serverpod: 3.x.x
  serverpod_auth_idp_server: 3.x.x
  serverpod_auth_server: 3.x.x            # legacy -- keep during migration
  serverpod_auth_migration_server: 3.x.x
  serverpod_auth_bridge_server: 3.x.x
```

### Configure auth services

Set up both the new auth system and the bridge in your `server.dart`:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_bridge_server/serverpod_auth_bridge_server.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';
import 'package:serverpod_auth_server/serverpod_auth_server.dart' as legacy_auth;

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Keep legacy auth configured during migration.
  legacy_auth.AuthConfig.set(
    legacy_auth.AuthConfig(
      sendValidationEmail: _sendLegacyValidationEmail,
      sendPasswordResetEmail: _sendLegacyPasswordResetEmail,
    ),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
      LegacySessionTokenManagerBuilder(),
    ],
    identityProviderBuilders: [
      EmailIdpConfig(
        secretHashPepper: pod.getPassword('emailSecretHashPepper')!,
        sendRegistrationVerificationCode: _sendRegistrationCode,
        sendPasswordResetVerificationCode: _sendPasswordResetCode,
      ),
    ],
  );

  // Optional but recommended while old clients are still in the field.
  // This forwards supported legacy auth routes to bridge endpoints.
  pod.pod.enableLegacyClientSupport();

  await pod.start();

  // Run the batch migration after the server starts.
  // See the "Running the batch migration" section below.
  await _migrateAllUsers(await pod.createSession());
}
```

The two bridge-specific lines above are what enable runtime compatibility for legacy clients:

- `LegacySessionTokenManagerBuilder()` validates legacy `keyId:secret` tokens.
- `pod.enableLegacyClientSupport()` forwards supported `serverpod_auth.*` requests to `serverpod_auth_bridge.legacy*` endpoints.

The `legacy_auth.AuthConfig.set(...)` block keeps legacy email callbacks configured during the transition while you still have older clients in the field.

### Generate and apply migrations

After adding the new packages, generate code and create a database migration:

```bash
serverpod generate
serverpod create-migration
```

Start the database and apply the migration:

```bash
docker compose up --build --detach
dart run bin/main.dart --role maintenance --apply-migrations
```

## Password import integration

Override the `login` method on your email endpoint to import legacy passwords before authentication:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';
import 'package:serverpod_auth_bridge_server/serverpod_auth_bridge_server.dart';

class EmailIdpEndpoint extends EmailIdpBaseEndpoint {
  @override
  Future<AuthSuccess> login(
    Session session, {
    required String email,
    required String password,
  }) async {
    await AuthBackwardsCompatibility.importLegacyPasswordIfNeeded(
      session,
      email: email,
      password: password,
    );

    return super.login(session, email: email, password: password);
  }
}
```

This checks on every login whether the email account has a `NULL` password and, if so, validates the entered password against the legacy hash. On success it sets the password on the new `EmailAccount` using Argon2id and deletes the legacy hash. Subsequent logins use the new hash directly.

## Legacy client support

With bridge support enabled, legacy clients can continue using these methods:

- `serverpod_auth.email.authenticate`
- `serverpod_auth.google.authenticateWithIdToken` (requires Google IdP to be configured)
- `serverpod_auth.status.isSignedIn`
- `serverpod_auth.status.signOutDevice`
- `serverpod_auth.status.signOutAllDevices`
- `serverpod_auth.status.getUserInfo`
- `serverpod_auth.status.getUserSettingsConfig`
- `serverpod_auth.user.removeUserImage`
- `serverpod_auth.user.setUserImage`
- `serverpod_auth.user.changeUserName`
- `serverpod_auth.user.changeFullName`

Other legacy auth methods are intentionally not supported (for example legacy registration and password reset).

For Google, only `serverpod_auth.google.authenticateWithIdToken` is supported; `authenticateWithServerAuthCode` remains unsupported. Legacy Firebase login also remains unsupported.

Unsupported methods fail according to endpoint behavior (for example `404`, `false`, or `internalError`). See [Google accounts](./google#supported-legacy-google-methods) for Google-specific details.

:::note
Legacy `email.authenticate` is intended for migrated legacy email users. A user created only in the new auth system does not have a legacy `UserInfo` row, so this call returns an internal error.
:::

## Running the batch migration

### Basic migration

Migrate all users in batches:

```dart
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart';

Future<void> _migrateAllUsers(Session session) async {
  var totalMigrated = 0;
  int batchCount;

  do {
    batchCount = await AuthMigrations.migrateUsers(
      session,
      userMigration: null,
      maxUsers: 500,
    );
    totalMigrated += batchCount;
  } while (batchCount > 0);

  session.log('Migration complete. Total users migrated: $totalMigrated');
}
```

:::tip
`migrateUsers` is idempotent -- users that have already been migrated are skipped. It is safe to call this repeatedly, for example on every server startup, until you remove the migration package.
:::

### Migration with custom entity references

If your application has tables that reference the old `UserInfo.id` (an `int`), you need to update those references to point to the new UUID-based auth user ID.

**Step 1: Add a new column for the UUID reference.**

Suppose you have a `Post` model with an `authorId` field referencing the legacy user ID:

```yaml
class: Post
table: post
fields:
  title: String
  content: String
  authorId: int
```

Add a nullable UUID column alongside the old one:

```yaml
class: Post
table: post
fields:
  title: String
  content: String
  authorId: int?
  authUserId: UuidValue?
```

Run `serverpod generate` and `serverpod create-migration` to add the new column.

**Step 2: Use the `userMigration` callback to populate the new column.**

```dart
Future<void> _migrateAllUsers(Session session) async {
  var totalMigrated = 0;
  int batchCount;

  do {
    batchCount = await AuthMigrations.migrateUsers(
      session,
      userMigration: _migrateUserEntities,
      maxUsers: 500,
    );
    totalMigrated += batchCount;
  } while (batchCount > 0);

  session.log('Migration complete. Total users migrated: $totalMigrated');
}

Future<void> _migrateUserEntities(
  Session session, {
  required int oldUserId,
  required UuidValue newAuthUserId,
  Transaction? transaction,
}) async {
  await Post.db.updateWhere(
    session,
    where: (t) => t.authorId.equals(oldUserId),
    columnValues: (t) => [
      t.authUserId(newAuthUserId),
    ],
    transaction: transaction,
  );
}
```

**Migrating multiple entities:**

```dart
Future<void> _migrateUserEntities(
  Session session, {
  required int oldUserId,
  required UuidValue newAuthUserId,
  Transaction? transaction,
}) async {
  await Post.db.updateWhere(
    session,
    where: (t) => t.authorId.equals(oldUserId),
    columnValues: (t) => [t.authUserId(newAuthUserId)],
    transaction: transaction,
  );

  await Comment.db.updateWhere(
    session,
    where: (t) => t.userId.equals(oldUserId),
    columnValues: (t) => [t.authUserId(newAuthUserId)],
    transaction: transaction,
  );

  await UserSettings.db.updateWhere(
    session,
    where: (t) => t.userId.equals(oldUserId),
    columnValues: (t) => [t.authUserId(newAuthUserId)],
    transaction: transaction,
  );
}
```

:::info
The `userMigration` callback runs inside the same database transaction as the user migration itself. If the callback throws, the entire migration for that user is rolled back and can be retried.
:::

**Step 3: After migration, make the new column required and drop the old one.**

Once all users have been migrated and your application code has been updated to use `authUserId` everywhere:

```yaml
class: Post
table: post
fields:
  title: String
  content: String
  authUserId: UuidValue
```

Run `serverpod generate` and `serverpod create-migration` to finalize the schema.

### Looking up the new ID outside the migration callback

During the transition period, you may need to resolve old int IDs to new UUIDs in your existing endpoint code:

```dart
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart';

Future<UuidValue> resolveAuthUserId(
  Session session,
  int? legacyUserId,
  UuidValue? authUserId,
) async {
  if (authUserId != null) return authUserId;

  if (legacyUserId == null) {
    throw ArgumentError('No user ID available');
  }

  final newId = await AuthMigrations.getNewAuthUserId(session, legacyUserId);
  if (newId == null) {
    throw StateError('User $legacyUserId has not been migrated yet');
  }

  return newId;
}
```

## Client setup

### Dependencies

```yaml
# client/pubspec.yaml
dependencies:
  serverpod_client: 3.x.x
  serverpod_auth_bridge_client: 3.x.x
```

```yaml
# flutter/pubspec.yaml
dependencies:
  serverpod_flutter: 3.x.x
  serverpod_auth_idp_flutter: 3.x.x
  serverpod_auth_bridge_flutter: 3.x.x
```

### Session migration in the Flutter app

Replace the standard `initialize()` call with `initAndImportLegacySessionIfNeeded` to transparently convert legacy sessions:

**Standard new auth setup:**

```dart
client.authSessionManager = FlutterAuthSessionManager();
await client.auth.initialize();
```

**With legacy session import:**

```dart
import 'package:serverpod_auth_bridge_flutter/serverpod_auth_bridge_flutter.dart';

final sessionManager = FlutterAuthSessionManager();
client.authSessionManager = sessionManager;

await sessionManager.initAndImportLegacySessionIfNeeded(
  client.modules.serverpod_auth_bridge,
);
```

This method:

1. Calls `initialize()` internally.
2. If the user is already authenticated with the new system, does nothing.
3. Otherwise, reads the legacy session key from `SharedPreferences` (stored under the key `serverpod_authentication_key_production`).
4. Sends it to the server's `SessionMigrationEndpoint.convertSession`.
5. On success, stores the new auth token and the user is signed in.
6. The legacy session row is deleted server-side after conversion.

On subsequent app launches the session manager detects the existing token and skips the import.

:::tip
If your app used a custom storage mechanism instead of `SharedPreferences` for the legacy session key, pass a `legacyStringGetter` callback:

```dart
await sessionManager.initAndImportLegacySessionIfNeeded(
  client.modules.serverpod_auth_bridge,
  legacyStringGetter: (key) async {
    return myCustomStorage.read(key);
  },
);
```

:::

## Password migration flow

When a migrated user signs in with their email and password, the following happens:

1. The `login` override calls `importLegacyPasswordIfNeeded`.
2. The bridge looks up the `EmailAccount` for the given email and checks if its password is `NULL`.
3. If `NULL`, it looks for a `LegacyEmailPassword` row for that account.
4. It validates the entered password against the legacy SHA-256 hash.
5. If valid, it hashes the password with Argon2id and sets it on the `EmailAccount`.
6. The `LegacyEmailPassword` row is deleted.
7. `super.login()` proceeds and authenticates against the newly imported password.

If the legacy password is invalid, `importLegacyPasswordIfNeeded` does nothing and the login attempt fails normally.

## Cleanup

After all users have migrated and the bridge tables are empty:

1. Remove `serverpod_auth_server` and `serverpod_auth_migration_server` from the server's `pubspec.yaml`.
2. Remove the legacy setup block from `server.dart`: `legacy_auth.AuthConfig.set(...)` and any legacy callback functions such as `_sendLegacyValidationEmail` / `_sendLegacyPasswordResetEmail`.
3. Remove `serverpod_auth_bridge_server` from the server, `serverpod_auth_bridge_client` from the client, and `serverpod_auth_bridge_flutter` from the Flutter app.
4. Remove the `login` override with `importLegacyPasswordIfNeeded` from your email endpoint. Revert to the standard endpoint:

    ```dart
    class EmailIdpEndpoint extends EmailIdpBaseEndpoint {}
    ```

5. Remove `LegacySessionTokenManagerBuilder()` from `tokenManagerBuilders` and remove the `pod.enableLegacyClientSupport()` call from your server startup.
6. Replace `initAndImportLegacySessionIfNeeded` with the standard `initialize()` call in your Flutter app.
7. Remove the batch migration code from your server startup.
8. Drop legacy columns from your custom entities (make `authUserId` required, remove old `authorId`).
9. Run `serverpod generate` and `serverpod create-migration` to finalize the database schema.
