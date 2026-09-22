---
title: Upgrade to 4.0
description: Upgrade a Serverpod 3.4 project to 4.0 and switch to serverpod start, with steps for dependencies, code generation, the migration, and deployment.
---

<!-- markdownlint-disable MD025 -->

# Upgrade to 4.0

Serverpod 4.0 (Jetstream) adds `serverpod start`, one command that runs your server, database, and Flutter app together with hot reload. Upgrade your 3.4 project to 4.0, then run it with `serverpod start`.

The upgrade itself takes about 15 minutes: update the CLI and your dependencies, regenerate your code, and create one migration.

Compile errors after you regenerate are expected. Most match a section on [Breaking changes in 4.0](./breaking-changes-in-four). Plan for more time if breaking changes affect your code, or if you have a Dockerfile or CI workflows to update.

## Before you start

- You have Flutter 3.44.4 or later. It includes Dart 3.12.2, which Serverpod 4.0 requires. Check with `flutter --version`, and run `flutter upgrade` if your version is older.
- Your project is on the latest Serverpod 3.4.x release.
- Your project compiles and its tests pass.
- You have committed your current state to Git, so you can roll back if needed.
- You have no model changes waiting for a migration. If you do, create and apply that migration first.

## Update the Serverpod CLI

The 3.4 CLI was installed with `dart pub global activate`. Deactivate it before you install the 4.0 CLI:

```bash
$ dart pub global deactivate serverpod_cli
```

Then install the 4.0 CLI:

```bash
$ dart install serverpod_cli
```

Check that it reports a 4.0 version:

```bash
$ serverpod version
```

## Update your dependencies

Bump every Serverpod package your project uses to 4.0. Pin the exact version rather than a caret range, so the packages stay in sync with the CLI.

The packages are in the `pubspec.yaml` files of `<project>_server`, `<project>_client`, and `<project>_flutter`:

```yaml
dependencies:
  serverpod: 4.0.0                      # in the server package
  serverpod_client: 4.0.0               # in the client package
  serverpod_flutter: 4.0.0              # in the Flutter package

  # If you use the new auth module:
  serverpod_auth_idp_server: 4.0.0      # in the server package
  serverpod_auth_idp_client: 4.0.0      # in the client package
  serverpod_auth_idp_flutter: 4.0.0     # in the Flutter package

  # If you use the legacy serverpod_auth module:
  serverpod_auth_server: 4.0.0          # in the server package
  serverpod_auth_client: 4.0.0          # in the client package
  serverpod_auth_shared_flutter: 4.0.0  # in the Flutter package

dev_dependencies:
  serverpod_test: 4.0.0                 # in the server package
```

