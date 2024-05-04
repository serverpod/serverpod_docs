# Connection

In Serverpod the connection details and password for the database are stored inside the `config` directory in your server package.

Serverpod automatically establishes a connection to the Postgresql instance by using these configuration details when you start the server.

### Connection details
Each environment configuration contains a `database` keyword that specifies the connection details.

For your development build you can find the connection details in the `development.yaml` file.

This is an example:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
...
```

The variable `name` refers to the database name.

### Database password

The database password is stored in a separate file called `passwords.yaml` in the same `config` directory. The password for each environment is stored under the `database` keyword in the file.

An example of this could look like this:

```yaml
...
development:
  database: '<MY DATABASE PASSWORD>'
...
```

## Development database

A newly created Serverpod project comes with a preconfigured docker instance with Postgresql. All you have to do is run the following command from the root of the `server` package to start the database.

:::info

[Docker](https://www.docker.com/) is required for this to work.

:::

```bash
docker compose up --build --detach
```

To remove the database run (this commands preserve all data).

```bash
docker compose down
```

To remove the database and __delete__ all data add the `-v` flag.

```bash
docker compose down -v
```

