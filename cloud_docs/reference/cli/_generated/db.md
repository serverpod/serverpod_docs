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

Service
  backup       Manage database backup snapshots.
  schedule     Manage the automated database backup schedule.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

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

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

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

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

```

#### `backup`

```console
Manage database backup snapshots.

Usage: scloud db backup <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create    Create a manual database backup snapshot.
  list      List the database backup snapshots.

Danger Zone
  delete    Delete a database backup snapshot.
  restore   Restore the live database to a backup snapshot.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

```

#### `schedule`

```console
Manage the automated database backup schedule.

Usage: scloud db schedule <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  set     Set (create or update) the automated backup schedule.
  show    Show the automated backup schedule.
  unset   Unset (disable) the automated backup schedule.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

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

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/db

```
