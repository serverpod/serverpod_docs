---
title: Upgrade to 3.5
description: Upgrade your Serverpod 3.4 project to 3.5 (Jetstream) by adopting serverpod start, the embedded Postgres option, and the new agent skills.
---

<!-- markdownlint-disable MD025 -->

# Upgrade to 3.5

Serverpod 3.5 (Jetstream) brings a unified `serverpod start` command with hot reload that runs your server, database, and Flutter app together. The release also includes an embedded Postgres option and optional AI agent skills for your editor. The changes are mostly opt-in: your existing 3.4 project keeps working with small updates.

This guide walks through the upgrade and should take about 15 minutes.

## Before you start

- Your project is on the latest Serverpod 3.4.x release.
- Your project compiles and tests pass.
- You've committed your current state to Git so you can roll back if needed.

## Update the Serverpod CLI

Install the 3.5 CLI:

```bash
$ dart install serverpod_cli 3.5.0-beta.9
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

From the project's root folder, refresh dependencies. Dart workspaces (used by projects created with the 3.3+ scaffold) resolve all sub-packages in one command:

```bash
$ dart pub upgrade
```

If your project doesn't use a Dart workspace (there's no `workspace:` block in the root `pubspec.yaml`), run `dart pub upgrade` separately in each sub-package. To adopt workspaces, see Dart's [pub workspaces documentation](https://dart.dev/tools/pub/workspaces).

Then refresh the generated server and client code:

```bash
$ serverpod generate
```

## Generate the 3.5 migration

Version 3.5 adds a few new internal Serverpod tables and updates some indexes to greatly improve logs performance on Insights. Create a migration that captures these schema deltas so your database can be brought up to date:

```bash
$ serverpod create-migration --tag "upgrade-3.5"
```

This writes a new migration to `<project>_server/migrations/`. It will be applied to your database in the next step.

## Adopt the new development workflow

Version 3.5 introduces a faster, integrated development workflow. The new `serverpod start` command runs your server, your Flutter app, and (optionally) your database in a single watch process with hot reload, replacing the manual `docker compose up` + `dart bin/main.dart` + `flutter run` triad. The result is a tighter edit-save-see-result loop and built-in tooling for migrations, hot restart, and agent skills.

Before running it, choose how to handle the database.

### Choose your data store

You have two paths. Pick the one that fits where you are today; both work with `serverpod start`.

#### Keep your Docker Postgres (easiest upgrade)

If you've been developing against a Docker Postgres on 3.4, you can keep it without changing your config. Pass `--docker` to `serverpod start` so it uses your existing `docker-compose.yaml`:

```bash
$ serverpod start --docker
```

`serverpod start --docker` will start Docker for you if it isn't running, and will tear down the compose stack on exit if it was the one that started it.

#### Switch to the embedded Postgres (recommended for new development)

Version 3.5 ships a built-in Postgres that runs as a child process of your Dart server, using the same Postgres dialect as production. It has practical advantages over Docker for day-to-day development:

**Pros:**

- No Docker dependency.
- No TCP port conflicts (uses a Unix domain socket by default).
- Cleanup by deleting the data directory.

**Trade-offs:**

- Tests must run with `--concurrency=1` (the cluster is single-tenant).
- Manual access (e.g. with `psql`) requires a Dart process to be running the cluster.

To switch, add `dataPath` to the database section of `<project>_server/config/development.yaml` and `<project>_server/config/testing.yaml`:

```yaml
database:
  host: localhost
  port: 8090
  name: <project>
  user: postgres
  dataPath: .serverpod/dev/pgdata
```

For `testing.yaml`, use a separate directory, for example `dataPath: .serverpod/test/pgdata`.

Once `dataPath` is set, `serverpod start` uses the embedded Postgres automatically:

```bash
$ serverpod start
```

`dataPath` belongs in `development.yaml` and `testing.yaml` only. For production, use a managed Postgres: [Serverpod Cloud](/cloud) provisions one for you, or you can connect to a managed service like Cloud SQL or RDS. Do not add `dataPath` to `production.yaml` or `staging.yaml`.

:::warning

If you've added `dataPath` to your config and also pass `--docker`, the server connects to the embedded Postgres rather than your Docker Postgres. `dataPath` is honored by the server process regardless of the `--docker` flag, which only controls whether `serverpod start` brings up the `docker-compose` stack. If that's not what you wanted, your Docker volume is still intact: remove `dataPath` from your config to use the Docker Postgres again.

:::

### Start the server

The first run compiles the native build hooks (this can take about 30 seconds) and applies the migration you generated above. The server then starts and watches your project; saving a file hot-reloads the code.

`serverpod start` also launches your Flutter app, in Chrome by default. Pass `--flutter-device <name>` to target a different device. For IDE debugging, projects scaffolded with 3.5 include a `launch.json` that runs `serverpod start` with the debugger attached; you can copy that file into your existing project from a fresh 3.5 scaffold if you want the same setup.

## Add the agent skills (optional)

Version 3.5 ships AI agent skills (for editors like Claude Code and Cursor) and an MCP server. Install them with:

```bash
$ dart install skills
```

From your project's root folder, install the skills for your editor:

```bash
$ skills get --ide cursor
```

Replace `cursor` with the editor you use: `antigravity`, `claude`, `cline`, `codex`, `copilot`, `cursor`, `opencode`, or `generic` to install at the `.agents` folder.

## Production deployment notes

Your production build needs to switch from `dart compile exe` to `dart build cli`. The 3.5 server includes native build hooks that `dart compile` doesn't support. The new build produces a bundle (executable plus its native libraries) rather than a single static binary, so your Dockerfile needs a few updates.

The fastest fix is to copy the updated Dockerfile from a fresh 3.5 project's `<project>_server/Dockerfile`. The key changes from the 3.4 pattern are:

- **Build from the project root**, not the server directory, so Dart workspaces resolve correctly:

    ```bash
    $ docker build -f <project>_server/Dockerfile .
    ```

- Use **`dart build cli`** instead of `dart compile exe`:

    ```dockerfile
    RUN dart build cli --target bin/main.dart --output build
    ```

- **Copy the bundle directory**, not a single executable. The bundle contains `bin/main` and `lib/*` (the native libraries):

    ```dockerfile
    COPY --from=build /app/<project>_server/build/bundle/ ./
    ```

- **Update ENTRYPOINT** to point at the bundled binary:

    ```dockerfile
    ENTRYPOINT ./bin/server --mode=$runmode --server-id=$serverid --logging=$logging --role=$role
    ```

- **Bump the Dart SDK base image** to 3.10.x or newer:

    ```dockerfile
    FROM dart:3.10.3 AS build
    ```


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

## Troubleshooting

### Port conflicts on startup

Running more than one Serverpod server on the same machine can conflict on the default ports (8080 for the main server, 8090 for the database). This is a long-standing limitation, not specific to `serverpod start`. Stop the other server, or run on different ports.

### Agent skills aren't picked up after install

Run `skills get` again from the project's root folder. Some editors, like Cursor, require enabling the MCP server in their settings.

## Related

- [Migrations](../06-concepts/06-database/11-migrations.md): how Serverpod's migration system works under the hood.
- [Build your first app](../05-build-your-first-app/01-creating-endpoints.md): the hands-on tour of the 3.5 workflow if you want to see `serverpod start` from scratch.
