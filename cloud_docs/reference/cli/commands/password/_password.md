# `password`

## Summary

The `scloud password` command provides management of passwords for Serverpod Cloud projects. Passwords are automatically prefixed with `SERVERPOD_PASSWORD_` and will be injected as environment variables. Passwords defined by this command can be accessed with Serverpod's `getPassword()` function.

Use this command when you need to manage passwords that will be accessed via Serverpod's `getPassword()` API, such as database passwords, JWT secrets, or email service passwords.

## Setting passwords

To set a password, use the `set` command:

```bash
scloud password set database "my_database_password"
```

The password name should be provided without the `SERVERPOD_PASSWORD_` prefix. The prefix is automatically added by Serverpod Cloud.

You can also set a password from a file:

```bash
scloud password set database --from-file password.txt
```

## Listing passwords

To list all passwords (both user-set and platform-managed):

```bash
scloud password list
```

This displays passwords grouped by category: Custom, Services, Auth, and Legacy Auth.

## Unsetting passwords

To remove a user-set password:

```bash
scloud password unset database
```

:::note
If you need to set a secret without the `SERVERPOD_PASSWORD_` prefix, you can do so by using the [`secret create`](/cloud/reference/cli/commands/secret) command.
:::

## Related commands

- [`scloud secret`](/cloud/reference/cli/commands/secret) - Manage general secrets without the `SERVERPOD_PASSWORD_` prefix
- [`scloud variable`](/cloud/reference/cli/commands/variable) - Manage non-sensitive configuration values

For detailed information about when to use passwords vs secrets vs variables, see the [Configuration Management guide](/cloud/guides/passwords).
