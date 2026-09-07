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
$ dart install serverpod_cli 4.0.0-beta.1
```

Verify the version:

```bash
$ serverpod version
```

## Update your project dependencies

In each package's `pubspec.yaml` (`<project>_server`, `<project>_client`, `<project>_flutter`), bump the Serverpod packages to 4.0. Serverpod prefers an exact version pin over a caret range to keep the CLI and the packages in sync:

```yaml
dependencies:
  serverpod: 4.0.0-beta.1
  serverpod_client: 4.0.0-beta.1      # in the client and Flutter packages
  serverpod_flutter: 4.0.0-beta.1     # in the Flutter package
```

Also bump the Dart SDK constraint in the root `pubspec.yaml` and `<project>_server/pubspec.yaml` to match the 4.0 minimum:

```yaml
environment:
  sdk: '^3.10.3'
```

### If you use the legacy auth module

The legacy `serverpod_auth` packages ship 4.0 releases. Bump every `serverpod_auth` package your project uses to the same version as Serverpod itself, in the same `pubspec.yaml` files:

```yaml
dependencies:
  serverpod_auth_server: 4.0.0-beta.1          # in the server package
  serverpod_auth_client: 4.0.0-beta.1          # in the client package
  serverpod_auth_shared_flutter: 4.0.0-beta.1  # in the Flutter package
```

The `authenticationKeyManager` parameter on the generated `Client` was removed in 4.0. Assign the key manager to the `authKeyProvider` field instead:

```dart
client = Client('http://$ipAddress:8080/')
  ..authKeyProvider = FlutterAuthenticationKeyManager()
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

The module keeps working on 4.0, so this can be done independently of moving to the new authentication framework. To make that move, see [Migrate from legacy auth](./migrate-from-legacy-auth) after completing this upgrade.

### If you use the new auth module on Android

`serverpod_auth_core_flutter` now requires `flutter_secure_storage` 10.0.0 or newer and allows 11.x. Most projects already resolve 10.x and are not affected.

If your Flutter app is still on 9.x, you have two options:

- **Upgrade directly to 11.x.** Version 11 dropped the code that migrates data written by 9.x, so users on Android are signed out and have to sign in again.
- **Upgrade to 10.x first.** Both 9.x to 10.x and 10.x to 11.x keep the session, so users stay signed in. Release a 10.x build, let it reach your users, then move to 11.x.

Projects created with `serverpod create` pin 10.x with a dependency override. To do the same, add this to the Flutter app's `pubspec.yaml`:

```yaml
dependency_overrides:
  flutter_secure_storage: ^10.0.0
```

Version 11 also requires `compileSdk = 37` in `android/app/build.gradle.kts`, which is higher than the current Flutter default.

From the project's root folder, refresh dependencies. Dart workspaces (used by projects created with the 3.3+ scaffold) resolve all sub-packages in one command:

```bash
$ dart pub upgrade
```

If your project doesn't use a Dart workspace (there's no `workspace:` block in the root `pubspec.yaml`), run `dart pub upgrade` separately in each sub-package. To adopt workspaces, see Dart's [pub workspaces documentation](https://dart.dev/tools/pub/workspaces).

Then refresh the generated server and client code:

```bash
$ serverpod generate
```

### If you use the legacy streaming endpoints API

Serverpod's legacy streaming endpoints API was deprecated in 3.0 and is removed in 4.0. Endpoints that use the `StreamingSession` type no longer compile, and all the related server and client methods (e.g. `streamOpened`, `streamClosed`, `handleStreamMessage`, `sendStreamMessage`, `getUserObject`, `setUserObject`, `openStreamingConnection`) are gone.

Port that code to [streaming methods](../concepts/endpoints-and-apis/streaming), where the endpoint declares `Stream` parameters and return types, and Serverpod manages the connection. State that used to live in a user object becomes a local variable in the streaming method, which stays alive as long as the stream is open. The old API stays documented in [Streaming endpoints](./archive/streaming-endpoints) while you port.

### If you use the Insights database endpoints from a service client

The Insights server endpoints that give direct database access (`fetchDatabaseBulkData`, `runQueries`, `getDatabaseRowCount`, and `executeSql`) are disabled by default in 4.0 and throw an `AccessDeniedException` until enabled. The Insights app doesn't use these endpoints, so most projects need no change. If you have custom tooling that calls them through the `serverpod_service_client` package, opt in per environment with `enableDatabaseAccess` in the `insightsServer` block of the config file (or the `SERVERPOD_INSIGHTS_SERVER_ENABLE_DATABASE_ACCESS` environment variable):

```yaml
insightsServer:
  port: 8081
  publicHost: localhost
  publicPort: 8081
  publicScheme: http
  enableDatabaseAccess: true
```

The `hotReload`, `getOpenSessionLog`, and `shutdown` Insights methods are removed. See [Insights](../tools/insights#database-access) for details.

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

If you've been developing against a Docker Postgres on 3.4, you can keep it without changing your config.

On projects whose config points at a Postgres on `localhost` with no `dataPath`, `serverpod start` brings up the `docker-compose` stack if it isn't running, and tears it down on exit if the command brought it up.

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

## Authentication changes

4.0 changes a few authentication behaviors that can affect existing apps:

- **The `?auth=` query parameter is no longer accepted.** Credentials never appear in URLs anymore: HTTP calls authenticate through the `Authorization` header (or an auth cookie on the web), and streaming connections authenticate in-band when the stream opens. Clients from before 4.0 that relied on the query parameter must be upgraded.
- **Signing in on top of another account is rejected.** Issuing a token for a different user from an already-authenticated session throws a `SignInWhileAuthenticatedException` on every platform; users must sign out before switching accounts. Server code that mints tokens on behalf of another user (such as an admin flow) calls the token manager's `createToken` instead, which skips this policy and returns the secrets in the response body.
- **Custom token managers extend a base class.** `TokenIssuer` and `TokenManager` are now base classes: implement `createToken` for the actual minting, and leave `issueToken` alone. It is non-virtual and applies the sign-in policy and cookie delivery for every token type.
- **Method streams close when the signed-in user changes.** On sign-in and sign-out, open method streams are closed gracefully (subscriptions receive `onDone` without an error) on all platforms, and new streams connect with the current identity. A same-identity token refresh keeps streams running.
- **Opt-in cookie auth for the web.** Enabling the new `authCookie` configuration requires listing every browser origin in `allowedOrigins`; browsers on unlisted origins lose cross-origin access, including to public endpoints. See [web authentication](../concepts/authentication/web-authentication).

## What's new in 4.0

- **`serverpod start` TUI**: hot reload on save, **R** to hot restart, **M** to create and apply a migration, **P** to create and apply a repair migration.
- **Simplified server initialization** with the generated `Serverpod` class that pre-wires `Protocol` and `Endpoints`, so `server.dart` needs only `Serverpod(args)`. Projects that keep their existing imports can stay on `Serverpod(args, Protocol(), Endpoints())`.
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
- **httpOnly cookie authentication for the web**, keeping browser sign-in tokens out of JavaScript-readable storage. See [web authentication](../concepts/authentication/web-authentication).
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

- [Migrations](../concepts/data-and-the-database/database/migrations): how Serverpod's migration system works under the hood.
- [Build your first app](../get-started/creating-endpoints): the hands-on tour of the 4.0 workflow if you want to see `serverpod start` from scratch.
