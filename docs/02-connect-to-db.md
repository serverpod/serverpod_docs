# Connect to the database

To inspect the database you can use a database viewer such as [Postico2](https://eggerapps.at/postico2/), [PgAdmin](https://www.pgadmin.org/download/), or [DBeaver](https://dbeaver.io/download/). To connect to the database you need to specify the the host and port as well as the database name, user name, and password. In Serverpod these variables are defined inside the `config` folder in your server project.

The connection details can be found in the file `config/development.yaml`, the variable `name` refers to the database name.
```yaml
...
# This is the database setup for your server.
database:
  host: localhost
  port: 8090
  name: projectname
  user: postgres

...
```

The password can be found in the file `config/passwords.yaml`.
```yaml
...
# These are passwords used when running the server locally in development mode
development:
  database: 'DB_PASSWORD'

...
```
