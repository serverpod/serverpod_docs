## Usage

```console
Manage Serverpod Cloud environment variables for a project.

Usage: scloud variable <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    Lists all environment variables for the project.
  set     Set an environment variable (create or update).
  unset   Remove an environment variable.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

### Sub commands

#### `list`

```console
Lists all environment variables for the project.

Usage: scloud variable list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

#### `set`

```console
Set an environment variable (create or update).

Usage: scloud variable set [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the environment variable. Can be passed as the first
                             argument.

Value
    --value                  The value of the environment variable. Can be passed as the second
                             argument.
    --from-file              The name of the file with the environment variable value.

Run "scloud help" to see global options.


Examples

  Set an environment variable called SERVICE_EMAIL to support@example.com.

    $ scloud variable set SERVICE_EMAIL support@example.com

  To set the variable from a file, use the --from-file option.
  The full content of the file will be used as the value.

    $ scloud variable set SERVICE_EMAIL --from-file email.txt

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```

#### `unset`

```console
Remove an environment variable.

Usage: scloud variable unset [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the environment variable. Can be passed as the first
                             argument.

Run "scloud help" to see global options.


Examples

  Remove an environment variable called SERVICE_EMAIL.

    $ scloud variable unset SERVICE_EMAIL

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/variable

```
