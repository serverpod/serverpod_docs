# `db`

`scloud db` provides commands for managing your Serverpod Cloud database for projects that have the database enabled.


### Get DB connection details

To get the connection details for connecting directly to the database, run the the `db connection` subcommand:

```bash
scloud db connection
```

### Create a new superuser

To create a new superuser for directly accessing the database, run the the `db user create` subcommand:

```bash
scloud db user create my_new_username
```

**Save the printed password in you password manager.** It cannot be retrieved again.

### Reset a DB user password

To reset the password for a database user, run the the `db user reset-password` subcommand:

```bash
scloud db user reset-password my_new_username
```
