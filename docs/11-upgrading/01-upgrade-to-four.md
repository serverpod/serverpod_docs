---
title: Upgrade to 4.0
description: Upgrading a Serverpod 3.4 project to 4.0 (Jetstream) brings serverpod start, the embedded Postgres option, and the new agent skills.
---

<!-- markdownlint-disable MD025 -->

# Upgrade to 4.0

Serverpod 4.0 (Jetstream) brings a unified `serverpod start` command with hot reload that runs your server, database, and Flutter app together. The release also includes an embedded Postgres option and optional AI agent skills for your editor. The changes are mostly opt-in: your existing 3.4 project keeps working with small updates.

This guide walks through the upgrade and should take about 15 minutes.

## Before you start

- Your project is on the latest Serverpod 3.4.x release.
- Your project compiles and tests pass.
- You've committed your current state to Git so you can roll back if needed.

## Update the Serverpod CLI

Install the 4.0 CLI:

```bash
$ dart install serverpod_cli 4.0.0-beta.0
```

Verify the version:

```bash
$ serverpod version
```

## Update your project dependencies

In each package's `pubspec.yaml` (`<project>_server`, `<project>_client`, `<project>_flutter`), bump the Serverpod packages to 4.0. Serverpod prefers an exact version pin over a caret range to keep the CLI and the packages in sync:

```yaml
dependencies:
  serverpod: 4.0.0-beta.0
  serverpod_client: 4.0.0-beta.0      # in the client and Flutter packages
  serverpod_flutter: 4.0.0-beta.0     # in the Flutter package
```

Also bump the Dart SDK constraint in the root `pubspec.yaml` and `<project>_server/pubspec.yaml` to match the 4.0 minimum:

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

## Generate the 4.0 migration

Version 4.0 adds a few new internal Serverpod tables and updates some indexes to greatly improve logs performance on Insights. Create a migration that captures these schema deltas so your database can be brought up to date:

```bash
$ serverpod create-migration --tag "upgrade-4.0"
```

This writes a new migration to `<project>_server/migrations/`. It will be applied to your database in the next step.

## Adopt the new development workflow

Version 4.0 introduces a faster, integrated development workflow. The new `serverpod start` command runs your server, your Flutter app, and (optionally) your database in a single watch process with hot reload, replacing the manual `docker compose up` + `dart bin/main.dart` + `flutter run` triad. The result is a tighter edit-save-see-result loop and built-in tooling for migrations, hot restart, and agent skills.

Before running it, choose how to handle the database.

### Choose your data store

You have two paths. Pick the one that fits where you are today; both work with `serverpod start`.

#### Keep your Docker Postgres (easiest upgrade)

If you've been developing against a Docker Postgres on 3.4, you can keep it without changing your config. Pass `--docker` to `serverpod start` so it uses your existing `docker-compose.yaml`:

```bash
$ serverpod start --docker
```

With `--docker`, `serverpod start` brings up Docker if it isn't running, and tears down the compose stack on exit if the command brought it up.

#### Switch to the embedded Postgres (recommended for new development)

Version 4.0 ships a built-in Postgres that runs as a child process of your Dart server, using the same Postgres dialect as production. It has practical advantages over Docker for day-to-day development:

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

The `dataPath` setting belongs in `development.yaml` and `testing.yaml` only. For production, use a managed Postgres: [Serverpod Cloud](/cloud) provisions one for you, or you can connect to a managed service like Cloud SQL or RDS. Do not add `dataPath` to `production.yaml` or `staging.yaml`.

:::warning

If you've added `dataPath` to your config and also pass `--docker`, the server connects to the embedded Postgres rather than your Docker Postgres. `dataPath` is honored by the server process regardless of the `--docker` flag, which only controls whether `serverpod start` brings up the `docker-compose` stack. If that's not what you wanted, your Docker volume is still intact: remove `dataPath` from your config to use the Docker Postgres again.

:::

### Start the server

