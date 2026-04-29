---
title: Access the database
---

# Access the database

This guide walks you through getting connection details, creating a database user, and connecting with a PostgreSQL client so you can inspect data, run queries, or debug issues directly.

:::info

Serverpod Cloud automatically manages a user and keys for your server to connect to your database. Use this guide if you want to connect to your database through other tools or services.

:::

## Prerequisites

Before accessing the database, make sure you have:

- Completed the **Installation** steps (`scloud` installed and authenticated).
- A Serverpod Cloud project with the **database enabled** (e.g. you chose to enable it during `scloud launch` or created the project with `--enable-db`).
- Linked your project (run commands from your server directory, or use `-p your-project-id`).

## Get connection details

From your server project directory (or with `-p your-project-id`), run:

```bash
scloud db connection
```

The command prints the host, port, and database name you need to connect. You still need a username and password; create a database user next.

## Create a database user

Serverpod Cloud does not show a default password for security reasons. Create a superuser to connect from your machine or a GUI client.

Create a new user (choose any username):

```bash
scloud db user create myuser
```

The CLI prints a password **once**. Save it in a password manager or another secure place; it cannot be retrieved again.

Example output:

```text
DB superuser created. The password is only shown this once:
xxxxxxxxxxxxxxxxxxxxxxxx
```

If you lose the password, create a new user or reset the password for the existing user:

```bash
scloud db user reset-password myuser
```

The new password is shown once; save it immediately.

## Connect with a PostgreSQL client

Use the connection details from `scloud db connection` and the username and password you created. Enter them in your client as follows:

| Field | Where to get it |
| --- | --- |
| **Host** | From `scloud db connection` |
| **Port** | From `scloud db connection` |
| **Database** | From `scloud db connection` (often the default database name) |
| **User** | The username you passed to `scloud db user create` |
| **Password** | The one-time password printed when you created or reset the user |

Suggested GUI clients:

- **[Postico](https://eggerapps.at/postico/)** – PostgreSQL client for macOS with a simple interface.
- **[pgAdmin](https://www.pgadmin.org/)** – Open-source admin and management tool (all platforms).
- **[DBeaver](https://dbeaver.io/)** – Universal database tool supporting PostgreSQL and others.
- **[DataGrip](https://www.jetbrains.com/datagrip/)** – JetBrains database IDE with advanced query and schema tools.

Any client that supports PostgreSQL (e.g. `psql`, VS Code extensions) will work with the same details.

## Related documentation

- CLI reference: [`scloud db`](../reference/cli/commands/db) – All `db` subcommands and options
