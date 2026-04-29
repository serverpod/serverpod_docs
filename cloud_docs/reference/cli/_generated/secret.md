## Usage

```console
Manage Serverpod Cloud secrets.

Usage: scloud secret <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create   Create a secret.
  delete   Delete a secret.
  list     List all secrets.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/secret

```

### Sub commands

#### `create`

```console
Create a secret.

Usage: scloud secret create [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the secret. Can be passed as the first argument.

Value
    --value                  The value of the secret. Can be passed as the second argument.
    --from-file              The name of the file with the secret value.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/secret

```

#### `list`

```console
List all secrets.

Usage: scloud secret list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/secret

```

#### `delete`

```console
Delete a secret.

Usage: scloud secret delete [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the secret. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/secret

```
