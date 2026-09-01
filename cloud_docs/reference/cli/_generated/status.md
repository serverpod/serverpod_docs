## Usage

```console
Show the live status of the project's podlets.

Usage: scloud status [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked (see the "project
                             link" command) or if a global project context is set (see the "context
                             set" command).
-u, --[no-]utc               Display timestamps in UTC timezone instead of local.

Run "scloud help" to see global options.


Examples

  Show the live status of the project's podlets.

    $ scloud status


  Show the live status of a specific project's podlets.

    $ scloud status --project my-project


See the full documentation at: https://docs.serverpod.dev/cloud/reference/cli/commands/status

```

