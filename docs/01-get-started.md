# Get started
This page should give you an understanding of how a Serverpod project is structured, how you make calls to endpoints, and how you communicate with the database. Before going through it, make sure that you have the latest version of Serverpod installed. In the previous section, you can learn how to set up the Serverpod command line tools and install Serverpod Insights.

## Creating a new project
To get your local Serverpod project up and running, make sure that [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running. Then, create a new project by running `serverpod create`.

```bash
serverpod create mypod
```

:::info

It can take up to a few minutes the first time you run `serverpod create`. This is because Docker will need to download and build the containers used by Serverpod.

:::

This command will create a new directory called `mypod`, with three dart packages inside; `mypod_server`, `mypod_client`, and `mypod_flutter`.

- `mypod_server`: This package contains your server-side code. Modify it to add new endpoints or other features your server needs.
- `mypod_client`: This is the code needed to communicate with the server. Typically, all code in this package is generated automatically, and you should not edit the files in this package.
- `mypod_flutter`: This is the Flutter app, pre-configured to connect to your local server.

### Starting the server
Start your Docker containers with `docker compose up --build --detach`. It will start Postgres and Redis. Then, run `dart bin/main.dart` to start your server.

```bash
cd mypod/mypod_server
docker compose up --build --detach
dart bin/main.dart
```

If everything is working, you should see something like this on your terminal:

```
SERVERPOD version: 1.x.x, mode: development, time: 2022-09-12 17:22:02.825468Z
Insights listening on port 8081
Server default listening on port 8080
Webserver listening on port 8082
```

:::info

If you need to stop the Docker containers at some point, just run `docker compose stop` or use the Docker Desktop application. You can also use Docker Desktop to start, stop, and manage your containers.

:::

### Running the demo app
Start the default demo app by changing directory into the Flutter package that was created and running `flutter run`.

```bash
cd mypod/mypod_flutter
flutter run -d chrome
```

 The flag `-d chrome` runs the app in Chrome, for other run options please see the Flutter documentation.

:::info

If you run the app on MacOS you will need to add permissions for outgoing connections in your Xcode project. To do this, open the `Runner.xcworkspace` in Xcode. Then check the _Outgoing Connections (Client)_ under _Runner_ > _Signing & Capabilities_ > _App Sandbox_. Make sure to add the capability for all run configurations.

:::

## Server overview
At first glance, the complexity of the server may seem daunting, but there are only a few directories and files you need to pay attention to. The rest of the files will be there when you need them in the future, e.g., when you want to deploy your server or if you want to set up continuous integration.

These are the most important directories:

- `config`: These are the configuration files for your Serverpod. These include a `password.yaml` file with your passwords and configurations for running your server in development, staging, and production. By default, everything is correctly configured to run your server locally.
- `lib/src/endpoints`: This is where you place your server's endpoints. When you add methods to an endpoint, Serverpod will generate the corresponding methods in your client.
- `lib/src/protocol`: The entity definition files are placed here. The files define the classes you can pass through your API and how they relate to your database. Serverpod generates serializable objects from the entity definitions.

Both the `endpoints` and `protocol` directories contain sample files that give a quick idea of how they work. So this a great place to start learning.

### Generating code
Whenever you change your code in either the `endpoints` or `protocol` directory, you will need to regenerate the classes managed by Serverpod. Do this by running `serverpod generate`.

```bash
cd mypod/mypod_server
serverpod generate
```

### Working with endpoints
Endpoints are the connection points to the server from the client. With Serverpod, you add methods to your endpoint, and your client code will be generated. For the code to be generated, you need to place your endpoint in the `lib/src/endpoints` directory of your server. Your endpoint should extend the `Endpoint` class. For methods to be generated, they need to return a typed `Future`, and its first parameter should be a `Session` object. The `Session` object holds information about the call being made and provides access to the database.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The above code will create an endpoint called `example` (the Endpoint suffix will be removed) with the single `hello` method. To generate the client-side code run `serverpod generate` in the home directory of the server.

On the client side, you can now invoke the method by calling:

```dart
var result = await client.example.hello('World');
```

:::tip

To learn more about endpoints, see the [Working with endpoints](concepts/working-with-endpoints) section.

:::

### Serializing data
Serverpod makes it easy to generate serializable classes that can be passed between server and client or used to communicate with the database.

The structure for your serialized classes is defined in yaml-files in the `lib/src/protocol` directory. Run `serverpod generate` in the home directory of the server to build the Dart code for the classes and make them accessible to both the server and client.

Here is a simple example of a yaml-file defining a serializable class:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<Employee>
```

Supported types are `bool`, `int`, `double`, `String`, `DateTime`, `ByteData`, and other serializable classes. You can also use `List`s and `Map`s of the supported types, just make sure to specify the types. Null safety is supported. The keys of `Map` must be non-nullable `String`s. Once your classes are generated, you can use them as parameters or return types to endpoint methods.

:::tip

You can also create custom serialized classes with tools such as Freezed. Learn more in the [Serialization](concepts/serialization) section.

:::

## Working with the database
A core feature of Serverpod is to query the database easily. Serverpod provides an ORM that supports type and null safety.

### Connecting to the database
When working with the database, it is common that you want to connect to it with a database viewer such as [Postico2](https://eggerapps.at/postico2/), [PgAdmin](https://www.pgadmin.org/download/), or [DBeaver](https://dbeaver.io/download/). To connect to the database you need to specify the host and port as well as the database name, user name, and password. In your project you can find these inside the `config` directory.

The connection details can be found in the file `config/development.yaml`. The variable `name` refers to the database name.

```yaml
database:
  host: localhost
  port: 8090
  name: projectname
  user: postgres

...
```

The password can be found in the file `config/passwords.yaml`.
```yaml
development:
  database: '<MY DATABASE PASSWORD>'

...
```

### Migrations
With database migrations, Serverpod makes it easy to evolve your database schema. When you make changes to your project that should be reflected in your database, you need to create a migration. A migration is a set of SQL queries that are run to update the database. To create a migration, run `serverpod create-migration` in the home directory of the server. 

``` bash
cd mypod/mypod_server
serverpod create-migration
```

Migrations are then applied to the database as part of the server startup by adding the `--apply-migrations` flag.

```bash 
cd mypod/mypod_server
dart bin/main.dart --apply-migrations
```

:::tip

To learn more about database migrations, see the [Migrations](concepts/database/migrations) section.

:::


### Object database mapping
Add a `table` key to your protocol file to add a mapping to the database. The value specified after the key sets the database table name. Here is the `Company` class from earlier with a database table mapping to a table called `company`:

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
```

CRUD operations are available through the static `db` method on all classes with database bindings.

:::tip

To learn more about database CRUD operations, see the [CRUD](concepts/database/CRUD) section.

:::

### Writing to database
Inserting a new row into the database is as simple as calling the static `db.insertRow` method.

```dart
var myCompany = Company(name: 'Serverpod corp.', foundedDate: DateTime.now());
myCompany = await Company.db.insertRow(session, myCompany);
```

The method returns the inserted object with its `id` field set from the database.

### Reading from database
Retrieving a single row from the database can done by calling the static `db.findById` method and providing the `id` of the row.

```dart
var myCompany = await Company.db.findById(session, companyId);
```

You can also use an expression to do a more refined search through the `db.findSingleRow(...)`. method. The `where` parameter is a typed expression builder. The builder's parameter, `t`, contains a description of the table and gives access to the table's columns.

```dart
var myCompany = await Company.db.findSingleRow(
  session,
  where: (t) => t.name.equals('My Company'),
);
```
The example above will return a single row from the database where the `name` column is equal to `My Company`.

If no matching row is found, `null` is returned. 

:::tip

Working with a database is an extensive subject. Learn more in the [Database](concepts/database/connection) section.

:::

## Where to go next
You should now have a basic understanding of how Serverpod works. The different topics are described in more detail in the _Concepts_ section of the documentation. If you are unfamiliar with server-side development, a good staring place for learning is to do the [Build your first app](tutorials/first-app) tutorial. There are also many good video tutorials linked in the _Tutorials_ section.

If you get stuck, never be afraid to ask questions in our [community on Github](https://github.com/serverpod/serverpod/discussions). The Serverpod team is very active there, and many questions are also answered by other developers in the community.