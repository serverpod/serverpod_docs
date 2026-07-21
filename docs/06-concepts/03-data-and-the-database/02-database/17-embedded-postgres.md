---
description: Embedded PostgreSQL is a real PostgreSQL server that Serverpod starts and stops with your server, for local development and testing without Docker.
---

# Embedded PostgreSQL

New projects run an embedded PostgreSQL in the `development` and `test` run modes. It is a real PostgreSQL server that Serverpod starts and stops together with your server, so local development gets the same database engine as production without installing PostgreSQL or running Docker.

It is meant for local development and testing only. There are no backups, no replication, and nothing supervising the process, so staging and production connect to a managed or separately operated PostgreSQL instead. See [Connection](./connection) for those setups.

## Enable it

Embedded PostgreSQL is enabled by the `dataPath` setting, which generated projects already include:

```yaml title="config/development.yaml"
database:
  host: localhost
  port: 8090
  name: myproject
  user: postgres
  dataPath: .serverpod/development/pgdata
```

The rest of the database settings stay as they are. Serverpod uses `name` and `user` when it creates the database and reads the password from `config/passwords.yaml`, exactly as it would for an external instance. Remove `dataPath` to connect to the `host` and `port` instead.

A relative `dataPath` is resolved from the root of the server package, and each run mode needs its own directory, for example `.serverpod/test/pgdata` in `config/test.yaml`. The directory holds a complete database, so keep it out of version control.

## What happens when the server starts

The first start downloads the PostgreSQL binaries for your operating system and architecture into a per-user cache, which every later start and every other project reuses. Binaries are available for Linux and macOS on x64 and Arm64, and for Windows on x64.

Serverpod starts the database before it opens its connection pool, and connects over a Unix domain socket instead of a TCP port, so several projects can run at once without competing for ports. If another Serverpod process already runs a database in the same `dataPath`, the new process attaches to it rather than starting a second one.

The files under `dataPath` are kept when the server stops, so your data is still there on the next start. After an unclean exit, Serverpod clears the leftover process state and brings the database back up.

## Connect a database tool

Most clients like `psql` and `pgAdmin` connect over TCP, not the Unix socket the server uses. To inspect the data with one of them, start the database on its own while the server is stopped:

```bash
$ serverpod database start
```

It boots the database configured for the `development` run mode and keeps it listening on the configured port until you stop it with Ctrl+C. Connect with the `name` and `user` from that run mode's configuration, and the password from `config/passwords.yaml`.

Pass `--mode` to pick another run mode and `--port` to listen somewhere else:

```bash
$ serverpod database start --mode test --port 9090
```

## Run integration tests

Integration tests bring their own database, so there is nothing to install or start first:

```bash
$ dart test
```

Each test gets an isolated temporary data directory that is deleted on teardown, so tests cannot see each other's data or leave anything behind between runs. See [Get started with testing](../../testing/get-started) for the rest of the setup.

## Reset the database

To start from an empty database, stop the server and delete the directory `dataPath` points at. Serverpod creates a new one on the next start.

:::warning
Deleting `dataPath` permanently deletes the database and all local data stored in it.
:::

## Related

- [Connection](./connection): connecting to a PostgreSQL instance you run yourself.
- [Configuration](../../server-fundamentals/configuration#database-backends): the database section of the run mode configuration.
- [`serverpod database`](../../cli/commands/database): every option of the command above.
- [serverpod_embedded_postgres](https://pub.dev/packages/serverpod_embedded_postgres): the package behind this, for tools that need a PostgreSQL process of their own.
