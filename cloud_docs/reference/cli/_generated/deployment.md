## Usage

```console
Manage deployments.

Usage: scloud deployment <subcommand> [arguments]
-h, --help    Print this usage information.

Available subcommands:
  build-log   View a deployment's build log.
  list        List recent deployments.
  show        Show the status of a deployment.

Run "scloud help" to see global options.

See the full documentation at: /cloud/reference/cli/commands/deployment

```

### Sub commands

#### `show`

```console
Show the status of a deployment.

Usage: scloud deployment show [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked. See `scloud
                                 project link --help`.
-u, --[no-]utc                   Display timestamps in UTC timezone instead of local.
    --deploy=<<uuid|integer>>    View a specific deployment, with uuid or sequence number, 0 for
                                 latest. Can be passed as the first argument.
                                 (defaults to "0")
    --output-overall-status      View a deployment's overall status as a single word, one of:
                                 success, failure, awaiting, running, cancelled, unknown.

Run "scloud help" to see global options.


Examples

  Show the status of the latest deployment.

    $ scloud deployment show


  Show the status of a specific deployment by sequence number.

    $ scloud deployment show 3


  Show the status of a specific deployment by UUID.

    $ scloud deployment show 550e8400-e29b-41d4-a716-446655440000


See the full documentation at: /cloud/reference/cli/commands/deployment

```

#### `list`

```console
List recent deployments.

Usage: scloud deployment list [arguments]
-h, --help                   Print this usage information.
-p, --project (mandatory)    The ID of the project.
                             Can be omitted for existing projects that are linked. See `scloud
                             project link --help`.
    --limit=<integer>        The maximum number of records to fetch.
                             (defaults to "10")
-u, --[no-]utc               Display timestamps in UTC timezone instead of local.

Run "scloud help" to see global options.


Examples

  List the 10 most recent deployments.

    $ scloud deployment list


  List the 20 most recent deployments.

    $ scloud deployment list --limit 20


See the full documentation at: /cloud/reference/cli/commands/deployment

```

#### `build-log`

```console
View a deployment's build log.

Usage: scloud deployment build-log [arguments]
-h, --help                       Print this usage information.
-p, --project (mandatory)        The ID of the project.
                                 Can be omitted for existing projects that are linked. See `scloud
                                 project link --help`.
-u, --[no-]utc                   Display timestamps in UTC timezone instead of local.
    --deploy=<<uuid|integer>>    View a specific deployment, with uuid or sequence number, 0 for
                                 latest. Can be passed as the first argument.
                                 (defaults to "0")

Run "scloud help" to see global options.


Examples

  View the build log of the latest deployment.

    $ scloud deployment build-log


  View the build log of a specific deployment by sequence number.

    $ scloud deployment build-log 3


  View the build log of a specific deployment by UUID.

    $ scloud deployment build-log 550e8400-e29b-41d4-a716-446655440000


See the full documentation at: /cloud/reference/cli/commands/deployment

```
