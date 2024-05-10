# Connection

In Serverpod the connection details and password for the database are stored inside the `config` directory in your server package.

Serverpod automatically establishes a connection to the Postgresql instance by using these configuration details when you start the server.


## Connecting to a Postgresql Docker Image

Using a Docker Postgresql Image is the easiest way to get started.


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

The variable `name` refers to the database name. \
The variable `host` is the IP address pointing to your Postgresql instance. \
The variable `port` is the port that is opened to listen for incoming connections (default 5432). \
The variable `user` is the username that is approved to access the database (default postgres).

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
$ docker compose up --build --detach
```

To remove the database run (this commands preserve all data).

```bash
$ docker compose down
```

To remove the database and __delete__ all data add the `-v` flag.

```bash
$ docker compose down -v
```


## Connecting to a Postgresql Server Instance

Connecting to a Postgresql Server Instance is similar to connecting to a Docker Image, but there are some prerequisites to take into account:

- Making sure that the machine/server allows incoming traffic
- Creating a Postgresql user and database

You can connect to Postgresql server that you have installed on your local machine, a self-hosted one, Google Cloud SQL, AWS RDS or SQL Server, or any other 3rd party service.

### Connecting to a Local Postgresql

If you want to connect to a local Postgresql Server (with the default setup) then the `development.yaml` will work just fine. The only thing you need to do is change the password in the `passwords.yaml`.

### Connecting to a Remote Postgresql

To connect to a remote Postgresql Server (that you have installed on a VPS or VDS) you need to follow a couple of steps:
- Make sure that the Postgresql Server has a reachable IP address (that it accepts incoming traffic)
- Make sure to open any necessary ports on that machine
- Configure Postgresql Server to listen to all other connections (not only local once) in `postgresql.conf`:
```bash
listen_addresses = '*'
```

- Edit your Postgresql Server `pg_hba.conf` to accept incoming traffic (this config accepts all incoming traffic which is not recommended):

```bash
host    all             all              0.0.0.0/0                       md5
host    all             all              ::/0                            md5
```

- Update your Serverpod `database` config to use the public IP, database name, and user. Also the database password in `passwords.yaml`.


### Connecting to Google Cloud SQL

You can connect to a Google Cloud SQL Postgresql Instance in 2 ways:

- Setting up the Public IP Authorized networks (with your Serverpod server IP) and changing the database host string to the `Cloud SQL public IP`
- Using the Connection String if you are hosting your Serverpod server on Google Cloud Run and changing the database host string to the Cloud SQL: `/cloudsql/my-project:server-location:database-name/.s.PGSQL.5432`

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.

:::info

If you are using the `isUnixSocket` don't forget to add **"/.s.PGSQL.5432"** to the end of the `host` IP address *otherwise your Google Cloud Run instance will not be able to connect to the database*.

:::

### Connecting to AWS RDS

You can connect to AWS RDS Instance in 2 ways:
- Enable public access to the database and configure VPC/Subnets to accept **Serverpods IP**
- Use the Endpoint `database-name.some-unique-id.server-location.rds.amazonaws.com` to connect to it from **AWS ECS**

The next step is to update the database password in `passwords.yaml` and the connection details for the desired environment in the `config` folder.