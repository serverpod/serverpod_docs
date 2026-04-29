## Usage

```console
Fetch Serverpod Cloud logs.

Usage: scloud log [arguments]
-h, --help                                                       Print this usage information.
-p, --project (mandatory)                                        The ID of the project.
                                                                 Can be omitted for existing
                                                                 projects that are linked. See
                                                                 `scloud project link --help`.
    --limit=<integer>                                            The maximum number of log records
                                                                 to fetch.
                                                                 (defaults to "50")
-u, --[no-]utc                                                   Display timestamps in UTC timezone
                                                                 instead of local.
    --until=<YYYY-MM-DDtHH:MM:SSz or duration[us|ms|s|m|h|d]>    Fetch records from before this
                                                                 timestamp. Accepts ISO date (e.g.
                                                                 "2024-01-15T10:30:00Z") or relative
                                                                 from now (e.g. "5m", "3h", "1d").
    --since=<YYYY-MM-DDtHH:MM:SSz or duration[us|ms|s|m|h|d]>    Fetch records from after this
                                                                 timestamp. Accepts ISO date (e.g.
                                                                 "2024-01-15T10:30:00Z") or relative
                                                                 from now (e.g. "5m", "3h", "1d").
                                                                 Can also be specified as the first
                                                                 argument.
    --tail                                                       Tail the log and get real time
                                                                 updates.

Run "scloud help" to see global options.


Examples

  View the most recent logs (default limit is 50 records).

    $ scloud log


  View the most recent logs with UTC timestamps and a custom limit.

    $ scloud log --utc --limit 100


  Stream logs in real-time.

    $ scloud log --tail


  View logs from the last hour using duration.

    $ scloud log 1h

    $ scloud log --since 1h


  View logs since a specific time using ISO date format:

    $ scloud log --since 2025-01-15T14:00:00Z

    $ scloud log --since "2025-01-15 14:00"

    $ scloud log --since 2025-01-15


  View logs in a time range using durations:

    $ scloud log --since 1h --until 5m


  View logs in a time range using ISO dates:

    $ scloud log --since 2025-01-15 --until 2025-01-16


  Mix ISO dates and durations:

    $ scloud log --since 2025-01-15T14:00:00Z --until 30m


See the full documentation at: /cloud/reference/cli/commands/log

```

