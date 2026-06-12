---
description: Reference for the serverpod start command, covering every option, the terminal UI shortcuts for migrations and hot restart, and the server arguments it forwards.
---

# Start the server

The `serverpod start` command runs your project in development mode. It generates the latest code, starts the server with hot reload, and launches the companion Flutter app, all in a single interactive terminal.

```bash
serverpod start
```

Run it from your server package (e.g. `my_project_server/`), or from anywhere in the project and Serverpod auto-detects the server directory.

When it boots the server, `serverpod start` applies any pending migrations. While it runs, you create and apply new migrations from the terminal UI (see [Terminal UI shortcuts](#terminal-ui-shortcuts)).

## Usage

```bash
serverpod start [options] [-- <server-args>]
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `-w`, `--watch` / `--no-watch` | `true` | Watch files and use the Frontend Server for fast incremental compilation and hot reload. With `--no-watch`, the server is started with `dart run` instead. |
| `-d`, `--directory <path>` | auto-detect | The server package directory. Auto-detected from the current directory when omitted. |
| `--docker` / `--no-docker` | `false` | Start Docker Compose services if a `docker-compose.yaml` exists (typically Redis when running Postgres separately). |
| `--tui` / `--no-tui` | `true` | Show the interactive terminal UI. |
| `--flutter` / `--no-flutter` | `true` | Launch the project's Flutter app alongside the server when a companion Flutter package is present. |
| `--flutter-device <name>` | `chrome` | Device passed to `flutter run -d`. |
| `--flutter-option <arg>` | none | Extra argument forwarded to `flutter run`. Repeatable, e.g. `--flutter-option=--web-port=8090`. |
| `-h`, `--help` | | Print usage information. |

## Terminal UI shortcuts

The interactive terminal UI lists its shortcuts along the bottom. With the `serverpod start` terminal focused:

| Key | Action |
| --- | --- |
| **R** | Hot restart the server. |
| **M** | Create a migration from your current model changes (`Shift+M` to force). |
| **A** | Apply pending migrations to the database. |
| **P** | Create a repair migration to reconcile a drifted database (`Shift+P` to force). |

Saving a file hot-reloads the server automatically while watching is enabled.

## Passing arguments to the server

Arguments after `--` are forwarded to the server process. For example, to start the server in a specific run mode:

```bash
serverpod start -- --mode staging
```

The server accepts the following arguments:

| Argument | Allowed values | Description |
| --- | --- | --- |
| `-m`, `--mode` | `development`, `test`, `staging`, `production` | The run mode the server starts in. |
| `-r`, `--role` | `monolith`, `serverless`, `maintenance` | The role the server runs as. |
| `-l`, `--logging` | `normal`, `verbose` | The logging level. |
| `-i`, `--server-id` | any | The id of this server instance. |
| `-a`, `--apply-migrations` | | Apply pending database migrations on boot. |
| `-A`, `--apply-repair-migration` | | Apply the repair migration on boot. |

:::note
`serverpod start` is intended for local development. For production, deploy the server instead. See [Deploy to Serverpod Cloud](../deployments/deploy-to-serverpod-cloud) or [Custom hosting](../deployments/custom-hosting/choosing-a-strategy).
:::
