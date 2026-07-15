---
description: The serverpod start command runs your project in development, with code generation, hot reload, the database, migrations, and the Flutter app in one terminal.
---

# Running your server

As you build, one command keeps your server, database, generated code, and app in sync, so a change shows up the moment you save. The `serverpod start` command generates the latest code, starts your development database, runs your server with hot reload, and launches your companion Flutter apps, all inside a single interactive terminal.

Run it from your project's root folder or one of its package folders:

```bash
serverpod start
```

The interactive terminal shows a tab for the server and for each running app, with the most common actions along the bottom. Shortcuts are unshifted key presses: **M** means typing a lowercase `m`, while **Shift+M** produces the capital and triggers the variant. Press **H** for the full list of shortcuts, and **Q** to quit the session. If a session is already running for the project, a second `serverpod start` tells you so and exits. While the session runs, it also exposes an MCP endpoint that AI agents can use to drive it. See the [`serverpod mcp-server` reference](../cli/commands/mcp-server).

New projects use an embedded PostgreSQL database that the server manages for you, so there is nothing else to start. See [Database backends](./configuration#database-backends) for how it is configured and how to use an external database instead.

Use `serverpod start` for local development only. To run your server in production, deploy it instead. See [Deploy to Serverpod Cloud](../../deployments/deploy-to-serverpod-cloud) or [Custom hosting](../../deployments/custom-hosting/choosing-a-strategy).

## Save a file to hot reload

By default, `serverpod start` watches your project. Saving a file recompiles and hot reloads the affected code without a restart: endpoints, models, the generated client, web routes, and the running Flutter apps all stay in step as you work. Dependency changes are picked up too, so the session survives a `pub get`.

The **R** key adapts to the situation. In watch mode, where saves already hot reload, **R** performs a hot restart: use it when a change cannot be hot reloaded, such as code that only runs at startup. If the project has errors instead, the session stays open and tells you what failed; the server boots automatically once a save fixes the errors, or press **R** to retry the build and start.

To start without watching, pass `--no-watch`. Nothing reloads on save; there, **R** hot reloads on demand, and **Shift+R** restarts the server.

## Manage migrations from the terminal

On the first boot of a session, `serverpod start` applies any pending migrations. While it runs, you handle further schema changes from the terminal without leaving the session:

- **M** creates a migration from your current model changes.
- **A** applies pending migrations to the database.
- **P** creates a repair migration to reconcile a database that has drifted from your migrations. This shortcut is not shown in the bottom bar; press **H** to see it listed.

Hold **Shift** with **M** or **P** to force the migration: it is created even when there are no changes to record, and even when Serverpod warns that information may be destroyed, so force deliberately. For how migrations work, see [Migrations](../data-and-the-database/database/migrations).

## Choose a run mode

By default, `serverpod start` runs in the `development` run mode. To start in another mode, forward a `--mode` argument to the server after `--`:

```bash
serverpod start -- --mode staging
```

The run mode selects which configuration and passwords the server loads. See [Run modes](./configuration#run-modes) for what each mode reads. Flutter apps only launch in the `development` run mode.

## Run the server on its own

By default, `serverpod start` also launches the companion Flutter apps marked `auto_launch: true` in the server's `pubspec.yaml`. To start only the server, disable that:

```bash
serverpod start --no-flutter
```

You can still launch an app on demand: press **Ctrl+R** in the terminal to open the app launch panel.

If your project runs auxiliary services from a `docker-compose.yaml`, such as Redis, pass `--docker` to start them with the session.

To run without the interactive terminal, pass `--no-tui`. When the output is not a terminal, for example in CI, `serverpod start` falls back to plain output on its own.

## Run the server directly

Outside `serverpod start`, the server is a plain Dart program you can run yourself from the server package directory:

```bash
dart run bin/main.dart --apply-migrations
```

The server accepts arguments that control how it starts: `--mode` selects the run mode, `--role` selects the [server role](#choose-a-server-role), and `--apply-migrations` applies pending migrations during startup. Without `--apply-migrations`, the server starts against the schema as it is. See the [run options reference](../lookups/configuration-reference#run-options) for the full list, and the [Deploy](../../deployments/deploy-to-serverpod-cloud) section for running in production.

## Choose a server role

In production, the `--role` argument controls which parts of the server run:

- **`monolith`** (default) runs everything: the API, Insights, and web servers, plus [future calls](../scheduling/setup) and [health checks](../operations/health-checks).
- **`serverless`** serves requests only. Future calls and health checks are disabled, which fits platforms that start and stop instances on demand.
- **`maintenance`** starts no servers. It performs one-shot work, applying migrations when passed `--apply-migrations` and running any due future calls, then exits. The exit code reports success or failure, which makes it fit for CI jobs and scheduled maintenance tasks.

## Related

- [`serverpod start` reference](../cli/commands/start): every command-line option.
- [Configuration](./configuration): the run modes and files the server loads on start.
- [Migrations](../data-and-the-database/database/migrations): how schema changes reach the database.
- [Deploy to Serverpod Cloud](../../deployments/deploy-to-serverpod-cloud): run your server in production instead of locally.
