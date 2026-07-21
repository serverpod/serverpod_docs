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

## Embedded PostgreSQL

Embedded PostgreSQL runs a real PostgreSQL server as a child process of your Serverpod server, so local development and testing get the same PostgreSQL dialect as production without Docker or a separately installed database.

New projects already enable it in the `development` and `test` run modes through the `dataPath` setting:

```yaml
database:
  host: localhost
  port: 8090
  name: my_project
  user: postgres
  dataPath: .serverpod/development/pgdata
```

Leave the other PostgreSQL settings in place. Serverpod uses `name` and `user` when it creates the cluster and reads the password from `config/passwords.yaml`, the same as for an external instance. See [Database backends](../../server-fundamentals/configuration#database-backends) for how the setting fits into the rest of the configuration.

### Storage and platform support

A relative `dataPath` is resolved from the root of the server package, and every run mode needs its own directory, for example `.serverpod/test/pgdata` in `config/test.yaml`. Each directory holds a complete PostgreSQL cluster, so keep it out of version control.

The first start downloads the PostgreSQL binaries for the current operating system and architecture into a per-user cache, which every later start and every other project reuses:

- Linux: `$XDG_CACHE_HOME/serverpod`, or `~/.cache/serverpod` when `XDG_CACHE_HOME` is not set.
- macOS: `~/Library/Caches/serverpod`.
- Windows: `%LOCALAPPDATA%\serverpod\Cache`.

Binaries are available for Linux and macOS on x64 and Arm64, and for Windows on x64. On any other platform the server throws an `UnsupportedPlatformException` instead of starting.

### Lifecycle and recovery

Serverpod starts the embedded database before it opens the connection pool, and connects to it over a Unix domain socket instead of a TCP port. That way several projects can run at the same time without competing for ports. When another Serverpod process already manages the same `dataPath`, the new process attaches to the running database rather than starting a second one.

The files under `dataPath` are kept when the server stops, so your development data is still there on the next start. If the server exits uncleanly, Serverpod clears the leftover process state on the next start and brings the database back up.

### Resetting the database

To start from an empty database, stop the Serverpod server and delete the directory configured by `dataPath`. Serverpod initializes a new PostgreSQL cluster the next time it starts.

:::warning
Deleting `dataPath` permanently deletes the database and all local data stored in it.
:::

### Moving to an external PostgreSQL

Embedded PostgreSQL is for development and testing. It provides no backups, replication, high availability, or process supervision, so staging and production should connect to a managed or separately operated PostgreSQL instance.

Remove `dataPath` from the run mode's configuration to connect to the `host` and `port` instead. The `SERVERPOD_DATABASE_DATA_PATH` [environment variable](../../lookups/configuration-reference) overrides the setting, so make sure it is unset as well.

### Using the package directly

Configuring `dataPath` and letting Serverpod manage the lifecycle covers most projects. Use the `serverpod_embedded_postgres` package directly when a Dart tool or test harness needs a PostgreSQL process of its own.

Add the embedded package and the PostgreSQL client package as direct dependencies:

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

The default transport is `UnixTransport`, which uses a Unix domain socket. Switch to `TcpTransport` when another process or tool has to connect over TCP:

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

Port `0` selects an available loopback port. Besides `connectionString`, the returned handle exposes `connectionUri`, `endpoint`, `version`, `pid`, and `isRunning`.

Set `detach: true` in `EmbeddedPostgresOptions` when the PostgreSQL process has to outlive the Dart process that started it. A later process picks the handle back up with `EmbeddedPostgres.attach(dataDir)`, and is then responsible for stopping it.

In CI environments that cannot download binaries while the tests run, fill the binary cache in a separate step:

```bash
dart run serverpod_embedded_postgres:prefetch
```

Everything the package throws is an `EmbeddedPostgresException`. The type is sealed, so a `switch` over it covers every case: download and verification failures, unsupported platforms, initialization failures, startup timeouts, crashes, failed attachments, a cluster that is already busy, and an incompatible PostgreSQL data directory.

Calling `stop()` leaves `dataDir` intact. Calling `reset()` stops PostgreSQL and deletes the cluster, its run directory, and its logs, so the next start initializes a new cluster.

## PostgreSQL with Docker

Serverpod projects include a Docker Compose configuration that you can use instead of embedded PostgreSQL. Remove `dataPath` from the selected run mode's configuration, then run the following command from the root of the server package:

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
