---
sidebar_position: 5
sidebar_label: Migrate a self-hosted database
description: Database migration from a self-hosted Serverpod server to Serverpod Cloud. Copy your data, users, and auth secrets with pg_dump and pg_restore.
---

# Migrate a self-hosted database

You run Serverpod and PostgreSQL yourself, for example with Docker Compose on a VPS, and you want to be on Serverpod Cloud instead. This guide takes your data, your users, and their sessions across.

It happens in two halves. Deploying your project to Cloud comes first, because that is what creates the tables from your migrations. Copying the rows comes second, out of your old database and into those tables.

## Before you start

You need:

- The Serverpod Cloud CLI set up and authenticated. See [Set up the Cloud CLI](/cloud/getting-started/installation).
- Your Serverpod project on your machine, with the same code and migrations that run on your server.
- Shell access to the server that runs your database.
- The PostgreSQL client tools (`pg_dump`, `pg_restore`, and `psql`) on your machine. Use the same major version as your self-hosted database or newer. See [PostgreSQL downloads](https://www.postgresql.org/download/).

The commands below use example names. Your database runs in a Docker Compose service called `postgres`, and your server runs in a service called `server`. The database is called `my_project`. Replace these names with your own.

Run the `docker compose` commands on your server, and the `serverpod cloud` commands from your project's `<project>_server` folder on your own machine.

## Deploy your project to Cloud

Create the project with the database enabled, and deploy it:

```bash
serverpod cloud launch
```

Cloud applies your migrations on deploy. Your tables now exist on Cloud, with no app data in them yet. See [Deploy your first app](/cloud/getting-started/launch) for the full walkthrough.

Your self-hosted database must be on the same migration versions. Check which versions it has:

```bash
docker compose exec postgres psql -U postgres -d my_project \
  -c "SELECT module, version FROM serverpod_migrations ORDER BY module;"
```

You run the same query against Cloud later in this guide. If the versions differ, bring your server up to date and deploy the same migrations to both.

## Copy your auth secrets to Cloud

Cloud generates its own auth secrets for a new project. Your users' passwords and sessions depend on the secrets from your server, so they stop working with the new ones:

- Signing in with a correct password fails with `invalidCredentials`.
- Refreshing a session fails with `RefreshTokenInvalidSecretException`, and the server deletes that refresh token.

Copy the values from the `production` section of your server's `config/passwords.yaml`, or from the matching `SERVERPOD_PASSWORD_*` environment variables:

```bash
serverpod cloud password set emailSecretHashPepper "<value from your server>"
serverpod cloud password set jwtHmacSha512PrivateKey "<value from your server>"
serverpod cloud password set jwtRefreshTokenHashPepper "<value from your server>"
```

Set every other password your server reads the same way, for example `serverSideSessionKeyHashPepper` or the client secrets for your sign-in providers. Then deploy, so the server picks up the new values:

```bash
serverpod cloud deploy
```

:::warning

Copy the secrets before you restore any users. When a session refresh fails on a mismatched secret, the server deletes that refresh token. The user is signed out and has to sign in again, and setting the secrets afterwards doesn't bring the session back.

:::

## Stop your self-hosted server

Stop the server, so no new rows are written after you take the dump. Keep PostgreSQL running:

```bash
docker compose stop server
```

Your API is offline from here until your apps point at Cloud.

## Dump your data

Take a data-only dump. Leave out the data Serverpod keeps about each deployment, such as logs, health checks, and migration history. Cloud wrote its own rows for those tables when it deployed your project:

```bash
docker compose exec -T postgres pg_dump -U postgres -d my_project \
  --data-only --format=custom \
  --exclude-table-data='serverpod_migrations*' \
  --exclude-table-data='serverpod_runtime_settings*' \
  --exclude-table-data='serverpod_health_*' \
  --exclude-table-data='serverpod_*log*' \
  --exclude-table-data='serverpod_readwrite_test*' \
  --exclude-table-data='serverpod_future_call_claim*' \
  > app-data.dump
```

Three details in this command matter:

- **Dump with `--data-only`.** A data-only dump orders tables by their foreign keys, so users are restored before their profiles. A full dump doesn't, so restoring it can fail on foreign key errors.
- **Keep the `*` at the end of each pattern.** It also leaves out each table's ID sequence. Without it, the dump carries your server's sequence values, and the restore resets Cloud's counters for those tables.
- **Everything else is included.** That covers your own tables, users, sessions, future calls, and files stored in the database.

`pg_dump` warns about circular foreign keys between `serverpod_auth_core_profile` and `serverpod_auth_core_profile_image`, with a hint to use a full dump. Ignore the hint. The warning only matters if some of your users have profile images. Count them:

```bash
docker compose exec postgres psql -U postgres -d my_project -At \
  -c 'SELECT count(*) FROM serverpod_auth_core_profile WHERE "imageId" IS NOT NULL;'
```

If the count is `0`, skip to [Create a database user](#create-a-database-user).

### Dump users with profile images

`serverpod_auth_core_profile` and `serverpod_auth_core_profile_image` point at each other, so neither can be restored first. Cloud doesn't let you turn off foreign key checks during a restore either. Instead, you restore the profiles without their image links and add the links back afterwards.

First, save the links as SQL statements. They name the `public` schema, because `pg_restore` leaves the `search_path` empty on the connection it used:

```bash
docker compose exec -T postgres psql -U postgres -d my_project -At \
  -c "SELECT format('UPDATE public.serverpod_auth_core_profile SET \"imageId\" = %L WHERE id = %L;', \"imageId\", id) FROM serverpod_auth_core_profile WHERE \"imageId\" IS NOT NULL;" \
  > profile-images.sql
```

Next, create a copy of the database and clear the links in the copy. Your original database stays untouched. Copying only works while nothing is connected to `my_project`, and stopping the server took care of that:

```bash
docker compose exec postgres psql -U postgres \
  -c "CREATE DATABASE my_project_export TEMPLATE my_project;"
docker compose exec postgres psql -U postgres -d my_project_export \
  -c 'UPDATE serverpod_auth_core_profile SET "imageId" = NULL;'
```

Then run the `pg_dump` command from [Dump your data](#dump-your-data) again, with `-d my_project_export` instead of `-d my_project`.

## Create a database user

The restore connects as a database user that you create yourself. It needs the host and database name, so print the connection details first:

```bash
serverpod cloud db connection
```

Now create that user. The password is shown only once, so save it:

```bash
serverpod cloud db user create migrator
```

The `migrator` user can read and write rows, but it can't disable triggers or turn off foreign key checks. That's why the dump contains data only. See [Access the database directly](/cloud/concepts/database#access-the-database-directly) for more about database users.

Check that Cloud is on the same migration versions as your server:

```bash
psql "postgresql://migrator@<host>/<database>?sslmode=require" \
  -c "SELECT module, version FROM serverpod_migrations ORDER BY module;"
```

Replace `<host>` and `<database>` with the values from `serverpod cloud db connection`.

## Restore the data

Download `app-data.dump` to your machine, for example with `scp`. If you created `profile-images.sql`, download it too.

If your project is on the Growth plan, take a backup snapshot first. See [Database backups](/cloud/concepts/database-backups).

Restore the dump into Cloud:

```bash
pg_restore \
  --dbname="postgresql://migrator@<host>/<database>?sslmode=require" \
  --data-only --single-transaction --exit-on-error \
  app-data.dump
```

`--single-transaction` and `--exit-on-error` make the restore all or nothing. If any row fails, nothing is written. Fix the problem and run the same command again.

If you created `profile-images.sql`, add the image links back:

```bash
psql "postgresql://migrator@<host>/<database>?sslmode=require" \
  -v ON_ERROR_STOP=1 -f profile-images.sql
```

## Check the result

Count the rows in your most important tables on Cloud:

```bash
psql "postgresql://migrator@<host>/<database>?sslmode=require" \
  -c "SELECT count(*) FROM public.serverpod_auth_core_user;"
```

Run the same query on your server, and compare the numbers. Then call your Cloud API, for example from a debug build of your Flutter app:

- Call an endpoint that reads your data.
- Create a new row, and check that it gets the next ID after your migrated rows.
- Sign in with an existing account.

When everything works, point your apps at your Cloud URLs, or attach your existing domain. See [Custom domains](/cloud/concepts/custom-domains). Existing sessions keep working, because Cloud now uses your server's auth secrets.

## Clean up

Delete the migration user:

```bash
serverpod cloud db user delete migrator
```

If you created an export copy, drop it on your server:

```bash
docker compose exec postgres psql -U postgres -c "DROP DATABASE my_project_export;"
```

Keep your self-hosted server and its data until your apps run against Cloud without problems. Then shut it down.

## Troubleshooting

**`duplicate key value violates unique constraint "serverpod_migrations_pkey"`.** The dump includes data that Cloud already wrote when it deployed your project. The same error can name `serverpod_runtime_settings`, `serverpod_health_metric`, or `serverpod_session_log`. Dump again with every `--exclude-table-data` option from [Dump your data](#dump-your-data). With `--single-transaction`, nothing was written, so you can restore again right away.

**`violates foreign key constraint`.** If the constraint is `serverpod_auth_core_profile_fk_1`, some of your users have profile images. Follow [Dump users with profile images](#dump-users-with-profile-images). For any other constraint, check that you dumped with `--data-only`.

**Signing in fails with `invalidCredentials`, or refreshing fails with `RefreshTokenInvalidSecretException`.** Cloud uses different auth secrets from your server. Follow [Copy your auth secrets to Cloud](#copy-your-auth-secrets-to-cloud). Users whose refresh failed before the fix need to sign in again.

**`relation "..." does not exist` in `psql` right after a restore.** `pg_restore` sets `search_path` to an empty value on its connection. Cloud pools connections, so a later session can get that connection back with the empty value still set. Run `SET search_path TO public;` or reconnect later. Your deployed server isn't affected.

## Related

- [Database](/cloud/concepts/database) for how the managed database works.
- [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for how Cloud stores your auth secrets.
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) and [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html) in the PostgreSQL documentation.
