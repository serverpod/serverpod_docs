---
sidebar_position: 2
title: Logs
description: How Serverpod Cloud surfaces logs through Insights, the Serverpod Cloud CLI for terminal access and filtering, and session-log configuration.
---

# Logs

When a request fails, a deploy errors out, or you're chasing a slow endpoint, logs are where you go to find out what happened. Serverpod Cloud collects logs from your running app and from each deployment's build, and surfaces them through Serverpod Insights (a visual viewer in the Cloud console) and the Serverpod Cloud CLI.

Insights groups logs by session, so it's the right starting point for tracing a single request end-to-end. The CLI is faster for one-off filtering and is the only path to build logs from failed deploys.

## View logs in Insights

Open Insights from the Cloud console once a project is deployed. Sessions appear in a chronological list; selecting one expands into its messages, errors, and (when enabled per project) the database queries the session ran and the stack traces for any caught exceptions. Query logging and stack-trace capture add overhead, so they're off by default.

:::tip

Use Serverpod Insights for root-cause analysis. The session-grouped view makes it straightforward to follow a single request end-to-end, which is harder to do from terminal output.

:::

## View build logs

Build logs are emitted while Cloud builds your deployment package: package installation, compilation, warnings, and errors. They're the first place to look when a deploy fails. Fetch the latest build log:

```bash
serverpod cloud build log
```

Pass a sequence number (where `0` is the latest) or a UUID to inspect a specific deployment; `serverpod cloud status deployment list` shows the IDs:

```bash
serverpod cloud build log 3
serverpod cloud build log 550e8400-e29b-41d4-a716-446655440000
```

For longer build logs, redirect to a file or filter inline:

```bash
serverpod cloud build log > build-log.txt
serverpod cloud build log | grep ERROR
```

For a step-by-step walkthrough of diagnosing and recovering from a failed deploy, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).

## View runtime logs

Runtime logs are the live output of your deployed service. Each entry contains:

- **Timestamp**: local time by default, UTC with `--utc`
- **Level**: `INFO`, `ERROR`, and so on
- **Content**: the log message body

Fetch the most recent records:

```bash
serverpod cloud log
```

By default this returns 50 records. Use `--limit` to fetch more (or fewer):

```bash
serverpod cloud log --limit 100
```

Pass `--utc` for UTC timestamps (useful when collaborating across time zones):

```bash
serverpod cloud log --utc
```

Pipe to standard shell tools for further filtering, or redirect to a file for sharing:

```bash
serverpod cloud log | grep ERROR
serverpod cloud log > project_logs.txt
```

## Filter logs by time

The `--since` and `--until` options accept either duration strings or ISO 8601 timestamps.

Duration strings cover recent windows:

```bash
serverpod cloud log 120s              # last 120 seconds
serverpod cloud log 5m                # last 5 minutes
serverpod cloud log 12h               # last 12 hours
serverpod cloud log 7d                # last 7 days
serverpod cloud log --since 1h --until 10m
```

ISO 8601 strings allow specific times:

```bash
serverpod cloud log --since "2026-06-15T14:00:00Z"
serverpod cloud log --since "2026-06-15T14:00:00Z" --until "2026-06-15T16:00:00Z"
```

Lower-precision ISO forms are also accepted:

```bash
serverpod cloud log --since "2026-06-15T14:00"     # without seconds
serverpod cloud log --since "2026-06-15T14"        # without minutes and seconds
serverpod cloud log --since "2026-06-15"           # just the date (starts at 00:00:00)
```

Duration and ISO forms can be mixed:

```bash
serverpod cloud log --since "2026-06-15T14:00:00Z" --until 30m
serverpod cloud log --since 1h --until "2026-06-15T16:00:00Z"
```

## Stream logs

Follow new log records as they arrive:

```bash
serverpod cloud log --tail
```

Press `Ctrl+C` to stop. `--tail` cannot be combined with `--since` or `--until`.

## Configure session logging

Cloud sets two environment variables that control session logging:

- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED` is set to `true` when the project is created. Session logs are printed to the runtime console and appear in `serverpod cloud log` output. It is a regular project variable, so you can change it with `serverpod cloud variable set`.
- `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED` is set to `true` when the project has a database. Session logs are written to the database and visible in Insights. Cloud manages this variable.

See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for variable management.

## Clean up old session logs

Cloud projects don't clean up old session logs, so the log tables keep growing. The framework's cleanup defaults don't apply, because Cloud sets session-log variables. To turn cleanup on, set all three cleanup variables and redeploy:

```bash
serverpod cloud variable set SERVERPOD_SESSION_LOG_CLEANUP_INTERVAL "24h"
serverpod cloud variable set SERVERPOD_SESSION_LOG_RETENTION_PERIOD "90d"
serverpod cloud variable set SERVERPOD_SESSION_LOG_RETENTION_COUNT "100000"
```

Adjust the values to fit your project. See [Purge old records](/concepts/operations/logging#purge-old-records) for what each setting does.

For what the server records, which tables it writes to, and how retention works, see [Logging](/concepts/operations/logging) in the framework documentation.

## Troubleshooting

**Invalid timestamp format.** Use ISO 8601 form (`YYYY-MM-DDTHH:MM:SSZ`) or a supported duration string (`5m`, `2h`, `1d`).

**No logs appearing.** Check that the time range is correct, that the app is running and generating output, and (for `--tail`) that you haven't also passed `--since` or `--until`.

## Related

- [CLI reference: `log` command](/cloud/reference/cli/commands/log)
- [CLI reference: `build` command](/cloud/reference/cli/commands/build)
- [CLI reference: `status` command](/cloud/reference/cli/commands/status)
