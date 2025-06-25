# Connection

In Serverpod the connection details and password for the database are stored inside the `config` directory in your server package. Serverpod automatically establishes a connection to the Postgres instance by using these configuration details when you start the server.

The easiest way to get started is to use a Docker container to run your local Postgres server, and this is how Serverpod is set up out of the box. This page contains more detailed information if you want to connect to another database instance or run Postgres locally yourself.

### Connection details

Each environment configuration contains a `database` keyword that specifies the connection details.
For your development build you can find the connection details in the `config/development.yaml` file.

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

The `name` refers to the database name, `host` is the domain name or IP address pointing to your Postgres instance, `port` is the port that Postgres is listening to, and `user` is the username that is used to connect to the database.

:::caution

By default, Postgres is listening for connections on port 5432. However, the Docker container shipped with Serverpod uses port 8090 to avoid conflicts. If you host your own instance, double-check that the correct port is specified in your configuration files.

:::

#### Configure search paths

You can customize the search paths for your database connection—helpful if you're working with multiple schemas. By default, Postgres uses the `public` schema unless otherwise specified.

To override this, use the optional `searchPaths` setting in your configuration:

```yaml
...
database:
  host: localhost
  port: 8090
  name: <YOUR_PROJECT_NAME>
  user: postgres
  searchPaths:  custom, public
...
```

In this example, Postgres will look for tables in the `custom` schema first, and then fall back to `public` if needed. This gives you more control over where your data lives and how it’s accessed.

:::tip
It is also possible to set the search paths using [runtime parameters](runtime-parameters) directly on the server startup (or on a specific transaction). If the paths are set on both the configuration file and as runtime parameters, the runtime parameters will take precedence.
:::

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

A newly created Serverpod project has a preconfigured Docker instance with a Postgres database set up. Run the following command from the root of the `server` package to start the database:

```bash
$ docker compose up --build --detach
```

To stop the database run:

```bash
$ docker compose stop
```

To remove the database and __delete__ all associated data, run:

```bash
$ docker compose down -v
```

## Connecting to a custom Postgres instance

Just like you can connect to the Postgres database inside the Docker container, you can connect to any other Postgres instance. There are a few things you need to take into consideration:

- Make sure that your Postgres instance is up and running and is reachable from your Serverpod server.
- You will need to create a user with a password, and a database.

### Connecting to a local Postgres server

If you want to connect to a local Postgres Server (with the default setup) then the `development.yaml` will work fine if you set the correct port, user, database, and update the password in the `passwords.yaml` file.

### Connecting to a remote Postgres server

To connect to a remote Postgres server (that you have installed on a VPS or VDS), you need to follow a couple of steps:

- Make sure that the Postgres server has a reachable network address and that it accepts incoming traffic.
- You may need to open the database port on the machine. This may include configuring its firewall.
- Update your Serverpod `database` config to use the public network address, database name, port, user, and password.

### Connecting to Google Cloud SQL

You can connect to a Google Cloud SQL Postgres instance in two ways:

1. Setting up the _Public IP Authorized networks_ (with your Serverpod server IP) and changing the database host string to the _Cloud SQL public IP_.
2. Using the _Connection String_ if you are hosting your Serverpod server on Google Cloud Run and changing the database host string to the Cloud SQL: `/cloudsql/my-project:server-location:database-name/.s.PGSQL.5432`.

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.

:::info

If you are using the `isUnixSocket` don't forget to add __"/.s.PGSQL.5432"__ to the end of the `host` IP address. Otherwise, your Google Cloud Run instance will not be able to connect to the database.

:::

### Connecting to AWS RDS

You can connect to an AWS RDS Instance in two ways:

1. Enable public access to the database and configure VPC/Subnets to accept your Serverpod's IP address.
2. Use the Endpoint `database-name.some-unique-id.server-location.rds.amazonaws.com` to connect to it from AWS ECS.

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.
