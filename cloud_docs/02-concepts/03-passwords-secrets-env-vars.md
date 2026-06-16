---
title: Passwords, secrets, and environment variables
description: "Serverpod Cloud has three configuration tiers: encrypted passwords via the Serverpod API, encrypted secrets as named env vars, and plaintext variables."
---

# Passwords, secrets, and environment variables

Your server needs sensitive values (database passwords, third-party API keys, OAuth client secrets) and runtime configuration without checking them into source. Serverpod Cloud gives you three configuration tiers. Passwords are encrypted and accessed through Serverpod's `getPassword()` API. Secrets are encrypted and injected as environment variables under a name you choose. Variables are plaintext, for non-sensitive configuration.

|                       | Passwords                                              | Secrets                                                    | Variables                                               |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| **CLI**               | `scloud password`                                      | `scloud secret`                                            | `scloud variable`                                       |
| **Stored as**         | Env var with `SERVERPOD_PASSWORD_` prefix              | Env var (any name)                                         | Env var (any name)                                      |
| **Encrypted**         | Yes                                                    | Yes                                                        | No (values visible in CLI and dashboard)                |
| **Access in code**    | `session.serverpod.getPassword('name')`                | `Platform.environment['NAME']`                             | `Platform.environment['NAME']`                          |
| **Use when**          | Serverpod code reads the value (preferred for secrets) | A dependency reads env vars and cannot use `getPassword()` | Non-sensitive config (URLs, feature flags)              |

All three commands follow the same shape:

- **`--name`** (mandatory): positional or as a flag
- **Value**: positional, `--value`, or `--from-file`
- **`-p, --project`**: required only when the project isn't linked
- **`set` is create-or-update**: running it again with the same name overwrites the value

## Manage passwords

Passwords are the default tier for sensitive values the server reads through the Serverpod API. They are encrypted at rest, never shown after they're set, and accessed in code by the name you gave them. Each password is stored under a `SERVERPOD_PASSWORD_` prefix that the CLI adds on `set` and that `getPassword()` strips on read, so the name in your code stays clean.

Serverpod Cloud also provisions a set of platform-managed passwords automatically: database credentials, Insights tokens, `serverpod_auth_idp_server` keys, and keys for the legacy auth module. `scloud password list` groups them into four categories: **Custom** (passwords you add), **Services** (database, Insights, and related platform passwords), **Auth** (passwords for `serverpod_auth_idp_server`), and **Legacy Auth** (passwords for the legacy authentication module). The Status column marks platform-managed passwords `AUTO (Platform)` and user-set ones `SET (User)`.

Override a platform-managed password by setting a custom value with the same name. Unset it to restore the platform default.

Set a password by name and value:

```bash
scloud password set myApiKey "your_secret_value"
```

Read the value in code:

```dart
final apiKey = session.serverpod.getPassword('myApiKey');
```

Pass `--from-file` when the value is long, multi-line, or shouldn't appear in shell history:

```bash
scloud password set myApiKey --from-file path/to/file.txt
```

List all configured passwords:

```bash
scloud password list
```

Remove a user-added password:

```bash
scloud password unset myApiKey
```

## Manage secrets

Secrets are the right tier when a library or dependency reads a value from `Platform.environment['SOMETHING']` and can't use the Serverpod API. They're encrypted at rest and never shown in the CLI after creation.

Set a secret by name and value:

```bash
scloud secret set API_KEY "your_secret_value"
```

Read the value in code:

```dart
final apiKey = Platform.environment['API_KEY'];
```

Pass `--from-file` for long, multi-line, or sensitive values you don't want in shell history:

```bash
scloud secret set API_KEY --from-file path/to/file.txt
```

List configured secrets:

```bash
scloud secret list
```

Remove a secret:

```bash
scloud secret unset API_KEY
```

## Manage environment variables

Variables are for non-sensitive configuration: URLs, feature flags, region names, or other settings that don't need encryption. Values are stored in plaintext and visible in the CLI and the Cloud console.

Set a variable by name and value:

```bash
scloud variable set LOG_LEVEL "info"
```

Read the value in code:

```dart
final logLevel = Platform.environment['LOG_LEVEL'];
```

Pass `--from-file` to load the value from a file:

```bash
scloud variable set LOG_LEVEL --from-file path/to/file.txt
```

List configured variables:

```bash
scloud variable list
```

Remove a variable:

```bash
scloud variable unset LOG_LEVEL
```

:::warning

Do not use variables for API keys, tokens, or passwords. Use passwords or secrets for sensitive data.

:::

## Limits

The same naming and size rules apply across all three tiers:

- Names use letters (`a-z`, `A-Z`), digits (`0-9`), and underscores (`_`) only, and must start with a letter or underscore.
- Maximum name length is 255 characters.
- Variables and secrets each have a separate per-project storage budget of 64,000 bytes (the total of all names plus values within that tier). Passwords share the secrets budget because they're stored as secrets under the `SERVERPOD_PASSWORD_` prefix.

## Related

- CLI reference: [`password`](/cloud/reference/cli/commands/password), [`secret`](/cloud/reference/cli/commands/secret), [`variable`](/cloud/reference/cli/commands/variable)
