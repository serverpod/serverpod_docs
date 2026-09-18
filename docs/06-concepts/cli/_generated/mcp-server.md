## Usage

```console
Start an MCP bridge to the `serverpod start` runner of one server project.

Usage: serverpod mcp-server
-h, --help          Print this usage information.
-s, --server-dir    Path to the server project directory (the package that contains a `serverpod` dependency). Auto-detected from the current working directory if omitted. Pass this flag explicitly in monorepos with multiple server projects.

Run "serverpod help" to see global options.
```


## Tools

The bridge exposes the following tools. Each one acts on the running `serverpod start` session, so they report an error when no session is running.

### `apply_migrations`

Apply pending database migrations without restarting the server. Call after creating a migration.

Takes no parameters.

### `create_migration`

Create a new database migration from the current model definitions. Only writes the migration files to disk, without applying to the database. Follow up with `apply_migrations` to apply the changes.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `force` | `boolean` | No | Create the migration even if warnings are present (data may be destroyed). Required for destructive migrations. |
| `tag` | `string` | No | Optional tag appended to the migration version name. |

### `create_repair_migration`

Create a repair migration that brings the live database in line with the target migration version (default: latest). Connects to the running server to read the live schema, diffs it against the target, and writes a `.sql` repair file. Use when a migration was partially applied or the database drifted out of sync. Does not apply the migration; follow up with `apply_migrations`.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `force` | `boolean` | No | Create the repair migration even when warnings are present or when no schema drift is detected (data may be destroyed). |
| `tag` | `string` | No | Optional tag appended to the repair migration version name. |
| `version` | `string` | No | Optional target migration version to repair against. Defaults to the latest migration version. |

### `get_flutter_app_dtd`

Return the Dart Tooling Daemon (DTD) URI for Flutter apps started from `serverpod start`. The JSON object is keyed by app id, the same ids used as keys under `serverpod: flutter_apps:` in the server pubspec. Apps that have not been launched are absent from the map; apps that have not published their DTD yet map to null; apps that have published their DTD map to their DTD URI.

Takes no parameters.

### `hot_reload`

Hot-reload the running server isolate, preserving in-memory state, and hot-reload the Flutter app (if one is running) so it picks up the changes. In `--watch` mode the runner auto-reloads on file changes, so this is mainly useful with `--no-watch`.

Takes no parameters.

### `hot_restart`

Restart the running server process, dropping all in-memory state, then hot-restart the Flutter app (if one is running) so it reconnects to the fresh server. Use when reload would not suffice (e.g. `main()` changes) or to recover a stuck isolate.

Takes no parameters.

### `spawn_flutter_app`

Start a Flutter app configured under `serverpod: flutter_apps:` in the server pubspec.yaml. No-op if the app is already running.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | `string` | No | Which Flutter app to target. The id is the map key on the server pubspec under `serverpod: flutter_apps:`. Ids are case-sensitive; pass the key exactly as written. Optional when only one app is configured. When multiple apps are configured and no `appId` is provided, the tool returns an error listing available ids. |

### `tail_flutter_logs`

Return recent raw stdout/stderr lines for a Flutter app started from `serverpod start`, newest last.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `appId` | `string` | No | Which Flutter app to target. The id is the map key on the server pubspec under `serverpod: flutter_apps:`. Ids are case-sensitive; pass the key exactly as written. Optional when only one app is configured. When multiple apps are configured and no `appId` is provided, the tool returns an error listing available ids. |
| `limit` | `integer` | No | Max lines to return (default 200, max 10000). |

### `tail_server_logs`

Return recent log entries from the running server (structured log entries plus completed operations). Newest last.

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `limit` | `integer` | No | Max entries to return (default 200, max 10000). |

## Resources

| Resource | Description |
| --- | --- |
| `serverpod://vm-service` | Dart VM service HTTP URI for the running server isolate. Stable across hot reloads; changes on restart (e.g. `hot_restart` or crash recovery). Subscribe to be notified when the URI changes. |
