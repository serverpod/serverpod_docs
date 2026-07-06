---
title: Running your server
description: "Run your Serverpod project in development with serverpod start: code generation, hot reload, database migrations, and the companion Flutter app in one terminal."
---

# Running your server

During development you want one command that keeps your server, generated code, and app in sync as you edit, so a change shows up the moment you save it. The `serverpod start` command does exactly that: it generates the latest code, runs your server with hot reload, and launches your companion Flutter apps, all inside a single interactive terminal.

Run it from anywhere inside your project folder:

```bash
serverpod start
```

Use `serverpod start` for local development only. To run your server in production, deploy it instead. See [Deploy to Serverpod Cloud](../08-deployments/01-deploy-to-serverpod-cloud.md) or [Custom hosting](../08-deployments/custom-hosting/01-choosing-a-strategy.md).

## Save a file to hot-reload

While `serverpod start` is watching, which is the default, saving a file recompiles and hot-reloads the affected code without a restart. This covers your endpoints, models, and generated client, so the running server and the generated code stay in step as you work. When a change cannot be hot-reloaded, press **R** in the terminal to hot restart.

To start without watching, pass `--no-watch`. The server then runs through `dart run` with no incremental compilation.

## Manage migrations from the terminal

On boot, `serverpod start` applies any pending migrations. While it runs, you handle further schema changes from the interactive terminal without leaving the session. The terminal lists these shortcuts along the bottom:

- **M** creates a migration from your current model changes.
- **A** applies pending migrations to the database.
- **P** creates a repair migration to reconcile a database that has drifted from your migrations.

For how migrations work, see [Migrations](database/migrations).

## Choose a run mode

By default, `serverpod start` runs in the `development` run mode. To start in another mode, forward a `--mode` argument to the server after `--`:

```bash
serverpod start -- --mode staging
```

The run mode selects which configuration and passwords the server loads. See [Configuration](configuration) for what each mode reads. For every argument `serverpod start` forwards to the server, see the [`serverpod start` reference](cli/commands/start).

## Run the server on its own

By default, `serverpod start` also launches the companion Flutter apps marked `auto_launch: true` in the server's `pubspec.yaml`. To start only the server, disable that:

```bash
serverpod start --no-flutter
```

You can still launch an app on demand from the terminal afterwards. To run without the interactive terminal at all, for a script or CI, pass `--no-tui`.

## Related

- [`serverpod start` reference](cli/commands/start): every option, terminal shortcut, and forwarded server argument.
- [Configuration](configuration): the run modes and files the server loads on start.
- [Deploy to Serverpod Cloud](../08-deployments/01-deploy-to-serverpod-cloud.md): run your server in production instead of locally.
