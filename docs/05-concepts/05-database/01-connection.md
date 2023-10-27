# Connection

In Serverpod the connection details for the database are stored inside the `config` folder in your server project.

The connection details can be found in the file `config/development.yaml`. The variable `name` refers to the database name.

For example for your development build you find the settings in the file `config/development.yaml` and then under the `database` keyword. It looks like this:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
...
```


The password to the database can be found in the file `config/passwords.yaml`.

```yaml
...
development:
  database: '<MY DATABASE PASSWORD>'
...
```

Serverpod automatically establishes a connection to the Postgresql instance by using these configuration details when you start the server.

## Development database

A newly created Serverpod project comes with a preconfigured docker instance with Postgresql. All you have to do is run the following command to start the database (Having [Docker](https://www.docker.com/) installed is required for this to work).

```bash
docker compose up --build --detach
```

To remove the database run (this commands preserve all data)

```bash
docker compose down
```

To remove the database and __delete__ all data add the `-v` flag.

```bash
docker compose down -v
```