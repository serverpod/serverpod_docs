## Usage

```console
Manage Serverpod Cloud secrets.

Usage: scloud secret <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List all secrets.
  set     Set a secret (create or update).
  unset   Remove a secret.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/secret

```

### Sub commands

#### `set`

```console
Set a secret (create or update).

Usage: scloud secret set [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the secret. Can be passed as the first argument.

Value
    --value                  The value of the secret. Can be passed as the second argument.
    --from-file              The name of the file with the secret value.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/secret

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

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/secret

```

#### `unset`

```console
Remove a secret.

Usage: scloud secret unset [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --name (mandatory)       The name of the secret. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/secret

```
