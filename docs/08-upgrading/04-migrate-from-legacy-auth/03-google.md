# Google accounts

This guide covers migrating legacy Google-linked users from `serverpod_auth` to the new authentication system.

:::caution
Make sure you have read the [migration overview](./overview) before following this guide.
:::

## What gets migrated

For legacy Google users, the batch migration stores the legacy external identifier from `UserInfo.userIdentifier` in the bridge table `serverpod_auth_bridge_external_user_id`.

During migration from older legacy setups, this identifier may be either:

- the Google user identifier (`sub`), or
- the Google account email address.

No Google account link is created during the batch migration itself. Linking happens at login time through the bridge flow described below.

## Server setup

### Dependencies

Add the migration, bridge, legacy auth package, and Google IdP package:

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

Configure Google in the new auth services and enable legacy client forwarding:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_bridge_server/serverpod_auth_bridge_server.dart';
import 'package:serverpod_auth_idp_server/core.dart';
import 'package:serverpod_auth_idp_server/providers/google.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  pod.initializeAuthServices(
    tokenManagerBuilders: [
      JwtConfigFromPasswords(),
      LegacySessionTokenManagerBuilder(),
    ],
    identityProviderBuilders: [
      GoogleIdpConfigFromPasswords(),
    ],
  );

  // Optional but recommended while old clients are still deployed.
  pod.enableLegacyClientSupport();

  await pod.start();
}
```

## Legacy Google linking flow

When a legacy client calls `serverpod_auth.google.authenticateWithIdToken`, the bridge performs a login-time link-and-authenticate flow:

1. Verify the Google ID token and fetch Google account details.
2. Try to resolve a migrated legacy identifier in `serverpod_auth_bridge_external_user_id`:
   - First by exact Google user identifier (`sub`).
   - Then by case-insensitive email match (`lower(userIdentifier) = lower(googleEmail)`).
3. If a match is found, link the Google account to the matched `AuthUser`.
4. Remove the matched legacy identifier mapping after a successful link.
5. Authenticate with the new Google IdP and return a legacy-style auth response (`keyId`, `key`, and `LegacyUserInfo`).

If no legacy match is found, the bridge does not clear any mapping and proceeds with the normal Google login path.

## Supported legacy Google methods

- Supported: `serverpod_auth.google.authenticateWithIdToken`
  - Invalid token / verification errors map to `invalidCredentials`.
  - Blocked user maps to `blocked`.
  - Unexpected errors map to `internalError`.
- Unsupported: `serverpod_auth.google.authenticateWithServerAuthCode`
  - Returns `internalError` in this migration phase.

:::note
Google migration support in this phase is ID-token only for legacy proxy traffic.
:::
