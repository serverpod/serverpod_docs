---
description: Configure Serverpod database connections for embedded PostgreSQL, external PostgreSQL, and SQLite, including passwords and connection pools.
---

# Connection

In Serverpod, the connection details and password for the database are stored inside the `config` directory in your server package. Serverpod automatically establishes a connection to the database instance by using these configuration details when you start the server.

New projects use an embedded PostgreSQL database for development and testing. You can instead connect to PostgreSQL running in Docker or on another host, or use SQLite.

### Connection details

Each environment configuration contains a `database` keyword that specifies the connection details.
For your development build you can find the connection details in the `config/development.yaml` file.

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
...
```

The `name` refers to the database name, `host` is the domain name or IP address pointing to your Postgres instance, `port` is the port that Postgres is listening to, and `user` is the username that is used to connect to the database.

:::caution
By default, Postgres is listening for connections on port 5432. However, the Docker container shipped with Serverpod uses port 8090 to avoid conflicts. If you host your own instance, double-check that the correct port is specified in your configuration files.
:::

Serverpod also supports SQLite as a database backend:

```yaml
...
database:
  filePath: server.db
...
```

Note that the same database backend must be used for all run modes. For more information, see the [configuration documentation](../../server-fundamentals/configuration#database-backends).

#### Configure search paths

If using Postgres, you can customize the search paths for your database connection. This is helpful if you're working with multiple schemas. By default, Postgres uses the `public` schema unless otherwise specified.

To override this, use the optional `searchPaths` setting in your configuration:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
  searchPaths:  custom, public
...
```

In this example, Postgres will look for tables in the `custom` schema first, and then fall back to `public` if needed. This gives you more control over where your data lives and how it's accessed.

:::tip
It is also possible to set the search paths using [runtime parameters](runtime-parameters) directly on the server startup (or on a specific transaction). If the paths are set on both the configuration file and as runtime parameters, the runtime parameters will take precedence.
:::

#### Configure connection pool size

By default, Serverpod uses a connection pool with a maximum of 10 connections to the database. You can customize this limit using the `maxConnectionCount` setting:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
  maxConnectionCount: 20
...
```

To allow unlimited connections, set `maxConnectionCount` to `0` or a negative value:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
  maxConnectionCount: 0  # Unlimited connections
...
```

You can also configure this setting via the environment variable `SERVERPOD_DATABASE_MAX_CONNECTION_COUNT`.

On SQLite, this configuration sets the number of read-only transactions that can run concurrently. Only one write transaction can run at a time.

### Database password

The database password is stored in a separate file called `passwords.yaml` in the same `config` directory. The password for each environment is stored under the `database` keyword in the file.

```yaml
...
development:
  database: '<MY DATABASE PASSWORD>'
...
```

No database password is required when using SQLite.

## Use embedded PostgreSQL

Embedded PostgreSQL runs a real PostgreSQL server as a child process of your Serverpod server. It is intended for local development and testing, where it provides the same PostgreSQL dialect without requiring Docker or a separately installed database server.

Set `dataPath` in the database section of `config/development.yaml`:

```yaml
database:
  host: localhost
  port: 8090
  name: my_project
  user: postgres
  dataPath: .serverpod/development/pgdata
```

Keep the other PostgreSQL settings in place. Serverpod uses `name` and `user` when it creates the embedded cluster, and reads the database password from `config/passwords.yaml`. Once `dataPath` is set, Serverpod starts the embedded database before opening its connection pool.

A relative `dataPath` is resolved from the root of the server package. Use a different directory for each run mode, for example `.serverpod/test/pgdata` in `config/test.yaml`. Keep these directories out of version control because they contain the complete local database cluster.

On the first start, Serverpod downloads the PostgreSQL binaries for the current operating system and architecture into a per-user cache:

- Linux: `$XDG_CACHE_HOME/serverpod`, or `~/.cache/serverpod` when `XDG_CACHE_HOME` is not set.
- macOS: `~/Library/Caches/serverpod`.
- Windows: `%LOCALAPPDATA%\serverpod\Cache`.

Later projects and starts reuse that cache. The package supports Linux on x64 and Arm64, macOS on x64 and Arm64, and Windows on x64. Other targets throw `UnsupportedPlatformException` before initialization.

The database files under `dataPath` persist when the server stops, so your development data remains available on the next start. Serverpod also repairs stale process metadata when possible after an unclean shutdown.

Serverpod connects to its embedded database through a Unix domain socket by default. This avoids reserving a TCP port and lets several projects run without port conflicts. If another Serverpod process already manages the same `dataPath`, the new process attaches to the running database instead of starting another PostgreSQL process.

The `SERVERPOD_DATABASE_DATA_PATH` environment variable overrides `database.dataPath` like other Serverpod configuration variables. Remove `dataPath` and the environment variable to return to the external PostgreSQL connection described by `host` and `port`.

Use embedded PostgreSQL only for development and testing. For staging and production, connect Serverpod to a managed or separately operated PostgreSQL instance. The embedded package does not provide backups, replication, high availability, or production process supervision.

