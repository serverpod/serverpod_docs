---
title: Migrate from legacy serverpod_auth
description: Move a Serverpod 3.5 project off serverpod_auth_server onto the modular auth stack with email, Google, and Flutter session continuity.
sidebar_label: Migrate from legacy auth
---

# Migrate from legacy serverpod_auth

This guide is for apps still running `serverpod_auth_server` on Serverpod 3.4 or earlier 3.5 betas. At the end, existing users sign in through the new modular auth stack with their old passwords and old sessions, and your legacy endpoints keep working until every client has rolled forward. Plan for about an hour, plus migration runtime.

## Requirements

- A Serverpod 3.5.x project. If you are still on 3.4 or earlier, follow [Upgrade to 3.5](./upgrade-to-three-five) first.
- Dart SDK 3.8.0 or later.
- Flutter SDK 3.32.0 or later (only if you are migrating the Flutter app).
- Postgres 14 or later, or SQLite3.
- The four auth packages at `3.5.0-beta.9` (or the matching beta on pub.dev): `serverpod_auth_core`, `serverpod_auth_idp`, `serverpod_auth_bridge`, and `serverpod_auth_migration`. These are still beta and may receive breaking changes before 3.5 stable.

## Before you start

- Back up your production database.
- Commit your current state on a clean branch.
- Restore a copy of production data into a staging environment and rehearse this guide against it before running it for real.

## Add the new auth packages

Add the new packages to each of your server, client, and Flutter `pubspec.yaml` files. Keep the legacy `serverpod_auth_*` packages installed; you will remove them after the migration completes.

In `<project>_server/pubspec.yaml`:

```yaml
dependencies:
  serverpod: 3.5.0-beta.9
  serverpod_auth_server: 3.5.0-beta.9            # legacy, keep during migration
  serverpod_auth_core_server: 3.5.0-beta.9
  serverpod_auth_idp_server: 3.5.0-beta.9
  serverpod_auth_bridge_server: 3.5.0-beta.9
  serverpod_auth_migration_server: 3.5.0-beta.9
```

Add the matching `_client` and `_flutter` packages to `<project>_client/pubspec.yaml` and `<project>_flutter/pubspec.yaml`. The Flutter app also needs `serverpod_auth_bridge_client` for the session import in step 8.

From each package directory, run:

```bash
$ dart pub upgrade
$ serverpod generate
```

Outcome: the project builds with the new packages installed alongside the legacy ones.

## Configure the server

In `<project>_server/lib/server.dart`, call `pod.initializeAuthServices` before `pod.start` with the modular identity providers, register `LegacySessionTokenManager` so existing tokens keep validating, and enable legacy client forwarding so old client builds keep working.

`serverpod_auth_bridge_server` exports its own `Endpoints` and `Protocol` classes from its generated code, which clash with your project's. Use a `show` clause to bring only the symbols you need into scope:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_bridge_server/serverpod_auth_bridge_server.dart'
    show LegacySessionTokenManager, LegacyClientSupport;
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';
import 'package:serverpod_auth_idp_server/providers/google.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
      ServerSideSessionsConfigFromPasswords(),
      const LegacySessionTokenManager(),
    ],
    identityProviderBuilders: [
      EmailIdpConfigFromPasswords(),
      GoogleIdpConfigFromPasswords(),
    ],
  );

  pod.enableLegacyClientSupport();

  await pod.start();
}
```

Put the password-importing email endpoint in its own file under `<project>_server/lib/src/endpoints/`. Importing the full bridge package alongside the project's `Endpoints` and `Protocol` from the same file confuses the `serverpod generate` endpoint scanner, so keep it isolated:

```dart
// lib/src/endpoints/password_importing_email_idp_endpoint.dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_bridge_server/serverpod_auth_bridge_server.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/email.dart';

