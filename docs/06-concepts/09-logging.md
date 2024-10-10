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
- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED`: Controls whether session logs are output to the console.

#### Configuration File Example

You can also configure logging behavior directly in the configuration file:

```yaml
sessionLogs:
  persistentEnabled: true   # Logs are stored in the database
  consoleEnabled: true      # Logs are output to the console
```

### Important: Override Behavior

If `persistentEnabled` is set to `true` (whether via environment variables or configuration file) but **no database is configured**, the `persistentEnabled` value will be automatically overridden to `false`. This ensures that session logs are not attempted to be written to the database when it is not in use.

:::info

The Serverpod GUI is coming soon, making it easy to read, search, and configure the logs.

:::