- **The block is not the full list.** Bump any other package whose name starts with `serverpod_` to the same version, such as `serverpod_cloud_storage_s3`.
- **Don't skip `serverpod_test` in `dev_dependencies`.** It pins `serverpod` to an exact version. If it stays on 3.4, `dart pub upgrade` fails.
- **If you use the legacy `serverpod_auth` module, expect code changes.** It keeps working on 4.0, but the client setup and Sign in with Apple need updating. See [the legacy auth changes](./breaking-changes-in-four#if-you-use-the-legacy-auth-module).
- **If you use the new auth module, check your Flutter app's `flutter_secure_storage` version.** The module needs 10.0.0 or newer, which most projects already have. If yours is still on 9.x, read [how to upgrade without signing out your Android users](./breaking-changes-in-four#if-you-use-the-new-auth-module-on-android) first.

Then bump the Dart SDK constraint in the root `pubspec.yaml` and `<project>_server/pubspec.yaml` to the 4.0 minimum:

```yaml
environment:
  sdk: '^3.12.2'
```

## Regenerate your code

**Check your model files first.** Rename each model file that ends in just `.yaml` or `.yml`, so `company.yaml` becomes `company.spy.yaml`. Otherwise, `serverpod generate` [stops with an error](./breaking-changes-in-four#model-files-use-the-spyyaml-extension).

Then refresh dependencies from the project's root folder:

```bash
$ dart pub upgrade
```

Projects created with the 3.3 scaffold or later use a Dart workspace, so this one command covers every sub-package. If the root `pubspec.yaml` has no `workspace:` block, run `dart pub upgrade` in each sub-package instead. To adopt workspaces, see Dart's [pub workspaces documentation](https://dart.dev/tools/pub/workspaces).

Now refresh the generated server and client code:

```bash
$ serverpod generate
```

**Expect errors here.** If the command reports `analysis skipped due to invalid Dart syntax` for an endpoint or future call file, that file usually still uses an API that changed. Fix each file the same way:

1. Find the matching section on [Breaking changes in 4.0](./breaking-changes-in-four).
2. Update the file.
3. Run `serverpod generate` again.

Repeat until the command finishes without errors.

Some changes don't cause an error, such as how future calls and messages behave. Scan the table on [Breaking changes in 4.0](./breaking-changes-in-four) for anything else that affects your project.

## Create the 4.0 migration

Version 4.0 adds a few internal Serverpod tables. It also updates some indexes to speed up logs in [Serverpod Insights](../tools/insights), the desktop log viewer.

Finish the previous step first. Then create the migration:

```bash
$ serverpod create-migration --tag "upgrade-4-0" --force
```

:::note

Without `--force`, the command stops with a warning, because this migration changes the authentication module's rate-limit table. The change is safe: accounts, sessions, and other auth data are untouched. The only side effect is that the counters in that table reset to zero.

If you don't use the authentication module, there is no warning, and the flag changes nothing.

:::

The command writes a new migration to `<project>_server/migrations/`. The `serverpod start` command applies it when you [start the server](#start-the-server) later in this guide.

If you run the server yourself instead, start it once from the server package with `dart run bin/main.dart --apply-migrations`. See [Run the server directly](../concepts/server-fundamentals/running-your-server#run-the-server-directly).

## Update your deployment

This step applies if you compile your server, or if your project has the GitHub Actions workflows that 3.4 created. Otherwise, skip to [Switch to `serverpod start`](#switch-to-serverpod-start).

### Update the server build

If you compile your server with `dart compile exe`, for example in the `Dockerfile` in `<project>_server`, switch to `dart build cli`. The 4.0 server has native build hooks that `dart compile exe` doesn't support. Instead of a single static binary, the new command produces a bundle: an executable plus its native libraries.

If you deploy with the Dockerfile, copy the updated one from the [4.0 framework template](https://github.com/serverpod/serverpod/blob/main/templates/serverpod_templates/projectname_server/Dockerfile) or a fresh 4.0 project's `<project>_server/Dockerfile`. Compared with the 3.4 Dockerfile, the new one:

- Builds from the project root instead of the server directory.
- Copies the bundle directory.
- Points `ENTRYPOINT` at the bundled binary.
- Uses the `dart:3.12.2` base image or newer.

### Update the GitHub Actions workflows

If your project still has the GitHub Actions workflows that 3.4 created, replace them. The 3.4 workflows are `analyze.yml`, `format.yml`, and `tests.yml` in `.github/workflows/`. They set up an SDK older than the Dart 3.12.2 that 4.0 requires, so they fail after the upgrade. The `tests.yml` workflow also installs the 3.4 CLI.

Copy the 4.0 versions from the [framework templates](https://github.com/serverpod/serverpod/tree/main/templates/serverpod_templates/github/workflows) and fill in their placeholders:

- `projectname`: your project name.
- `CLI_VERSION`: `4.0.0`.
- `DB_TEST_PASSWORD` and `REDIS_TEST_PASSWORD`: the `test` passwords from `<project>_server/config/passwords.yaml`.

## Switch to `serverpod start`

Your project is now on 4.0, but you still run it the 3.4 way. The `serverpod start` command runs your server, your Flutter app, and your database in one terminal, and hot reloads your code when you save. It replaces running `docker compose up`, `dart bin/main.dart`, and `flutter run` separately.

See [Running your server](../concepts/server-fundamentals/running-your-server) for the full workflow. Before you run `serverpod start`, choose how to handle the database.

### Choose your data store

Both options work with `serverpod start`. For the fewest changes, keep your Docker Postgres.

#### Keep your Docker Postgres (easiest upgrade)

If you develop against a Docker Postgres on 3.4, you can keep it without changing your config.

The `serverpod start` command runs `docker compose up -d` when all of these are true:

- Your server package has a Docker Compose file.
- Your config points at a Postgres on `localhost` with no `dataPath`.
- The services aren't running.

On exit, the command runs `docker compose stop` for the services it started. It leaves the other services running.

New 4.0 projects use the `ghcr.io/serverpod/postgres:16` image, which bundles pgvector and PostGIS. Your existing `pgvector/pgvector:pg16` image keeps working. Switch to the new image when you need PostGIS. See [Upgrade to PostGIS](./upgrade-to-postgis).

#### Switch to the embedded Postgres (recommended for new development)

The embedded Postgres runs as a child process of your server and uses the same Postgres dialect as production. It needs no Docker. It connects over a Unix domain socket, so it doesn't compete for TCP ports. You can reset it by deleting its data directory. See [Embedded PostgreSQL](../concepts/data-and-the-database/database/embedded-postgres).

To switch, add `dataPath` to the database section of `<project>_server/config/development.yaml` and `<project>_server/config/test.yaml`:

```yaml
database:
  host: localhost
  port: 8090
  name: <project>
  user: postgres
  dataPath: .serverpod/development/pgdata
```

For `test.yaml`, use a separate directory, as new projects do: `dataPath: .serverpod/test/pgdata`.

The data directory holds a complete database, so keep it out of version control. Upgrading doesn't add the ignore rule that new projects get, so add this line to `<project>_server/.gitignore`:

```text
.serverpod/
```

Once `dataPath` is set, `serverpod start` uses the embedded Postgres automatically.

Don't add `dataPath` to `production.yaml` or `staging.yaml`. In production, use a managed Postgres, such as a [Serverpod Cloud](/cloud) database, Cloud SQL, or RDS.

The server reaches the embedded Postgres over the socket, but database tools like `psql` connect over TCP. To connect a tool, stop the server and run `serverpod database start`. See [Connect a database tool](../concepts/data-and-the-database/database/embedded-postgres#connect-a-database-tool).

:::note

With `dataPath` set, the server connects to the embedded Postgres even if you pass `--docker`. The `--docker` flag only controls whether `serverpod start` brings up the Docker Compose stack. Your Docker volume stays intact, so remove `dataPath` to go back to the Docker Postgres.

:::

### Start the server

From your project's root folder, run:

```bash
$ serverpod start
```

:::note

If you ran `serverpod start` before upgrading, delete the `<project>_server/.dart_tool/serverpod` folder before you run this command. It holds the server that `serverpod start` compiled earlier, and an old copy can stop the upgraded server at startup. The next run rebuilds it.

:::

On the first run, the command compiles the native build hooks, which can take about 30 seconds. It also applies the migration you created in [Create the 4.0 migration](#create-the-40-migration). Then the server starts and watches your project. When you save a file, the command hot reloads the code.

The command also launches your `<project>_flutter` app when that package exists. If the server's `pubspec.yaml` has a `serverpod: flutter_apps:` section, the command instead launches the apps in that section that set `auto_launch: true`.

#### Debug in VS Code

Your upgraded project keeps its 3.4 `launch.json`, which runs `bin/main.dart`. Projects created with 4.0 have a `launch.json` that attaches the debugger to the processes that `serverpod start` runs. Each configuration in that new file first runs the `serverpod_start` task from `tasks.json`. To copy both files into your project:

1. In an empty folder outside your project, create a throwaway 4.0 project with the same name as yours. Add `--template server` if your project has no Flutter app.

   ```bash
   $ serverpod create <project>
   ```

2. Copy `tasks.json` and `launch.json` from the throwaway project's `.vscode` folder into your project's `.vscode` folder, replacing the old files.
3. If `tasks.json` sets `SERVERPOD_PASSWORD_database`, replace its value with the `database` password under `development` in `<project>_server/config/passwords.yaml`. The environment variable overrides `passwords.yaml`. If you leave the throwaway project's password in place, the server gets the wrong database password.

## Verify

Your project runs on 4.0 when these three checks pass:

- **The server starts.** With `serverpod start`, or with `dart run bin/main.dart --apply-migrations` if you run the server yourself.
- **The migration is applied.** The log shows no `Database does not match target state` warning. If it does, see [Troubleshooting](#troubleshooting).
- **Your tests pass.** Run them the way you did before the upgrade.

## Set up the agent workflow

Version 4.0 ships AI agent skills and MCP servers for editors like Claude Code and Cursor. A new project gets them from `serverpod create`. An upgraded project does not, so this step installs the skills and registers the MCP servers by hand. Once set up, your agent can hot reload your server, create and apply migrations, launch your Flutter app, and read the logs.

:::warning

Don't use `serverpod create .` to add the agent setup to an existing project. The command writes its template files over yours without checking whether they exist. Your `server.dart` and config files lose their database, Redis, authentication, and web server setup. Your `passwords.yaml` gets new random passwords and secrets. Git can't restore the old file, because the default `.gitignore` excludes it.

:::

<details>
<summary>Everything the command can overwrite</summary>
<p>

In a folder that already has a Serverpod server, `serverpod create .` runs an upgrade. Depending on the options, it overwrites:

- `<project>_server/lib/server.dart`.
- The `development`, `staging`, `production`, `test`, and `generator` YAML files in `<project>_server/config/`.
- `<project>_server/config/passwords.yaml`, with new random passwords and secrets.
- `<project>_server/docker-compose.yaml` and the workflows in `.github/workflows/`.
- The scaffolded authentication endpoints in `<project>_server/lib/src/auth/`, and the scaffolded web server files in `<project>_server/lib/src/web/` and `<project>_server/web/`.
- `lib/main.dart`, `lib/client.dart`, and `lib/screens/greetings_screen.dart` in your Flutter app.
- `CLAUDE.md`, which becomes a pointer to an `AGENTS.md` file that the command doesn't create.

The command also adds dependencies to your `pubspec.yaml` files. In an interactive terminal on a project that already has migrations, it only asks which editors to set up. In that case, it turns every other option off, so the rewritten files lose your setup.

</p>
</details>

### Install the agent skills

Install the skills tool:

```bash
$ dart install skills
```

Then, from your project's root folder, pull the skills for your editor:

```bash
$ skills get --ide <editor>
```

Replace `<editor>` with the editor you use: `antigravity`, `claude`, `cline`, `codex`, `copilot`, `cursor`, or `opencode`. For VS Code, or to install the skills in the `.agents` folder, use `generic`.

### Register the MCP servers

Your agent uses two MCP servers: **Serverpod** and **Dart**. Register them in your editor's config file, at a path relative to your project's root folder. For Claude, create `.mcp.json`:

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

Replace `<project>_server` with the path to your server package, relative to the project root.

Each editor reads the servers from its own file:

| Editor | Config file | Format |
| --- | --- | --- |
| Claude | `.mcp.json` | The sample above. |
| Cursor | `.cursor/mcp.json` | The sample above. |
| VS Code | `.vscode/mcp.json` | The sample above, with the entries under a `servers` key instead of `mcpServers`. |
| Antigravity | `.agents/plugins/serverpod-local/mcp_config.json` | The sample above, with the Dart entry named `dart-mcp-server`. Antigravity also needs a `plugin.json` file in the same folder, with `"name"` set to `"serverpod-local"`. |
| Codex | `.codex/config.toml` | Codex's TOML format. Pass `--force-roots-fallback` to `dart mcp-server`. |
| OpenCode | `opencode.json` | OpenCode's `mcp` format. |

In the Codex and OpenCode formats, register the same two commands as the sample: `serverpod mcp-server --server-dir <project>_server` and `dart mcp-server`.

If you are using Cursor, enable the **Serverpod** and **Dart** MCP servers in your project settings (_Cursor Settings_ > _Tools & MCPs_).

## What's new in 4.0

- **`serverpod start` terminal UI**: hot reload on save. Press **R** to hot restart, **M** to create and apply a migration, or **P** to create and apply a repair migration.
- **Simplified server initialization**: the generated `Serverpod` class comes with `Protocol` and `Endpoints` already set up, so `server.dart` needs only `Serverpod(args)`. Projects that keep their existing imports can stay on `Serverpod(args, Protocol(), Endpoints())`.
- **Flutter app launching** from `serverpod start`, so the Flutter app runs alongside the server in the same terminal UI.
- **AI agent skills and MCP servers** set up during `serverpod create`. Existing projects can [add them manually](#set-up-the-agent-workflow).
- **Embedded Postgres**: develop without Docker by setting `dataPath`.
- **SQLite database support** as an alternative dialect to Postgres.
- **Client-side database generation** for the Flutter app.
- **`jsonb` column support** with GIN index operator classes, and **`dynamic` fields** on models and endpoints.
- **`unique` keyword** for simpler unique indexes in model files.
- **`upsert` and `upsertRow`** on the ORM, and **`asc()` / `desc()`** convenience methods on orderable columns.
- **Recurring future calls** with `callRecurring`, on a fixed interval or a cron schedule. See [Recurring tasks](../concepts/scheduling/recurring-tasks).
- **OAuth2 PKCE Flutter web redirect** for sign-in flows.
- **Account merging** in the auth module, so a user can link a second sign-in method to an existing account. See [Merging accounts](../concepts/authentication/working-with-users#merging-accounts).
- **httpOnly cookie authentication for the web**, which keeps browser sign-in tokens out of storage that JavaScript can read. See [web authentication](../concepts/authentication/web-authentication).
- **Health endpoints** on the built-in web server.
- **IDE and agent selection** in `serverpod create`.

## Troubleshooting

### Port conflicts on startup

If you run more than one Serverpod server on the same machine, the servers can conflict on the default ports: 8080 for the main server and 8090 for the database. Stop the other server, or run on different ports.

### The server stops because the database doesn't match

After the upgrade, `serverpod start` can report that the latest migration is applied and then stop the server with these warnings:

```text
WARNING: The database does not match the target database:
WARNING: Database does not match target state.
Server stopped (exitCode: 1).
```

Stop `serverpod start`, delete the `<project>_server/.dart_tool/serverpod` folder, and run `serverpod start` again. If the warnings remain, create and apply the migration from [Create the 4.0 migration](#create-the-40-migration).

### Agent skills or MCP servers aren't picked up after setup

Run `skills get --ide <editor>` again from the project's root folder. Then check that your editor's MCP config file is at the path listed in [Register the MCP servers](#register-the-mcp-servers). That section also covers the extra steps some editors need, such as enabling the servers in Cursor.

## Still stuck?

If something here didn't go as expected, reach out on the [community page](../support).

## Related

- [Breaking changes in 4.0](./breaking-changes-in-four): every API and behavior change between 3.4 and 4.0, for looking up an error.
- [Running your server](../concepts/server-fundamentals/running-your-server): what the `serverpod start` command does, and the other ways to run your server.
- [Embedded PostgreSQL](../concepts/data-and-the-database/database/embedded-postgres): how the embedded Postgres runs alongside your server, and how to reset it or connect a tool to it.
- [Migrations](../concepts/data-and-the-database/database/migrations): how Serverpod's migration system works under the hood.
- [Build your first app](../get-started/creating-endpoints): the hands-on tour of the 4.0 workflow, if you want to see `serverpod start` in a project built from scratch.
