---
sidebar_position: 5
title: Database
description: How Serverpod Cloud's managed PostgreSQL works, including provisioning, automatic server credentials, migrations on deploy, backups, user access, and resetting the database.
---

# Database

Most Serverpod apps need to persist data (user accounts, orders, session state). Serverpod Cloud can provision and run a managed PostgreSQL database alongside your project, so you don't have to set up or maintain Postgres yourself. When the database is enabled, Cloud handles provisioning, connection details for your server, migrations on every deploy, and backups. Direct access from tools like `psql` or a GUI client is opt-in and requires a database user that you create yourself.

The managed database runs on PostgreSQL 17 with TLS required, connection pooling on by default, and autoscaling compute.

## Enable the database

The database is opt-in. You choose whether to enable it when you create the project, and you can enable it in two ways:

- **Interactively with `scloud launch`.** Launch prompts you with *"Enable the database for the project?"* and defaults to yes.
- **Non-interactively with `--enable-db`.** Pass `--enable-db` (or `--no-enable-db`) to `scloud launch` to skip the prompt. The same flag is **required** on `scloud project create`: it has no default there, so you must pass one.

Once a project is created with the database enabled, the database is provisioned automatically and made available to your server on the next deploy.

If your project doesn't use a database, pass `--no-enable-db` instead.

## How your server connects

When the database is enabled, your deployed Serverpod server receives its connection details as environment variables, injected by Cloud:

| Variable                          | What it holds                       |
| --------------------------------- | ----------------------------------- |
| `SERVERPOD_DATABASE_HOST`         | The database host                   |
| `SERVERPOD_DATABASE_PORT`         | The port (5432 by default)          |
| `SERVERPOD_DATABASE_NAME`         | The database name                   |
| `SERVERPOD_DATABASE_USER`         | The server's database user          |
| `SERVERPOD_DATABASE_REQUIRE_SSL`  | Always `true`; TLS is required      |
| `SERVERPOD_PASSWORD_database`     | The server's database password      |

Your server reads these through Serverpod's standard configuration. You don't write them into `config/production.yaml` or `passwords.yaml`; Cloud supplies them at runtime. The server's password is managed by the platform and never exposed to you.

## Migrations run on every deploy

When Cloud deploys your server, the container starts with `--apply-migrations`. Any pending migrations in your project's `migrations/` directory are applied before the server begins serving requests.

If a migration fails to apply, the server fails to start and the deployment is reported as failed. Fix the migration in your project and redeploy. For a step-by-step walkthrough, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).

To undo a migration that already applied successfully, create a repair migration with `serverpod create-repair-migration` targeting the version you want to roll back to, then redeploy. Cloud applies the repair on the next deploy. Only the schema is rolled back; data is not. See the framework's [Migrations](/concepts/database/migrations#rolling-back-migrations) guide for details.

## Backups

Cloud takes regular backups of the managed database. Backup behavior is handled by the platform and doesn't require any configuration from you.

## Access the database directly

You can connect to the managed database from your machine, a GUI client, or `psql` for inspection and debugging. This is independent of how your server connects.

The steps:

1. Run `scloud db connection` to print the host, port, and database name.
2. Run `scloud db user create <username>` to create a superuser. The password is shown **once**; save it.
3. Connect from your client with the host, port, database, your username, and the saved password.

Both commands need to know which project you're working with. From a project directory that's been linked (any project created with `scloud launch` is linked automatically), the project ID is picked up from `scloud.yaml`. From anywhere else, pass `-p your-project-id`.

If you lose the password, run `scloud db user reset-password <username>` to reset it. The new password is also shown only once.

Any PostgreSQL-compatible client works. A few popular options:

- [Postico](https://eggerapps.at/postico/), a focused PostgreSQL client for macOS
- [pgAdmin](https://www.pgadmin.org/), the official open-source admin tool
- [DBeaver](https://dbeaver.io/), cross-platform and free for personal use
- [DataGrip](https://www.jetbrains.com/datagrip/), JetBrains' database IDE
- `psql`, the standard PostgreSQL command-line client
- A PostgreSQL VS Code extension if you prefer to stay in your editor

## Reset the database

The `scloud db wipe` command deletes all tables, all data, and all applied migrations from the managed database. It asks for confirmation by default.

```bash
scloud db wipe
```

After a wipe, your server will error on its next request because the schema is gone. Redeploy with `scloud deploy` to reapply migrations and bring the database back into a working state.

Use this when you want to start clean during development. **Do not wipe a production database.**

## Security

The managed database is built so you don't have to think about credentials in your code or your repo:

- **TLS is required for all connections.** Cloud sets `SERVERPOD_DATABASE_REQUIRE_SSL` to `true` for your server, and the same applies to direct connections from `psql` or a GUI client.
- **The server's password is managed by the platform.** It's never written into your repo and never shown to you. Your server reads it from the injected environment at runtime.
- **Direct access uses separate superusers that you create.** The server's user and the users you create with `scloud db user create` are distinct, so revoking or rotating a direct-access password does not affect the server.

## Performance

The managed database includes infrastructure features you'd otherwise wire up yourself:

- **Connection pooling is on by default.** The connection details returned by `scloud db connection` point at a pooled endpoint, so short-lived connections from many clients don't exhaust Postgres connection slots.
- **Compute autoscales.** The database scales compute up and down within bounds set by your plan, so you don't need to provision for peak traffic up front.

## Related

- [CLI reference: `scloud db`](/cloud/reference/cli/commands/db) for all `db` subcommands and options.
- [Deployments](/cloud/concepts/deployments) for how migrations apply during deploy.
