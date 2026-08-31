## Usage

```console
Manage Serverpod Cloud passwords.

The passwords are automatically prefixed with SERVERPOD_PASSWORD_ and will be injected as
environment variables.
Passwords defined by this command can be accessed with the getPassword function.

If you need to set a secret without the SERVERPOD_PASSWORD_ prefix, you can do so by using `scloud
variable set --secret`.


Usage: scloud password <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List all passwords, both user-set and platform-managed.
  set     Set a password.
  unset   Unset a password, can only unset user-set passwords.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/password

```

### Sub commands

#### `list`

```console
List all passwords, both user-set and platform-managed.

  Passwords are grouped by category:
  - Custom: User-defined passwords that are not part of the platform.
  - Services: Passwords for services like databases, insights, etc.
  - Auth: Passwords for authentication like JWT and email for package serverpod_auth_idp_server, and
  the Serverpod Cloud email service.
  - Legacy Auth: Passwords for the legacy authentication module.


Usage: scloud password list [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "context set" command).
    --format=<text|json|yaml>    Selects the command output format.
                                 (defaults to "text")

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/password

```

#### `set`

```console
Set a password.

  Setting a platform-managed password will override the existing password.
  The original password will not be lost and can be activated again by unsetting the password.


Usage: scloud password set [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "context set" command).
    --name (mandatory)           The name of the password (without SERVERPOD_PASSWORD_ prefix). Can
                                 be passed as the first argument.
    --format=<text|json|yaml>    Selects the command output format.
                                 (defaults to "text")

Value
    --value                      The value of the password. Can be passed as the second argument.
    --from-file                  The name of the file with the password value.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/password

```

#### `unset`

```console
Unset a password, can only unset user-set passwords.

Usage: scloud password unset [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "context set" command).
    --name (mandatory)           The name of the password (without SERVERPOD_PASSWORD_ prefix). Can
                                 be passed as the first argument.
    --format=<text|json|yaml>    Selects the command output format.
                                 (defaults to "text")

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/password

```
