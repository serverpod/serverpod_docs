## Usage

```console
Manage Serverpod Cloud environment variables and secrets for a project.

Usage: scloud variable <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    Lists all environment variables and secrets for the project.
  set     Set an environment variable or secret (create or update).
  unset   Remove an environment variable or secret.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

### Sub commands

#### `list`

```console
Lists all environment variables and secrets for the project.

Usage: scloud variable list [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "context set" command).
    --format=<text|json|yaml>    Selects the command output format.
                                 (defaults to "text")

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

#### `set`

```console
Set an environment variable or secret (create or update).

Usage: scloud variable set [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command) or if a global project context is set (see the "context
                             set" command).
    --name (mandatory)       The name of the environment variable. Can be passed as the first
                             argument.
    --[no-]secret            Store the value as a secret. The value is encrypted and masked. Without
                             this flag the value is unmasked and visible.

Value
    --value                  The value of the environment variable. Can be passed as the second
                             argument.
    --from-file              The name of the file with the environment variable value.

Run "scloud help" to see global options.


Examples

  Set an environment variable called SERVICE_EMAIL to support@example.com.

    $ scloud variable set SERVICE_EMAIL support@example.com

  Set a secret environment variable. The value is encrypted and masked.

    $ scloud variable set --secret API_KEY sk-...

  To set the variable from a file, use the --from-file option.
  The full content of the file will be used as the value.

    $ scloud variable set SERVICE_EMAIL --from-file email.txt

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

#### `unset`

```console
Remove an environment variable or secret.

Usage: scloud variable unset [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command) or if a global project context is set (see the "context
                             set" command).
    --name (mandatory)       The name of the environment variable. Can be passed as the first
                             argument.

Run "scloud help" to see global options.


Examples

  Remove an environment variable called SERVICE_EMAIL.

    $ scloud variable unset SERVICE_EMAIL

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```
