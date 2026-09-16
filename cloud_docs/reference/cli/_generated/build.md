## Usage

```console
View build logs and manage build secrets.

Usage: scloud build <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  log      View a deployment's build log.
  secret   Manage build secrets.

Run "scloud help" to see global options.


Examples

  View the build log of the latest deployment.

    $ scloud build log


  List the current build secrets.

    $ scloud build secret list


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/build

```

### Sub commands

#### `log`

```console
View a deployment's build log.

Usage: scloud build log [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked (see the
                                 "project link" command) or if a global project context is set (see
                                 the "settings set projectContext" command).
-u, --[no-]utc                   Display timestamps in UTC timezone instead of local. Set
                                 SERVERPOD_CLOUD_DISPLAY_UTC=true to make UTC the default for all
                                 commands.
    --deploy=<<uuid|integer>>    View a specific deployment, with uuid or sequence number, 0 for
                                 latest. Can be passed as the first argument.
                                 (defaults to "0")

Run "scloud help" to see global options.


Examples

  View the build log of the latest deployment.

    $ scloud build log

  View the build log of a specific deployment by sequence number.

    $ scloud build log 3

  View the build log of a specific deployment by UUID.

    $ scloud build log 550e8400-e29b-41d4-a716-446655440000

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/build

```

#### `secret`

```console
Manage build secrets.

Build secrets are used to securely store sensitive information that needs to be
available when building your server, for example SSH keys.

Build secrets are not available at runtime.
(See `scloud variable set --secret` for managing runtime secrets:
https://docs.serverpod.dev/cloud/reference/cli/commands/variable)

Usage: scloud build secret <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list    List all build secrets.
  set     Set a build secret (create or update).
  unset   Remove a build secret.

Run "scloud help" to see global options.

Examples

  List the current build secrets.

    $ scloud build secret list

  Add or modify a build secret.

    $ scloud build secret set MY_SECRET_NAME "my-secret-value"

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/build

```