### Reset the embedded database

To start with an empty database, stop the Serverpod server and delete the directory configured by `dataPath`. Serverpod creates a fresh PostgreSQL cluster the next time it starts.

:::warning

Deleting `dataPath` permanently deletes the database and all local data stored in it.

:::

### Use the package directly

Most Serverpod projects should configure `dataPath` and let Serverpod manage the database lifecycle. Use the `serverpod_embedded_postgres` package directly when a Dart tool or test harness needs its own PostgreSQL process.

Add direct dependencies on the embedded package and the PostgreSQL client package:

```bash
dart pub add serverpod_embedded_postgres postgres
```

Start the database, connect through the returned endpoint, and stop it when the process no longer needs it:

```dart
import 'dart:io';

import 'package:postgres/postgres.dart';
import 'package:serverpod_embedded_postgres/serverpod_embedded_postgres.dart';

Future<void> main() async {
  final postgres = await EmbeddedPostgres.start(
    EmbeddedPostgresOptions(
      dataDir: Directory('.serverpod/tool/pgdata'),
      databaseName: 'tool_database',
    ),
  );

  try {
    final connection = await Connection.open(postgres.endpoint);
    try {
      await connection.execute('SELECT 1');
    } finally {
      await connection.close();
    }
  } finally {
    await postgres.stop();
  }
}
```

The default `UnixTransport` uses a Unix domain socket. Use `TcpTransport` when another process or tool must connect over TCP:

```dart
final postgres = await EmbeddedPostgres.start(
  EmbeddedPostgresOptions(
    dataDir: Directory('.serverpod/tool/pgdata'),
    databaseName: 'tool_database',
    transport: const TcpTransport(port: 0),
  ),
);

print(postgres.connectionString);
```

Port `0` selects an available loopback port. The handle also exposes `connectionUri`, `endpoint`, `version`, `pid`, and `isRunning`.

Set `detach: true` in `EmbeddedPostgresOptions` only when the PostgreSQL process must survive after the Dart process exits. A later process can recover the handle with `EmbeddedPostgres.attach(dataDir)`. Detached processes require explicit lifecycle management.

For CI environments that cannot download binaries while tests run, pre-populate the binary cache:

```bash
dart run serverpod_embedded_postgres:prefetch
```

All package errors implement the sealed `EmbeddedPostgresException` type. Specific errors distinguish download and verification failures, unsupported platforms, initialization failures, startup timeouts, crashes, attachment failures, busy clusters, and incompatible PostgreSQL data directories.

Calling `stop()` leaves `dataDir` intact. Calling `reset()` stops PostgreSQL and deletes the cluster, its run directory, and its logs before a later start initializes a new cluster.

## Use PostgreSQL with Docker

Serverpod projects include a Docker Compose configuration that you can use instead of embedded PostgreSQL. Remove `dataPath` from the selected run-mode configuration, then run the following command from the root of the server package:

```bash
$ docker compose up --build --detach
```

To stop the database run:

```bash
$ docker compose stop
```

To remove the database and __delete__ all associated data, run:

```bash
$ docker compose down -v
```

## Connecting to a custom Postgres instance

Just like you can connect to the Postgres database inside the Docker container, you can connect to any other Postgres instance. There are a few things you need to take into consideration:

- Make sure that your Postgres instance is up and running and is reachable from your Serverpod server.
- You will need to create a user with a password, and a database.

### Connecting to a local Postgres server

If you want to connect to a local Postgres Server (with the default setup) then the `development.yaml` will work fine if you set the correct port, user, database, and update the password in the `passwords.yaml` file.

### Connecting to a remote Postgres server

To connect to a remote Postgres server (that you have installed on a VPS or VDS), you need to follow a couple of steps:

- Make sure that the Postgres server has a reachable network address and that it accepts incoming traffic.
- You may need to open the database port on the machine. This may include configuring its firewall.
- Update your Serverpod `database` config to use the public network address, database name, port, user, and password.

### Connecting to Google Cloud SQL

You can connect to a Google Cloud SQL Postgres instance in two ways:

1. Setting up the _Public IP Authorized networks_ (with your Serverpod server IP) and changing the database host string to the _Cloud SQL public IP_.
2. Using the _Connection String_ if you are hosting your Serverpod server on Google Cloud Run and changing the database host string to the Cloud SQL: `/cloudsql/my-project:server-location:database-name/.s.PGSQL.5432`.

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.

:::info
If you are using the `isUnixSocket` don't forget to add __"/.s.PGSQL.5432"__ to the end of the `host` IP address. Otherwise, your Google Cloud Run instance will not be able to connect to the database.
:::

### Connecting to AWS RDS

You can connect to an AWS RDS Instance in two ways:

1. Enable public access to the database and configure VPC/Subnets to accept your Serverpod's IP address.
2. Use the Endpoint `database-name.some-unique-id.server-location.rds.amazonaws.com` to connect to it from AWS ECS.

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.
