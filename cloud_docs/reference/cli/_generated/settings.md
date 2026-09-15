## Usage

```console
Manage local CLI user settings.

The "projectContext" setting selects the project to use when it is not specified by other means.
Commands that act on a project use it as a last resort, after command line arguments, environment
variables, and the scloud.yaml project configuration file.

Usage: scloud settings <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List local CLI user settings.
  set     Set a local CLI user setting.
  unset   Unset a local CLI user setting.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/settings

```

### Sub commands

#### `list`

```console
List local CLI user settings.

Usage: scloud settings list [arguments]
-h, --help    Print this usage information.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/settings

```

#### `set`

```console
Set a local CLI user setting.

Usage: scloud settings set [arguments]
-h, --help                Print this usage information.
    --name (mandatory)    The name of the setting. Can be passed as the first argument.

Value
    --value               The value of the setting. Can be passed as the second argument.

Run "scloud help" to see global options.


Examples

  Enable analytics.

    $ scloud settings set analytics true

  Disable analytics.

    $ scloud settings set analytics false

  Set the global project context.

    $ scloud settings set projectContext my-project

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/settings

```

#### `unset`

```console
Unset a local CLI user setting.

Usage: scloud settings unset [arguments]
-h, --help                Print this usage information.
    --name (mandatory)    The name of the setting. Can be passed as the first argument.

Run "scloud help" to see global options.


Examples

  Unset analytics.

    $ scloud settings unset analytics

  Unset the global project context.

    $ scloud settings unset projectContext

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/settings

```