class PasswordImportingEmailIdpEndpoint extends EmailIdpBaseEndpoint {
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

Add the required entries to `<project>_server/config/passwords.yaml` under the `development:` section (use distinct values per environment):

```yaml
development:
  # ... existing keys (database, redis, serviceSecret) ...
  jwtRefreshTokenHashPepper: 'your-jwt-refresh-pepper'
  jwtHmacSha512PrivateKey: 'your-hmac-private-key-at-least-64-bytes'
  serverSideSessionKeyHashPepper: 'your-session-pepper'
  emailSecretHashPepper: 'your-email-pepper'
```

See [Storing secrets](/concepts/authentication/setup#storing-secrets) for production handling and additional provider-specific secrets.

Outcome: the server starts cleanly with both legacy and modular endpoints mounted side by side; existing legacy clients still work.

## Run the migration

Create and apply the schema migrations for the new modular tables:

```bash
$ serverpod create-migration --tag modular-auth
$ dart run bin/main.dart --apply-migrations
```

Then run the user migration once. The example below migrates every legacy user, but you can pass `maxUsers` to process in batches if your dataset is large. The `userMigration` callback fires once per migrated user so you can remap your own foreign keys from the legacy `int` user ID to the new `UuidValue` auth user ID inside the same transaction.

Put this helper in its own file so its imports do not collide with `server.dart`. `serverpod_auth_migration_server` exports its own `Endpoints` and `Protocol` classes, so use a `hide` clause when adding it elsewhere:

```dart
// lib/src/auth_migration.dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_migration_server/serverpod_auth_migration_server.dart'
    hide Endpoints, Protocol;

Future<void> runMigration(Serverpod pod) async {
  AuthMigrations.config = AuthMigrationConfig(
    emailIdp: AuthServices.instance.emailIdp,
  );

  final session = await pod.createSession();
  try {
    final migrated = await AuthMigrations.migrateUsers(
      session,
      userMigration: (
        session, {
        required int oldUserId,
        required UuidValue newAuthUserId,
        Transaction? transaction,
      }) async {
        // Remap your own tables from oldUserId to newAuthUserId using transaction.
      },
    );
    session.log('Migrated $migrated users.', level: LogLevel.info);
  } finally {
    await session.close();
  }
}
```

The migration is idempotent: re-running `migrateUsers` skips users that already have a row in `serverpod_auth_migration_migrated_user`. The returned count is "users selected this run," not "new users created."

Outcome: `serverpod_auth_migration_migrated_user` has one row per legacy user, and `pod.createSession()` followed by `AuthMigrations.migrateUsers` returns 0 on a rerun.

## Sign in works for migrated users

For email accounts, the `PasswordImportingEmailIdpEndpoint` subclass from the server step calls `AuthBackwardsCompatibility.importLegacyPasswordIfNeeded` before delegating to the base implementation. The first time a migrated user signs in with their old password, the bridge validates the legacy SHA-256 hash, sets a fresh Argon2id hash on the new email IdP account, and removes the `LegacyEmailPassword` row.

For Google accounts, `AuthMigrations.migrateUsers` seeded the `serverpod_auth_bridge_external_user_id` table with each legacy user's stored identifier (a Google `sub` for newer rows, or an email address for older rows). When a migrated user signs in with Google, call `AuthBackwardsCompatibility.importGoogleAccount` before the regular Google IdP login. The bridge looks up the legacy identifier by Google `sub` first and falls back to a case-insensitive email match, links the Google account to the existing `AuthUser`, and removes the bridge mapping so it does not fire twice.

Outcome: a migrated user signs in with their old password or Google account and lands in their existing data.

## Update the Flutter app

In `<project>_flutter/lib/main.dart`, swap the auth setup to use `FlutterAuthSessionManager` and call `initAndImportLegacySessionIfNeeded` before any sign-in UI renders. This exchanges any old auth key stored on the device for a new modular session so existing installs do not have to sign in again.

```dart
import 'package:serverpod_auth_bridge_flutter/serverpod_auth_bridge_flutter.dart';
import 'package:serverpod_auth_core_flutter/serverpod_auth_core_flutter.dart';
import 'package:your_client/your_client.dart';

late Client client;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  client = Client('https://api.example.com/')
    ..authSessionManager = FlutterAuthSessionManager();

  await client.authSessionManager.initAndImportLegacySessionIfNeeded(
    client.modules.serverpod_auth_bridge,
  );

  runApp(const MyApp());
}
```

This requires `serverpod_auth_bridge_client` and `serverpod_auth_bridge_flutter` in `<project>_flutter/pubspec.yaml` from step 4.

Outcome: users on an installed build with an old auth key keep their session through the upgrade without re-authenticating.

## Verify and clean up

### Verify

- Query `SELECT count(*) FROM serverpod_auth_migration_migrated_user` and confirm it matches your legacy user count.
- Sign in with a known migrated account through the new IdP and confirm the `LegacyEmailPassword` row for that user is gone afterwards.
- Monitor `serverpod_auth_bridge_external_user_id` and the bridge's legacy-session table over the following days. The row counts should decrease as users sign in through the new stack.

### While clients catch up

The legacy database tables stay untouched, so a rollback to the legacy stack still works while old client builds are still in the wild. `LegacySessionTokenManager` validates legacy session tokens against the bridge's stored sessions, and `pod.enableLegacyClientSupport()` keeps the legacy routes mounted so old apps continue to hit `serverpod_auth.*` endpoints.

### When you are ready to remove legacy

Once the bridge tables are empty (or close enough that you accept the long tail), drop the legacy packages and the migration dependency. Remove `serverpod_auth_server`, `serverpod_auth_migration_server`, and `serverpod_auth_bridge_server` from `pubspec.yaml`, remove the `LegacySessionTokenManager` and `enableLegacyClientSupport` calls from `server.dart`, then drop the legacy database columns that still reference integer `userInfoId`.

## Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| `migrateUsers` throws or rolls back | Migrations not applied, or the wrong `emailIdp` instance on `AuthMigrationConfig` | Apply all module migrations; set `AuthMigrations.config = AuthMigrationConfig(emailIdp: AuthServices.instance.emailIdp)` after `pod.initializeAuthServices`. |
| Migrated email user cannot log in with their old password | `importLegacyPasswordIfNeeded` is not on the login path | Confirm your email endpoint subclasses `EmailIdpBaseEndpoint` and calls `AuthBackwardsCompatibility.importLegacyPasswordIfNeeded` before `super.login`. |
| Flutter app prompts the user to sign in again after upgrade | Bridge client is not on the classpath, or the wrong module caller was passed | Add `serverpod_auth_bridge_client` to the client package; pass `client.modules.serverpod_auth_bridge` into `initAndImportLegacySessionIfNeeded`. |
| Duplicate Google `AuthUser` created on first sign-in | The legacy external user ID was never stored, or `importGoogleAccount` is not on the Google login path | Re-run `AuthMigrations.migrateUsers` for affected users (it backfills `serverpod_auth_bridge_external_user_id`); ensure the Google sign-in path calls `AuthBackwardsCompatibility.importGoogleAccount` first. |
| Authentication handler rejects modular tokens | `pod.initializeAuthServices` was not called, or token managers list is missing | Call `pod.initializeAuthServices(...)` before `pod.start()`; include `JwtConfigFromPasswords` (or `ServerSideSessionsConfigFromPasswords`) plus `LegacySessionTokenManager` in `tokenManagerBuilders`. |
| `serverpod generate` fails with "Endpoint analysis skipped due to invalid Dart syntax" or "The function 'Protocol' isn't defined" | The bridge or migration package exports its own `Endpoints` and `Protocol` classes that clash with your project's | Import the bridge with a `show` clause (`show LegacySessionTokenManager, LegacyClientSupport`) in `server.dart`, move the email endpoint subclass into its own file under `lib/src/endpoints/`, and use `hide Endpoints, Protocol` when importing the migration package in a helper file. |
| `PasswordNotFoundException: jwtRefreshTokenHashPepper was not found` on startup | `JwtConfigFromPasswords` requires several peppers and keys in `passwords.yaml` | Add `jwtRefreshTokenHashPepper`, `jwtHmacSha512PrivateKey`, `serverSideSessionKeyHashPepper`, and `emailSecretHashPepper` to each environment section. |

## Still stuck?

Reach out on the [community page](../support).

## Related

- [Upgrade to 3.5](./upgrade-to-three-five): do this first.
- [Authentication setup](/concepts/authentication/setup): modular configuration reference.
- [Database migrations](/concepts/database/migrations): creating and applying schema changes safely.