The first run compiles the native build hooks (this can take about 30 seconds) and applies the migration you generated above. The server then starts and watches your project; saving a file hot-reloads the code.

Beyond the server, `serverpod start` also launches the project's Flutter apps configured with `auto_launch: true`. For IDE debugging, projects scaffolded with 4.0 include a `launch.json` that runs `serverpod start` with the debugger attached; you can copy that file into your existing project from a fresh 4.0 scaffold if you want the same setup.

## Set up the agent workflow (optional)

Version 4.0 ships AI agent skills and MCP servers (for editors like Claude Code and Cursor) that let your agent build, run, and inspect your server. A new project configures these during `serverpod create`, so the smoothest way to add the same setup to your upgraded project is to run the same command against the current directory.

:::warning

Configuration files you created manually can be overwritten, so commit your work before running the command.

:::

From the project's root folder, run:

```bash
$ serverpod create .
```

Serverpod detects the existing project and adds the missing pieces without touching your source code. It registers the **Serverpod** and **Dart** MCP servers and installs the agent skills for the editors you select. Each selected editor gets a config file in its own format: `.mcp.json` for Claude, `.cursor/mcp.json` for Cursor, and `.vscode/mcp.json` for VS Code. For Claude, `.mcp.json` looks like this:

```json
{
  "mcpServers": {
    "serverpod": {
      "command": "serverpod",
      "args": ["mcp-server", "--server-dir", "<project>_server"]
    },
    "dart": {
      "command": "dart",
      "args": ["mcp-server"]
    }
  }
}
```

VS Code's `.vscode/mcp.json` registers the same two servers but nests them under a `servers` key instead of `mcpServers`.

If you are using Cursor, enable the **Serverpod** and **Dart** MCP servers in your project settings (_Cursor Settings_ > _Tools & MCPs_).

### Install the skills without the MCP setup

If you already have the MCP servers configured and only want to install or refresh the agent skills, install the skills tool:

```bash
$ dart install skills
```

Then, from your project's root folder, pull the skills for your editor:

```bash
$ skills get --ide cursor
```

Replace `cursor` with the editor you use: `antigravity`, `claude`, `cline`, `codex`, `copilot`, `cursor`, `opencode`, or `generic` to install at the `.agents` folder.

## Production deployment notes

Your production build needs to switch from `dart compile exe` to `dart build cli`. The 4.0 server includes native build hooks that `dart compile` doesn't support, and produces a bundle (executable plus its native libraries) rather than a single static binary, so your Dockerfile needs a few updates.

Copy the updated Dockerfile from the [4.0 framework template](https://github.com/serverpod/serverpod/blob/main/templates/serverpod_templates/projectname_server/Dockerfile) or a fresh 4.0 project's `<project>_server/Dockerfile`. The key changes vs. the 3.4 pattern: build from the project root (not the server directory), copy the bundle directory, update `ENTRYPOINT` to point at the bundled binary, and bump the Dart SDK base image to 3.10.x or newer.

## What's new in 4.0

- **`serverpod start` TUI**: hot reload on save, **R** to hot restart, **M** to create a migration, **A** to apply migrations, **P** to apply a repair migration.
- **Flutter app spawning** from `serverpod start` so the Flutter app runs alongside the server in the same TUI.
- **AI agent skills and MCP servers** scaffolded during `serverpod create`; existing projects opt in by running `serverpod create .`.
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

### Agent skills or MCP servers aren't picked up after setup

Run `serverpod create .` again from the project's root folder. Some editors, like Cursor, require enabling the **Serverpod** and **Dart** MCP servers in their settings (_Cursor Settings_ > _Tools & MCPs_).

## Still stuck?

If something here didn't go as expected, reach out on the [community page](../support).

## Related

- [Migrations](../concepts/database/migrations): how Serverpod's migration system works under the hood.
- [Build your first app](../get-started/creating-endpoints): the hands-on tour of the 4.0 workflow if you want to see `serverpod start` from scratch.
