---
title: Configuration reference
description: 'Every Serverpod configuration option: run settings, server and service ports, database, Redis, session logs, future calls, and code generation.'
---

# Configuration reference

Every configuration option Serverpod's core library reads. Options come from three sources: environment variables, the `config/<run-mode>.yaml` files, and the `ServerpodConfig` Dart object. Environment variables override the YAML files, and the Dart object overrides both. For how to choose between them, see [Configuration](../configuration).

## Run options

Set the run mode, server role, and boot behavior. Declare each per run mode in the matching `config/<mode>.yaml`, or as an environment variable.

| Environment variable             | Command line option        | Config file option   | Default     | Description                                                                                                      |
| -------------------------------- | -------------------------- | -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| SERVERPOD_RUN_MODE               | `--mode`                   | N/A                  | development | Configures the mode of the server instance. Valid options are `development`, `staging`, `production` and `test`. |
| SERVERPOD_SERVER_ID              | `--server-id`              | serverId             | default     | Configures the id of the server instance.                                                                        |
| SERVERPOD_SERVER_ROLE            | `--role`                   | role                 | monolith    | Configures the role of the server instance. Valid options are `monolith`, `serverless` and `maintenance`.        |
| SERVERPOD_LOGGING_MODE           | `--logging`                | logging              | normal      | Configures the logging level. Valid options are `normal`, and `verbose`.                                         |
| SERVERPOD_APPLY_MIGRATIONS       | `--apply-migrations`       | applyMigrations      | false       | Configures if migrations should be applied when the server starts.                                               |
| SERVERPOD_APPLY_REPAIR_MIGRATION | `--apply-repair-migration` | applyRepairMigration | false       | Configures if repair migrations should be applied when the server starts.                                        |

## Server and services

Ports, hosts, and connection settings for the API, Insights, and web servers, the database, Redis, session logs, and future calls.

