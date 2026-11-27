---
sidebar_position: 2
title: Logs
description: Serverpod Cloud shows your server's logs and sessions in the console, and the Cloud CLI fetches and filters runtime and build logs from the terminal.
---

# Logs

When a request fails, a deploy errors out, or you're chasing a slow endpoint, logs are where you go to find out what happened. Serverpod Cloud collects logs from your running server and from each deployment's build. You read them in the console or with the Serverpod Cloud CLI.

The console's **Sessions** tab groups logs by request, so it's the right starting point for tracing a single call end to end. The CLI is faster for filtering by time and for piping output to other tools.

## View logs in the console

Select your project in the [Serverpod Cloud console](https://console.serverpod.dev), then the **Logs**, **Sessions**, or **Deployments** tab.

- **Logs:** Everything your server prints, starting with the most recent records and then live as new ones arrive. Each record shows its time, its level, the podlet that printed it, and the session it belongs to, if any.
- **Sessions:** Every call to your server, with how long it took and what it queried. Select a session to see its messages and errors. If query logging and stack-trace capture are on for the project, you also see the database queries the session ran and the stack traces for any caught exceptions. Both add overhead, so they're off by default.
- **Deployments:** Select a deployment to see its build log, the output from building it. It shows package installation, compilation, warnings, and errors, so it's the first place to look when a deploy fails.

Sessions are stored in your project's database, so the **Sessions** tab needs a project with a database. Before the first deploy, the tab shows sample sessions. If your latest deployment is from before February 2026, redeploy once to see sessions.

## View logs from the terminal

The Serverpod Cloud CLI reads the same build and runtime logs as the console.

### Fetch build logs

Fetch the latest build log:

```bash
serverpod cloud build log
```

To inspect a specific deployment, pass its sequence number (where `0` is the latest) or its UUID from `serverpod cloud status deployment list`:

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

### Fetch runtime logs

Runtime logs are the live output of your deployed server. Each entry contains:

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

### Filter logs by time

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

### Stream logs

Follow new log records as they arrive:

```bash
serverpod cloud log --tail
```

Press `Ctrl+C` to stop. `--tail` cannot be combined with `--since` or `--until`.

## Configure session logging

Cloud sets two environment variables that control session logging:

- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED` is set to `true` when the project is created. Session logs are printed to the runtime console and appear in `serverpod cloud log` output. It is a regular project variable, so you can change it with `serverpod cloud variable set`.
- `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED` is set to `true` when the project has a database. Session logs are written to the database and appear in the console's **Sessions** tab. Cloud manages this variable.

See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for variable management.

## Clean up old session logs

Cloud projects don't clean up old session logs, so the log tables keep growing. The framework's cleanup defaults don't apply, because Cloud sets session-log variables. To turn cleanup on, set all three cleanup variables:

```bash
serverpod cloud variable set SERVERPOD_SESSION_LOG_CLEANUP_INTERVAL "24h"
serverpod cloud variable set SERVERPOD_SESSION_LOG_RETENTION_PERIOD "90d"
serverpod cloud variable set SERVERPOD_SESSION_LOG_RETENTION_COUNT "100000"
```

Adjust the values to fit your project. See [Purge old records](/concepts/operations/logging#purge-old-records) for what each setting does.

Then [restart your server](/cloud/concepts/deployments#restart-your-server) so the new values take effect.

For what the server records, which tables it writes to, and how retention works, see [Logging](/concepts/operations/logging) in the framework documentation.

## Troubleshooting

**Invalid timestamp format.** Use ISO 8601 form (`YYYY-MM-DDTHH:MM:SSZ`) or a supported duration string (`5m`, `2h`, `1d`).

**No logs appearing.** Check that the time range is correct, that the app is running and generating output, and (for `--tail`) that you haven't also passed `--since` or `--until`.

## Related

- [CLI reference: `log` command](/cloud/reference/cli/commands/log)
- [CLI reference: `build` command](/cloud/reference/cli/commands/build)
- [CLI reference: `status` command](/cloud/reference/cli/commands/status)
