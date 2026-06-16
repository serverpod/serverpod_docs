---
title: Logs
description: How Serverpod Cloud surfaces logs through Insights, the scloud CLI for terminal access and filtering, and session-log configuration.
---

# Logs

When a request fails, a deploy errors out, or you're chasing a slow endpoint, logs are where you go to find out what happened. Serverpod Cloud collects logs from your running app and from each deployment's build, and surfaces them through Serverpod Insights (a visual viewer in the Cloud console) and the `scloud` CLI.

Insights groups logs by session, so it's the right starting point for tracing a single request end-to-end. The CLI is faster for one-off filtering and is the only path to build logs from failed deploys.

## View logs in Insights

Open Insights from the Cloud console once a project is deployed. Sessions appear in a chronological list; selecting one expands into its messages, errors, and (when enabled per project) the database queries the session ran and the stack traces for any caught exceptions. Query logging and stack-trace capture add overhead, so they're off by default.

:::tip

Use Serverpod Insights for root-cause analysis. The session-grouped view makes it straightforward to follow a single request end-to-end, which is harder to do from terminal output.

:::

## View build logs

Build logs are emitted while Cloud builds your deployment package: package installation, compilation, warnings, and errors. They're the first place to look when a deploy fails. Fetch the latest build log:

```bash
scloud deployment build-log
```

Pass a sequence number (where `0` is the latest) or a UUID to inspect a specific deployment; `scloud deployment list` shows the IDs:

```bash
scloud deployment build-log 3
scloud deployment build-log 550e8400-e29b-41d4-a716-446655440000
```

For longer build logs, redirect to a file or filter inline:

```bash
scloud deployment build-log > build-log.txt
scloud deployment build-log | grep ERROR
```

For a step-by-step walkthrough of diagnosing and recovering from a failed deploy, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).

## View runtime logs

Runtime logs are the live output of your deployed service. Each entry contains:

- **Timestamp**: local time by default, UTC with `--utc`
- **Level**: `INFO`, `ERROR`, and so on
- **Content**: the log message body

Fetch the most recent records:

```bash
scloud log
```

By default this returns 50 records. Use `--limit` to fetch more (or fewer):

```bash
scloud log --limit 100
```

Pass `--utc` for UTC timestamps (useful when collaborating across time zones):

```bash
scloud log --utc
```

Pipe to standard shell tools for further filtering, or redirect to a file for sharing:

```bash
scloud log | grep ERROR
scloud log > project_logs.txt
```

## Filter logs by time

The `--since` and `--until` options accept either duration strings or ISO 8601 timestamps.

Duration strings cover recent windows:

```bash
scloud log 120s              # last 120 seconds
scloud log 5m                # last 5 minutes
scloud log 12h               # last 12 hours
scloud log 7d                # last 7 days
scloud log --since 1h --until 10m
```

ISO 8601 strings allow specific times:

```bash
scloud log --since "2026-06-15T14:00:00Z"
scloud log --since "2026-06-15T14:00:00Z" --until "2026-06-15T16:00:00Z"
```

Lower-precision ISO forms are also accepted:

```bash
scloud log --since "2026-06-15T14:00"     # without seconds
scloud log --since "2026-06-15T14"        # without minutes and seconds
scloud log --since "2026-06-15"           # just the date (starts at 00:00:00)
```

Duration and ISO forms can be mixed:

```bash
scloud log --since "2026-06-15T14:00:00Z" --until 30m
scloud log --since 1h --until "2026-06-15T16:00:00Z"
```

## Stream logs

Follow new log records as they arrive:

```bash
scloud log --tail
```

Press `Ctrl+C` to stop. `--tail` cannot be combined with `--since` or `--until`.

## Configure session logging

Two environment variables control session logging. With a database enabled (the typical Cloud configuration), the defaults are:

- `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED` defaults to `true`. Session logs are written to the database and visible in Insights.
- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED` defaults to `false`. Session logs are not printed to the runtime console and don't appear in `scloud log` output. Set it to `true` to enable both.

To change either default, set the value with `scloud variable set`. See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for variable management.

## Troubleshooting

**Invalid timestamp format.** Use ISO 8601 form (`YYYY-MM-DDTHH:MM:SSZ`) or a supported duration string (`5m`, `2h`, `1d`).

**No logs appearing.** Check that the time range is correct, that the app is running and generating output, and (for `--tail`) that you haven't also passed `--since` or `--until`.

## Related

- [CLI reference: `log` command](/cloud/reference/cli/commands/log)
- [CLI reference: `deployment` command](/cloud/reference/cli/commands/deployment)
