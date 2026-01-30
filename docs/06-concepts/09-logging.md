# Logging

Serverpod uses the database for storing logs; this makes it easy to search for errors, slow queries, or debug messages. To log custom messages during the execution of a session, use the `log` method of the `session` object. When the session is closed, either from successful execution or by failing from throwing an exception, the messages are written to the log. By default, session log entries are written for every completed session.

```dart
session.log('This is working well');
```

You can also pass exceptions and stack traces to the `log` method or set the logging level.

```dart
session.log(
  'Oops, something went wrong',
  level: LogLevel.warning,
  exception: e,
  stackTrace: stackTrace,
);
```

Log entries are stored in the following tables of the database: `serverpod_log` for text messages, `serverpod_query_log` for queries, and `serverpod_session_log` for completed sessions. Optionally, it's possible to pass a log level with the message to filter out messages depending on the server's runtime settings.

### Controlling Session Logs with Environment Variables or Configuration Files

You can control whether session logs are written to the database, the console, both, or neither, using environment variables or configuration files. **Environment variables take priority** over configuration file settings if both are provided.

#### Environment Variables

- `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED`: Controls whether session logs are written to the database.
- `SERVERPOD_SESSION_LOG_CLEANUP_INTERVAL`: How often to run the log cleanup job (duration string, e.g. `6h`, `24h`). Set to empty to disable automated purging.
- `SERVERPOD_SESSION_LOG_RETENTION_PERIOD`: How long to keep session log entries (duration string, e.g. `30d`, `6h`). Set to empty or omit to use the default (90 days).
- `SERVERPOD_SESSION_LOG_RETENTION_COUNT`: Maximum number of session log entries to keep. Set to empty or omit to use the default (100,000).
- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED`: Controls whether session logs are output to the console.
- `SERVERPOD_SESSION_CONSOLE_LOG_FORMAT`: The format for console logging (`text` or `json`). See [configuration](./configuration).

#### Configuration File Example

You can also configure logging behavior directly in the configuration file:

```yaml
sessionLogs:
  persistentEnabled: true   # Logs are stored in the database
  cleanupInterval: 6h       # Run cleanup every 6 hours
  retentionPeriod: 30d      # Keep entries for 30 days
  retentionCount: 5000      # Keep at most 5,000 entries
  consoleEnabled: true      # Logs are output to the console
```

Duration strings for the cleanup interval and retention period use the same format as in [models](./models#duration): e.g. `30d`, `6h`, `1d 2h 30min`.

### Default Behavior for Session Logs

By default, session logging behavior depends on whether the project has database support:

- **When a database is present**

  - `persistentEnabled` is set to `true`, meaning logs are stored in the database.
  - `consoleEnabled` is set to `false` by default, meaning logs are not printed to the console unless explicitly enabled.

- **When no database is present**

  - `persistentEnabled` is set to `false` since persistent logging requires a database.
  - `consoleEnabled` is set to `true`, meaning logs are printed to the console by default.

:::warning
If `persistentEnabled` is set to `true` but **no database is configured**, a `StateError` will be thrown. Persistent logging requires database support, and Serverpod ensures that misconfigurations are caught early by raising this error.
:::

:::info
You can use the companion app  **[Serverpod Insights](../tools/insights)** to read, search, and configure the logs.
:::

#### Log retention and automated purging

Since log entries are stored in the database when persistent logging is enabled, the logs table can grow without bound if not purged. Serverpod can automatically purge logs based on configurable retention policies to prevent unchecked storage growth.

##### Defaults values

- **Cleanup interval**: 24 hours — the cleanup job runs once per day.
- **Retention period**: 90 days — removes entries older than this.
- **Retention count**: 100,000 entries — removes entries that exceed this count.

If both time-based (retention period) and count-based (retention count) limits are set, entries are removed if they are either too old or beyond the maximum count, whichever is reached first.

:::note
Automatic cleanup is only available when persistent logging is enabled and the cleanup interval is configured.
:::

##### Customizing retention policies

All three settings are optional and can be set to `null` to disable the respective policy. If the `cleanupInterval` is set to `null`, no purging will run regardless of the other settings, and log tables can grow without bound until you run cleanup manually or re-enable the interval.

Configure retention and cleanup via [environment variables](#environment-variables) or the [configuration file](#configuration-file-example). For example, to keep 30 days and at most 5,000 entries, with cleanup every 6 hours:

```yaml
sessionLogs:
  persistentEnabled: true
  cleanupInterval: 6h
  retentionPeriod: 30d
  retentionCount: 5000
```