| Environment variable                      | Config file                   | Default   | Description                                                                                                                                                                       |
| ----------------------------------------- | ----------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SERVERPOD_API_SERVER_PORT                 | apiServer.port                | 8080      | The port number for the API server                                                                                                                                                |
| SERVERPOD_API_SERVER_PUBLIC_HOST          | apiServer.publicHost          | localhost | The public host address of the API server                                                                                                                                         |
| SERVERPOD_API_SERVER_PUBLIC_PORT          | apiServer.publicPort          | 8080      | The public port number for the API server                                                                                                                                         |
| SERVERPOD_API_SERVER_PUBLIC_SCHEME        | apiServer.publicScheme        | http      | The public scheme (http/https) for the API server                                                                                                                                 |
| SERVERPOD_INSIGHTS_SERVER_PORT            | insightsServer.port           | -         | The port number for the Insights server                                                                                                                                           |
| SERVERPOD_INSIGHTS_SERVER_PUBLIC_HOST     | insightsServer.publicHost     | -         | The public host address of the Insights server                                                                                                                                    |
| SERVERPOD_INSIGHTS_SERVER_PUBLIC_PORT     | insightsServer.publicPort     | -         | The public port number for the Insights server                                                                                                                                    |
| SERVERPOD_INSIGHTS_SERVER_PUBLIC_SCHEME   | insightsServer.publicScheme   | -         | The public scheme (http/https) for the Insights server                                                                                                                            |
| SERVERPOD_WEB_SERVER_PORT                 | webServer.port                | -         | The port number for the Web server                                                                                                                                                |
| SERVERPOD_WEB_SERVER_PUBLIC_HOST          | webServer.publicHost          | -         | The public host address of the Web server                                                                                                                                         |
| SERVERPOD_WEB_SERVER_PUBLIC_PORT          | webServer.publicPort          | -         | The public port number for the Web server                                                                                                                                         |
| SERVERPOD_WEB_SERVER_PUBLIC_SCHEME        | webServer.publicScheme        | -         | The public scheme (http/https) for the Web server                                                                                                                                 |
| SERVERPOD_DATABASE_HOST                   | database.host                 | -         | The host address of the database                                                                                                                                                  |
| SERVERPOD_DATABASE_PORT                   | database.port                 | -         | The port number for the database connection                                                                                                                                       |
| SERVERPOD_DATABASE_NAME                   | database.name                 | -         | The name of the database                                                                                                                                                          |
| SERVERPOD_DATABASE_USER                   | database.user                 | -         | The user name for database authentication                                                                                                                                         |
| SERVERPOD_DATABASE_SEARCH_PATHS           | database.searchPaths          | -         | The search paths used for all database connections                                                                                                                                |
| SERVERPOD_DATABASE_REQUIRE_SSL            | database.requireSsl           | false     | Indicates if SSL is required for the database                                                                                                                                     |
| SERVERPOD_DATABASE_IS_UNIX_SOCKET         | database.isUnixSocket         | false     | Specifies if the database connection is a Unix socket                                                                                                                             |
| SERVERPOD_DATABASE_MAX_CONNECTION_COUNT   | database.maxConnectionCount   | 10        | The maximum number of connections in the database pool. Set to 0 or a negative value for unlimited connections.                                                                   |
| SERVERPOD_DATABASE_FILE_PATH              | database.filePath             | -         | The SQLite database file path. Set this instead of host/port/name/user when using SQLite.                                                                                         |
| SERVERPOD_REDIS_HOST                      | redis.host                    | -         | The host address of the Redis server                                                                                                                                              |
| SERVERPOD_REDIS_PORT                      | redis.port                    | -         | The port number for the Redis server                                                                                                                                              |
| SERVERPOD_REDIS_USER                      | redis.user                    | -         | The user name for Redis authentication                                                                                                                                            |
| SERVERPOD_REDIS_ENABLED                   | redis.enabled                 | false     | Indicates if Redis is enabled                                                                                                                                                     |
| SERVERPOD_REDIS_REQUIRE_SSL               | redis.requireSsl              | false     | Indicates if SSL is required for the Redis connection                                                                                                                             |
| SERVERPOD_MAX_REQUEST_SIZE                | maxRequestSize                | 524288    | The maximum size of requests allowed in bytes                                                                                                                                     |
| SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED  | sessionLogs.persistentEnabled | -         | Enables or disables logging session data to the database. Defaults to `true` if a database is configured, otherwise `false`.                                                      |
| SERVERPOD_SESSION_LOG_CLEANUP_INTERVAL    | sessionLogs.cleanupInterval   | 24h       | How often to run the log cleanup job. Duration string (e.g. `24h`, `2d`). Set to null to disable automated purging.                                                               |
| SERVERPOD_SESSION_LOG_RETENTION_PERIOD    | sessionLogs.retentionPeriod   | 90d       | How long to keep session log entries. Duration string (e.g. `30d`, `60d`). Set to null to disable time-based cleanup.                                                             |
| SERVERPOD_SESSION_LOG_RETENTION_COUNT     | sessionLogs.retentionCount    | 100000    | Maximum number of session log entries to keep. Set to null to disable count-based cleanup.                                                                                        |
| SERVERPOD_SESSION_CONSOLE_LOG_ENABLED     | sessionLogs.consoleEnabled    | -         | Enables or disables logging session data to the console. Defaults to `true` if no database is configured, otherwise `false`.                                                      |
| SERVERPOD_SESSION_CONSOLE_LOG_FORMAT      | sessionLogs.consoleLogFormat  | json      | The format for console logging of session data. Valid options are `text` and `json`. Defaults to `text` for run mode `development`, otherwise `json`.                             |
| SERVERPOD_FUTURE_CALL_EXECUTION_ENABLED   | futureCallExecutionEnabled    | true      | Enables or disables the execution of future calls.                                                                                                                                |
| SERVERPOD_FUTURE_CALL_CONCURRENCY_LIMIT   | futureCall.concurrencyLimit   | 1         | The maximum number of concurrent future calls allowed. If the value is negative or null, no limit is applied.                                                                     |
| SERVERPOD_FUTURE_CALL_SCAN_INTERVAL       | futureCall.scanInterval       | 5000      | The interval in milliseconds for scanning future calls                                                                                                                            |
| SERVERPOD_FUTURE_CALL_CHECK_BROKEN_CALLS  | futureCall.checkBrokenCalls   | -         | Enables or disables the automatic check for broken future calls on startup. By default, the server performs an automatic check if there are less than 1000 calls in the database. |
| SERVERPOD_FUTURE_CALL_DELETE_BROKEN_CALLS | futureCall.deleteBrokenCalls  | false     | Enables or disables the deletion of broken future calls when running the check on startup.                                                                                        |
| SERVERPOD_WEBSOCKET_PING_INTERVAL         | websocketPingInterval         | 30        | The interval in seconds between WebSocket ping messages sent to keep streaming connections alive. Must be a positive integer.                                                     |

## Code generation

Options for `config/generator.yaml`, which configures `serverpod generate`.

| Option                        | Type   | Default                     | Description                                                                                 |
| ----------------------------- | ------ | --------------------------- | ------------------------------------------------------------------------------------------- |
| type                          | string | server                      | The package type. Valid options are `server`, `module`, or `internal`.                      |
| nickname                      | string | -                           | For modules only. Defines how the module is referenced in code.                             |
| client_package_path           | string | ../[name]\_client           | Path to the client package relative to the server.                                          |
| server_test_tools_path        | string | test/integration/test_tools | Path where test tools are generated. Remove this to disable test tools generation.          |
| shared_packages               | list   | -                           | Paths to shared packages containing models usable by both server and client.                |
| modules                       | map    | -                           | Module dependencies with optional nicknames.                                                |
| extraClasses                  | list   | -                           | List of custom serializable classes to include in code generation.                          |
| serialize_as_jsonb_by_default | bool   | false                       | When true, all serializable fields default to `jsonb` storage instead of `json`.            |
| features                      | map    | \{database: true\}          | Feature flags. Currently only `database` is supported.                                      |
| experimental_features         | map    | -                           | Experimental features. Available keys: `all` (no experimental feature currently available). |

## Related

- [Configuration](../configuration): how the three configuration sources work, run modes, secrets, and package types.
- [Running your server](../start-command): the run mode and files the server loads on start.
