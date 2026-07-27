---
description: Serverpod records a log entry for calls, queries, and your own messages, stores them in the database or prints them to the console, and can purge old entries.
---

# Logging

Logging is how you find out what your server did after it did it: which calls ran, which queries were slow, and what failed. Serverpod records this for you, and you add your own messages on top.

There are four kinds of record, and the difference matters for everything below:

- **Session records** describe one unit of work, such as an endpoint call: how long it took, whether it failed, and which endpoint it hit.
- **Query records** describe individual database queries run during that session.
- **Log messages** are the entries you write yourself with `session.log`.
- **Stream messages** are the messages passed by [streaming](../endpoints-and-apis/streaming) sessions.

## Write your own messages

Call `log` on the [session](../endpoints-and-apis/sessions) you were given:

```dart
session.log('This is working well');
```

Pass a level, an exception, and a stack trace when something goes wrong:

```dart
session.log(
  'Oops, something went wrong',
  level: LogLevel.warning,
  exception: e,
  stackTrace: stackTrace,
);
```

Messages are collected while the session runs and written when it closes, whether it finished normally or threw.

## Where logs go

Records are written to the database, to the console, to both, or to neither.

In the database they land in four tables:

| Table | Holds |
| --- | --- |
| `serverpod_session_log` | One row per completed session. |
| `serverpod_log` | Your `session.log` messages. |
| `serverpod_query_log` | Database queries. |
| `serverpod_message_log` | Stream messages from streaming sessions. |

The last three reference the session row, so deleting a session row removes its queries and messages with it.

:::info
The companion app [Serverpod Insights](../../tools/insights) reads and searches these tables, and can change the runtime settings described below.
:::

## Which sessions get recorded

Not every session produces a row, and the default depends on the run mode.

In `development`, every completed session is recorded. In `staging`, `production`, and `test`, a session is recorded only when it ran longer than one second, it failed, or it produced a log, query, or message entry. Ordinary fast calls leave no row, which keeps the table to the sessions worth looking at.

These thresholds are runtime settings stored in the `serverpod_runtime_settings` table, so you can change them on a running server through Insights without redeploying. They control whether all sessions are logged, whether all queries are logged, what counts as slow, and the minimum level a message must have to be kept. You can also override them per endpoint and per method.

## Configure logging

Session logging is configured under `sessionLogs:` in your config file for the run mode, or through environment variables. Environment variables win over the config file, key by key.

| Setting | Environment variable | Default |
| --- | --- | --- |
| `persistentEnabled` | `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED` | `true` when a database is configured |
| `consoleEnabled` | `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED` | `true` in `development` or when there is no database, otherwise `false` |
| `consoleLogFormat` | `SERVERPOD_SESSION_CONSOLE_LOG_FORMAT` | `text` in `development`, otherwise `json` |
| `cleanupInterval` | `SERVERPOD_SESSION_LOG_CLEANUP_INTERVAL` | `24h`, but see [Purge old records](#purge-old-records) |
| `retentionPeriod` | `SERVERPOD_SESSION_LOG_RETENTION_PERIOD` | `90d`, but see [Purge old records](#purge-old-records) |
| `retentionCount` | `SERVERPOD_SESSION_LOG_RETENTION_COUNT` | `100000`, but see [Purge old records](#purge-old-records) |

```yaml
sessionLogs:
  persistentEnabled: true   # Store records in the database
  consoleEnabled: true      # Also print them
  cleanupInterval: 6h       # Purge every 6 hours
  retentionPeriod: 30d      # Keep 30 days
  retentionCount: 5000      # Keep at most 5,000 sessions
```

Durations use the same format as [model default values](../data-and-the-database/models#supported-default-values), such as `30d`, `6h`, or `1d 2h 30min`.

:::warning
Setting `persistentEnabled` to `true` without a configured database throws a `StateError` on startup. Persistent logging needs somewhere to persist to.

Persistent logging is also unavailable on SQLite, which cannot handle the concurrent writes it needs. The server warns and skips it. Nothing takes its place automatically, so enable `consoleEnabled` if you want records in the run modes where it defaults to off.
:::

:::info
Every environment variable in the table takes a real value. Setting one to an empty string is not a way to unset it: the server fails to start. To turn a policy off, set the key to `null` in the config file instead.
:::

## Purge old records

Log tables grow with every call your server handles, so Serverpod can delete old records for you. Cleanup runs on the `cleanupInterval`, and removes session rows that are either older than `retentionPeriod` or beyond the newest `retentionCount`, whichever applies first. Deleting a session row takes its query, message, and log rows with it.

The `cleanupInterval` setting is the switch for the whole job. With no interval set, nothing is purged whatever the two retention values say. Purging also requires `persistentEnabled`, since there is nothing to delete otherwise.

Cleanup is triggered by log writes rather than by a timer, so a server that is not logging anything does not purge. A single pass gives up after an hour, and the next interval starts a fresh one.

:::warning
The three cleanup settings only fall back to their defaults when `sessionLogs` is absent from your config entirely. If you set any one session-log key, in the config file or through an environment variable, the settings you did not set resolve to null rather than to the defaults in the table above, and that policy is switched off with no warning.

This affects new projects: the generated `development`, `test`, and `production` configs each contain a `sessionLogs` block, so purging is off in those run modes until you set the three values explicitly. Set `cleanupInterval`, `retentionPeriod`, and `retentionCount` together whenever you configure any part of `sessionLogs`.
:::

## Related

- [Configuration](../server-fundamentals/configuration): the config files these settings live in.
- [Configuration reference](../lookups/configuration-reference): every session-log key with its environment variable.
- [Sessions](../endpoints-and-apis/sessions): what a session is, and the `log` method.
- [Insights](../../tools/insights): reading logs and editing runtime settings.
