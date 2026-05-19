## Usage

```console
Manage Serverpod Cloud passwords.

The passwords are automatically prefixed with SERVERPOD_PASSWORD_ and will be injected as
environment variables.
Passwords defined by this command can be accessed with the getPassword function.

If you need to set a secret without the SERVERPOD_PASSWORD_ prefix, you can do so by using the
secret create command.


Usage: scloud password <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List all passwords, both user-set and platform-managed.
  set     Set a password.
  unset   Unset a password, can only unset user-set passwords.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/password

```

### Sub commands

#### `list`

```console
List all passwords, both user-set and platform-managed.

  Passwords are grouped by category:
  - Custom: User-defined passwords that are not part of the platform.
  - Services: Passwords for services like databases, insights, etc.
  - Auth: Passwords for authentication like JWT, email, for package serverpod_auth_idp_server.
  - Legacy Auth: Passwords for the legacy authentication module.


Usage: scloud password list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/password

```

#### `set`

```console
Set a password.

  Setting a platform-managed password will override the existing password.
  The original password will not be lost and can be activated again by unsetting the password.


Usage: scloud password set [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the password (without SERVERPOD_PASSWORD_ prefix). Can be
                             passed as the first argument.

Value
    --value                  The value of the password. Can be passed as the second argument.
    --from-file              The name of the file with the password value.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/password

```

#### `unset`

```console
Unset a password, can only unset user-set passwords.

Usage: scloud password unset [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the password (without SERVERPOD_PASSWORD_ prefix). Can be
                             passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/password

```
