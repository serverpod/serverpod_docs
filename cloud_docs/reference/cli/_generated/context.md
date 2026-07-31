## Usage

```console
Manage the global project context.

The global project context is a locally stored setting that selects the project to use when it is
not specified by other means. Commands that act on a project use it as a last resort, after command
line arguments, environment variables, and the scloud.yaml project configuration file.

Usage: scloud context <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List the Serverpod Cloud projects available as context.
  set     Set the global project context to the given project ID.
  show    Show the current global project context.
  unset   Unset the global project context.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/context

```

### Sub commands

#### `list`

```console
List the Serverpod Cloud projects available as context.

Usage: scloud context list [arguments]
-h, --help    Print this usage information.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/context

```

#### `show`

```console
Show the current global project context.

Usage: scloud context show [arguments]
-h, --help    Print this usage information.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/context

```

#### `set`

```console
Set the global project context to the given project ID.

Usage: scloud context set [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project. Can be passed as the first argument.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/context

```

#### `unset`

```console
Unset the global project context.

Usage: scloud context unset [arguments]
-h, --help    Print this usage information.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/context

```
