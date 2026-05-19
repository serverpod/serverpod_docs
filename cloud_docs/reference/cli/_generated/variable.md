## Usage

```console
Manage Serverpod Cloud environment variables for a project.

Usage: scloud variable <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create   Create an environment variable.
  delete   Delete an environment variable.
  list     Lists all environment variables for the project.
  update   Update an environment variable.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/variable

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

See the full documentation at: /cloud/reference/cli/commands/variable

```

#### `create`

```console
Create an environment variable.

Usage: scloud variable create [arguments]
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

  Create an environment variable called SERVICE_EMAIL with the value support@example.com.

    $ scloud variable create SERVICE_EMAIL support@example.com

  To create the variable from a file, use the --from-file option.
  The full content of the file will be used as the value.

    $ scloud variable create SERVICE_EMAIL --from-file email.txt

```

#### `update`

```console
Update an environment variable.

Usage: scloud variable update [arguments]
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

  Update an environment variable called SERVICE_EMAIL with a new value.

    $ scloud variable update SERVICE_EMAIL "noreply@example.com"

  To update the variable from a file, use the --from-file option.
  The full content of the file will be used as the value.

    $ scloud variable update SERVICE_EMAIL --from-file email.txt

```

#### `delete`

```console
Delete an environment variable.

Usage: scloud variable delete [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the environment variable. Can be passed as the first
                             argument.

Run "scloud help" to see global options.


Examples

  Delete an environment variable called SERVICE_EMAIL.

    $ scloud variable delete SERVICE_EMAIL

```
