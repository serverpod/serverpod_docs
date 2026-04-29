## Usage

```console
Manage Serverpod Cloud projects.

Usage: scloud project <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  create   Create a Serverpod Cloud project.
  delete   Delete a Serverpod Cloud project.
  link     Link your local project to an existing Serverpod Cloud project.
  list     List the Serverpod Cloud projects.

Management
  user     Manage Serverpod Cloud project users.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```

### Sub commands

#### `create`

```console
Create a Serverpod Cloud project.

Usage: scloud project create [arguments]
-h, --help                     Print this usage information.
-p, --project (mandatory)      The ID of the project. Can be passed as the first argument.
    --plan=<starter|growth>    Selects the plan to use.
    --[no-]enable-db           Flag to enable the database for the project.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```

#### `delete`

```console
Delete a Serverpod Cloud project.

Usage: scloud project delete [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```

#### `list`

```console
List the Serverpod Cloud projects.

Usage: scloud project list [arguments]
-h, --help    Print this usage information.
    --all     Include deleted projects.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```

#### `link`

```console
Link your local project to an existing Serverpod Cloud project.

This command creates or updates the project configuration files in your local codebase to connect it
to an existing Serverpod Cloud project. It will:
  - Create or update the scloud.yaml configuration file with the project ID
  - Create a .scloudignore file if it does not exist
  - Update .gitignore to exclude the .scloud/ directory (if in a workspace)

The scloud.yaml file contains the project ID and is used by other scloud commands to identify which
Serverpod Cloud project to use. This file can be safely committed to version control as it only
contains the project identifier, not sensitive credentials.

Usage: scloud project link [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project. Can be passed as the first argument.
    --dart-version           Overrides the Dart SDK version to use for building the project.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```

#### `user`

```console
Manage Serverpod Cloud project users.

Usage: scloud project user <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  invite   Invite a user to a Serverpod Cloud project.
  list     List users in a Serverpod Cloud project.
  revoke   Revoke a user from a Serverpod Cloud project.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/project

```
