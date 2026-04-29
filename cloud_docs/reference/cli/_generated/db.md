## Usage

```console
Manage Serverpod Cloud DBs.

Usage: scloud db <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  connection   Show the connection details for a Serverpod Cloud DB.
  user         Manage database users.

Danger Zone
  wipe         Irreversibly wipe and recreate the database, deleting all data and schema changes.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/db

```

### Sub commands

#### `connection`

```console
Show the connection details for a Serverpod Cloud DB.

Usage: scloud db connection [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/db

```

#### `user`

```console
Manage database users.

Usage: scloud db user <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create           Create a new superuser in the Serverpod Cloud DB.
  reset-password   Reset a password in the Serverpod Cloud DB.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/db

```

#### `wipe`

```console
Irreversibly wipe and recreate the database, deleting all data and schema changes.

Usage: scloud db wipe [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/db

```
