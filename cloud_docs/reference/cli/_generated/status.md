## Usage

```console
Show project and deployment status.

Usage: scloud status <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  deployment   Show deployment status.
  live         Show the live status of the project's podlets.

Run "scloud help" to see global options.


Examples

  Show the live status of the project's podlets.

    $ scloud status live


  Show the status of the latest deployment.

    $ scloud status deployment show


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/status

```

### Sub commands

#### `live`

```console
Show the live status of the project's podlets.

Usage: scloud status live [arguments]
-h, --help                                 Print this usage information.
-p, --project (mandatory)                  The ID of the project.
                                           Can be omitted for existing projects that are linked (see
                                           the "project link" command) or if a global project
                                           context is set (see the "settings set projectContext"
                                           command).
-u, --[no-]utc                             Display timestamps in UTC timezone instead of local. Set
                                           SERVERPOD_CLOUD_DISPLAY_UTC=true to make UTC the default
                                           for all commands.
    --watch                                Refresh the status until Ctrl+C is pressed.
    --interval=<integer[us|ms|s|m|h|d]>    How often --watch refreshes the status.
                                           (defaults to "5s")

Run "scloud help" to see global options.


Examples

  Show the live status of the project's podlets.

    $ scloud status live


  Show the live status of a specific project's podlets.

    $ scloud status live --project my-project


  Refresh the live status every 5 seconds until Ctrl+C is pressed.

    $ scloud status live --watch


  Refresh the live status every 30 seconds.

    $ scloud status live --watch --interval 30s


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/status

```

#### `deployment`

```console
Show deployment status.

Usage: scloud status deployment <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  list   List recent deployments.
  log    View a deployment's build log.
  show   Show the status of a deployment.

Run "scloud help" to see global options.

See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/status

```
