---
title: Upgrade to 3.5
description: Upgrade your Serverpod 3.4 project to 3.5 (Jetstream) by adopting serverpod start, the embedded Postgres option, and the new agent skills.
---

<!-- markdownlint-disable MD025 -->

# Upgrade to 3.5

Serverpod 3.5 (Jetstream) ships a new development workflow (`serverpod start`), an embedded Postgres option, and built-in agent skills. The changes are mostly opt-in: your existing 3.4 project keeps working with small updates.

This guide walks through the upgrade and should take about 15 minutes.

## Before you start

- Your project is on the latest Serverpod 3.4.x release.
- Your project compiles and tests pass.
- You've committed your current state to Git so you can roll back if needed.

## Update the Serverpod CLI

Install the 3.5 CLI:

```bash
$ dart pub global activate serverpod_cli 3.5.0-beta.9
```

Verify the version:

```bash
$ serverpod version
```

## Update your project dependencies

In each package's `pubspec.yaml` (`<project>_server`, `<project>_client`, `<project>_flutter`), bump the Serverpod packages to 3.5. Serverpod prefers an exact version pin over a caret range to keep the CLI and the packages in sync:

```yaml
dependencies:
  serverpod: 3.5.0-beta.9
  serverpod_client: 3.5.0-beta.9      # in the client and Flutter packages
  serverpod_flutter: 3.5.0-beta.9     # in the Flutter package
```

Also bump the Dart SDK constraint in the root `pubspec.yaml` and `<project>_server/pubspec.yaml` to match the 3.5 minimum:

```yaml
environment:
  sdk: '^3.10.3'
```

From the project's root folder, refresh dependencies (Dart workspaces resolve all sub-packages in one command), then regenerate the server and client code:

```bash
$ dart pub upgrade
$ serverpod generate
```

## Generate the 3.5 migration

3.5 adds a few new internal Serverpod tables and updates some indexes (such as `serverpod_future_call_claim` and indexes on `serverpod_log` and `serverpod_query_log`). Create a migration that captures these schema deltas so your database can be brought up to date:

```bash
$ serverpod create-migration
```

This writes a new migration to `<project>_server/migrations/`. It will be applied to your database in the next step.

## Adopt the new development workflow

3.5 replaces the `docker compose up` + `dart bin/main.dart` + `flutter run` triad with a single command, `serverpod start`, which runs the server, the database, and your Flutter app together with hot reload. Before running it, choose how to handle the database.

### Choose your data store

You can either switch to the new embedded Postgres or keep your existing Docker Postgres. The choice depends on whether you have development data you need to keep.

**Path A: switch to the embedded Postgres.** Add `dataPath` to the database section of `<project>_server/config/development.yaml` and `<project>_server/config/testing.yaml`:

```yaml
database:
  host: localhost
  port: 8090
  name: <project>
  user: postgres
  dataPath: .serverpod/dev/pgdata
```

For `testing.yaml`, use a separate directory, for example `dataPath: .serverpod/test/pgdata`.

:::warning

The embedded Postgres uses a fresh data directory, separate from your Docker volumes. If you have seeded development data you need to keep, follow Path B, or import your data into the new directory after switching.

:::

**Path B: keep your Docker Postgres.** No config change. You'll pass `--docker` to `serverpod start` so it uses your existing `docker-compose.yaml`.

:::warning

Make sure Docker is running before `serverpod start --docker`. If it isn't, `serverpod start` may fall back to the embedded Postgres path and connect your app to an empty database. This is harmless, but it can look like your data disappeared. Your Docker data is still in its volume. Start Docker and re-run `serverpod start --docker` to reconnect.

:::

### Start the server

From the project's root folder, run:

```bash
$ serverpod start            # Path A (embedded Postgres)
# or:
$ serverpod start --docker   # Path B (Docker Postgres)
```

The first run compiles the native build hooks (this can take ~30 seconds) and applies the migration you generated above. The server then starts, watches your project, and hot-reloads on save.

## Add the agent skills (optional)

3.5 ships AI agent skills (for editors like Claude Code and Cursor) and an MCP server. Install them with:

```bash
$ dart install skills
```

From your project's root folder, install the skills for your editor:

```bash
$ skills get --ide cursor
```

Replace `cursor` with the editor you use: `antigravity`, `claude`, `cline`, `codex`, `copilot`, `cursor`, `opencode`, or `generic`.

## Production deployment notes

Your production Dockerfile pattern (`dart compile exe bin/main.dart -o bin/server`) continues to work in 3.5. Build hooks run automatically during compilation. The only change you may need is to bump the Dart SDK base image to 3.10.x or newer:

```dockerfile
FROM dart:3.10.3 AS build
```

The embedded Postgres is a development convenience and does not run in production. Use a managed Postgres for your deployed server: [Serverpod Cloud](/cloud) provisions one for you automatically, or you can connect to a managed service like Cloud SQL or RDS.

## What's new in 3.5

- **`serverpod start` TUI**: hot reload on save, **R** to hot restart, **M** to create a migration, **A** to apply migrations, **P** to apply a repair migration.
- **Flutter app spawning** from `serverpod start` so the Flutter app runs alongside the server in the same TUI.
- **AI agent skills and MCP server** scaffolded during `serverpod create`; existing projects opt in with `dart install skills` and `skills get`.
- **Embedded Postgres**: zero-Docker development via `dataPath`.
- **SQLite database support** as an alternative dialect to Postgres.
- **Client-side database generation** for the Flutter app.
- **`jsonb` column support** with GIN index operator classes, and **`dynamic` fields** on models and endpoints.
- **`unique` keyword** for simpler unique indexes in model files.
- **`upsert` and `upsertRow`** on the ORM, and **`asc()` / `desc()`** convenience methods on orderable columns.
- **Recurring future calls** via the new claim-based scheduling.
- **OAuth2 PKCE Flutter web redirect** for sign-in flows.
- **Health endpoints** on the built-in webserver.
- **IDE and agent selection** in `serverpod create`.

### Migration concerns

These are not new features but can affect existing 3.4 projects:

- **`serverpod_database` package extraction.** Database types and helpers moved from `serverpod` into a new `serverpod_database` package. If you imported database APIs directly from `serverpod`, some of those imports now come from `serverpod_database`. The compiler will point out any imports that need updating after you run `dart pub upgrade`.
- **Logging revamp.** The logging API was reworked. If you have custom log handling, review your code against the new API.

## Troubleshooting

### Port conflicts on `serverpod start`

A previous `serverpod start` or a separate Postgres process may still be listening on 8090 or 8080. Stop the other process, or run on different ports.

### Agent skills aren't picked up after install

Run `skills get` again from the project's root folder. Some editors, like Cursor, require enabling the MCP server in their settings.

## Related

- [Migrations](../06-concepts/06-database/11-migrations.md): how Serverpod's migration system works under the hood.
- [Build your first app](../05-build-your-first-app/01-creating-endpoints.md): the hands-on tour of the 3.5 workflow if you want to see `serverpod start` from scratch.
