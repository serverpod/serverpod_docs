---
title: Passwords and env vars
---

# Passwords and environment variables

This guide shows how to set passwords, secrets, and environment variables for your Serverpod Cloud project. Use passwords when your server code can use Serverpod's API; use secrets when a dependency only reads environment variables; use variables for non-sensitive configuration.

## Prerequisites

Before configuring values, make sure you have:

- Completed the **Installation** steps (`scloud` installed and authenticated).
- Linked your project (e.g. run from your server directory, or use `scloud project link`).

## Passwords vs secrets vs variables

| | Passwords | Secrets | Variables |
| --- | --- | --- | --- |
| **CLI** | `scloud password` | `scloud secret` | `scloud variable` |
| **Stored as** | Env var with `SERVERPOD_PASSWORD_` prefix | Env var (any name) | Env var (any name) |
| **Encrypted** | Yes | Yes | No (values visible in CLI and dashboard) |
| **Access in code** | `session.serverpod.getPassword('name')` | `Platform.environment['NAME']` | `Platform.environment['NAME']` |
| **Use when** | Serverpod code needs the value (preferred for secrets) | A dependency reads env vars and cannot use `getPassword()` | Non-sensitive config (URLs, feature flags) |

Under the hood, a **password** is a secret whose key is prefixed with `SERVERPOD_PASSWORD_`. Serverpod Cloud adds that prefix for you when you use `scloud password set`, and Serverpod's `getPassword()` looks up that prefixed key. Use **secrets** when you need a custom key name (e.g. for a third-party library that expects `API_KEY`).

## Set a password

Passwords are the right choice for sensitive values that your Serverpod endpoints or code can read via `getPassword()`. They are encrypted and only accessible through the Serverpod API.

Set a password (run from your server project directory, or pass `-p your-project-id`):

```bash
scloud password set myApiKey "your_secret_value"
```

The name you pass is used without the prefix in code. In your server code you request it by that name:

```dart
final apiKey = await session.serverpod.getPassword('myApiKey');
```

To set a password from a file (e.g. to avoid putting the value in shell history or if the password is multiple lines):

```bash
scloud password set myApiKey --from-file path/to/file.txt
```

List existing password names (values are never shown):

```bash
scloud password list
```

Remove a password you set:

```bash
scloud password unset myApiKey
```

## Set a secret

Use **secrets** when you need a sensitive value injected as an environment variable with a **specific key name**. Typical cases: a library or dependency that reads `Platform.environment['SOME_KEY']` and does not have access to Serverpod's `getPassword()`. Secrets are encrypted at rest and never shown in the CLI after creation.

Create a secret:

```bash
scloud secret create API_KEY "your_secret_value"
```

Your app (or any code in the same process) can read it as:

```dart
final apiKey = Platform.environment['API_KEY'];
```

To create from a file:

```bash
scloud secret create API_KEY --from-file path/to/file.txt
```

List secret names (values are never shown):

```bash
scloud secret list
```

Secrets cannot be updated in place; delete and recreate to change a value:

```bash
scloud secret delete --name API_KEY
scloud secret create API_KEY "new_value"
```

## Set an environment variable

Use **variables** for non-sensitive configuration: URLs, feature flags, region names, or other settings that are fine to see in the Cloud console or CLI. Values are **not** encrypted.

Create a variable:

```bash
scloud variable create LOG_LEVEL "info"
```

Update or delete as needed:

```bash
scloud variable update LOG_LEVEL "debug"
scloud variable delete LOG_LEVEL
```

List variables (names and values are shown):

```bash
scloud variable list
```

In code, read them like any environment variable:

```dart
final logLevel = Platform.environment['LOG_LEVEL'];
```

:::warning

Do not use variables for API keys, tokens, or passwords. Use **passwords** or **secrets** for sensitive data.

:::

## Related documentation

- CLI reference: [`password`](../reference/cli/commands/password), [`secret`](../reference/cli/commands/secret), [`variable`](../reference/cli/commands/variable)
