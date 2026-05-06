---
sidebar_label: Overview
sidebar_class_name: sidebar-icon-overview
---

# Overview

Serverpod is an open-source backend framework for Flutter applications written in Dart. It aims to minimize boilerplate and integrate many common backend tasks out of the box. With Serverpod, Flutter developers can build secure, scalable server applications using the same language and tools as their client apps, benefiting from seamless code generation and a rich set of built-in capabilities.

## Key capabilities

- **Automatic code generation:** Serverpod analyzes your server code and automatically generates the client-side Dart API and data classes. Calling a remote endpoint becomes as simple as calling a local method.
- **World-class logging:** Built-in logging and monitoring tools allow you to pinpoint exceptions and slow database queries through an easy-to-use interface.
- **Built-in caching:** High-performance, distributed caching is included. Any object can be cached (primitives, lists, maps, and serializable models) in memory on the server or distributed using Redis.
- **Easy-to-use ORM:** Serverpod provides an ORM that uses native Dart types and null-safety for database queries. You write Dart code instead of SQL, and Serverpod builds your PostgreSQL queries under the hood. The ORM has an intuitive Dart-first API for relations and joins.
- **Database migrations:** A built-in migration system helps keep your database schema in sync as your project evolves. You can version schema changes and apply them easily during deployment.
- **File uploads:** First-class support for file uploads to cloud storage or the database. Files can be stored in Amazon S3, Google Cloud Storage, or even in your PostgreSQL database.
- **Authentication:** User authentication comes ready out-of-the-box. Serverpod supports sign-in with Google, Apple, Firebase, email/password, or custom authentication mechanisms.
- **Real-time data streaming:** Support for real-time communications via Dart streams. You push serialized objects over secure WebSocket connections, enabling live updates (e.g., for chats and games).
- **Task scheduling:** Serverpod's future calls replace complicated cron jobs. Call a method anytime in the future or after a specified delay. The calls persist even if the server is restarted.
- **Deployment automation:** Serverpod Cloud (currently in private beta) allows you to deploy your server with zero configuration. There are also community-supported Terraform scripts for deployment on Google Cloud Platform and AWS, making it quick to provision infrastructure and deploy your server. Your Serverpod project comes with a Docker container for flexible deployment options.
- **Built-in web server:** Serverpod comes with a modern, high-performance web server called [Relic](https://docs.dartrelic.dev/). It is built to meet the demanding requirements of modern web applications and provides a robust, type-safe, and efficient foundation for building scalable web services, such as REST APIs, webhooks, and web pages.

## Creating a new project

To create a new Serverpod project, use the `serverpod create` command. It will set up a new project with a server, a client, and a Flutter app.
The project will be created in a new directory with the name you specify. For example, to create a new project called `my_project`, run the following command:

```bash
$ serverpod create my_project
```

::::tip
The name of the project must be a valid Dart package name. It should start with a lowercase letter and can only contain lowercase letters, numbers, and underscores. For example, `my_project` is a valid name, but `MyCounter` is not.
::::

After running the command, the following structure will be created:

```text
my_project/
├── my_project_server/   # Contains your server-side code.
├── my_project_client/   # Code needed for the app to communicate with the server.
└── my_project_flutter/  # Flutter app, pre-configured to connect to your local server.
```

The root-level `pubspec.yaml` file includes support for [Dart pub workspaces](https://dart.dev/tools/pub/workspaces) by default, which allows fetching dependencies at once by calling `dart pub get` from the project root.

::::info
During project creation, dependencies are automatically fetched.
::::

If your project uses **SQLite** for local development, you do not need Docker here; skip straight to starting the server in the next step.

If your project uses **PostgreSQL** locally, start the database from the `docker-compose.yaml` in the server directory:

```bash
$ cd my_project/my_project_server
$ docker compose up
```

This will start the PostgreSQL database. You can stop the database server by pressing `Ctrl+C` in the terminal. If you want to run the servers in the background, you can use the `-d` flag:

```bash
$ docker compose up -d
```

This will start the database server in detached mode, meaning it will run in the background and you can safely close the terminal window without stopping it. Stop the database container by running the following command from the server directory:

```bash
$ docker compose down
```

::::tip
If you are using Docker Desktop, you can see and manage all your installed Docker containers from there. It's easy to start and stop containers, and to remove the ones you are no longer using.
::::

When the database is ready (or while using SQLite), start the Serverpod server. Because we are running the project for the first time, we need to create the database tables used by Serverpod. This is done through a [database migration](./06-concepts/06-database/11-migrations.md). An initial migration is already created for us, so all we need to do is pass the `--apply-migrations` flag when starting the server:

```bash
$ cd my_project/my_project_server
$ dart run bin/main.dart --apply-migrations
```

This will start the server and set up the initial database tables. You can now access the server at `http://localhost:8080` and the web server is available at `http://localhost:8082`. It should look like this:

![Serverpod web](/img/getting-started/serverpod-web.png)

Now let's run our Flutter app. You can do this by running `flutter run -d chrome` in the flutter directory:

```bash
$ cd my_project/my_project_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look like this:

![Example Flutter App](/img/getting-started/flutter-example-web.png)

## Defining Endpoints

In Serverpod, endpoints are the entry points that clients call to execute server-side logic. An endpoint is defined by creating a class that extends the Endpoint class and adding asynchronous methods to it. Each endpoint method must return a `Future<Type>` and take a `Session` object as its first parameter. The `Session` provides context about the call and gives access to server resources like the database or cache.

For example, here's a simple endpoint definition with a single method:

```dart
import 'package:serverpod/serverpod.dart';

class GreetingEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

You can place your endpoints anywhere in your server package. After adding or modifying endpoints, you run the Serverpod code generator (`serverpod generate`) to update the client interface. The generator produces a Dart client library that mirrors your server API.

On the Flutter client side, calling the endpoint is as straightforward as calling a local function. For instance, using the generated client, you can invoke the above hello method like this:

```dart
final result = await client.greeting.hello('World');
```

Serverpod handles the network communication and data serialization behind the scenes. Under the hood, it uses JSON serialization and HTTP or WebSocket calls, but as a developer, you only see calls using the typed Dart interface. For more details on defining and using endpoints, see the [Working with endpoints](./concepts/working-with-endpoints) guide in the documentation.

## Data Models and Serialization

Serverpod makes it easy to define the data models that your server will use in its API and when talking with the database. You define serializable data models in YAML files (with a `.spy.yaml` extension, short for _Serverpod YAML_). These model definitions are used to generate Dart classes that are shared by the server and the app, ensuring a consistent data schema on both sides. If a database table is associated with the model, the code generator will also produce the necessary database integration code.

A simple model definition might look like this:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
```

This defines a `Company` class with two fields. When you run `serverpod generate`, Serverpod creates a Dart class named `Company` (with a `name` and `foundedDate` property) that can be used in your endpoint methods and in the client code.

By default, model classes are plain data holders that can be sent over the network. Serverpod supports most basic types, including `bool`, `int`, `double`, `String`, `Duration`, `DateTime`, `ByteData`, `UuidValue`, `Uri`, and `BigInt`. You can also use `List`, `Map`, `Set`, and other custom serializable objects. Null safety is supported, and the models can be nested with each other as needed.

## Database Integration and ORM

If you want a model to also correspond to a database table, you simply add a table name to the YAML definition. For example, to back the `Company` class with a database table, you could write:

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
```

Including the `table` key tells Serverpod to set up a PostgreSQL table named `company` for this model and generate an ORM interface for it. After running `serverpod generate`, the `Company` Dart class will include additional capabilities for database operations.

Working with a database in Serverpod is straightforward and fully integrated. By default, Serverpod uses a PostgreSQL database to store persistent data. Connection settings (such as host, port, database name, user, and password) are configured in your project's YAML files under the `config/` directory. New Serverpod projects come pre-configured for a local PostgreSQL instance, so you can usually start a development server without additional setup.

When a data model is bound to a database table (via the table field in the model definition), Serverpod's code generation provides an Object-Relational Mapping (ORM) for that model. Each generated model class gains a static `db` field that offers convenient methods for common database operations (CRUD). For example, you can insert a new record and then query it as follows:

```dart
// Insert a new Company row into the database
var company = Company(name: 'Serverpod Inc.', foundedDate: DateTime.now());
company = await Company.db.insertRow(session, company);

// Retrieve the company by its id
var storedCompany = await Company.db.findById(session, company.id);
```

In the above snippet, `insertRow` will write a new row to the `company` table and return the inserted object with its `id` (primary key) populated. The `findById` call then fetches that row by its `id`. All database calls are asynchronous and use the same `Session` that is provided to your endpoint methods, ensuring they are executed in a transaction/context that you control. You can also perform more complex queries using Serverpod's fluent query interface – for example, searching with filters, joining relations, sorting, or even writing raw SQL if needed.

The ORM layer is fully type-safe; query filters and results are expressed in terms of your Dart classes and fields, preventing mistakes like SQL syntax errors or mismatched column types at compile time.

Serverpod's migration system further simplifies database work by allowing you to apply schema changes. Whenever you alter your models, you can generate a new migration by running `serverpod create-migration`. Have Serverpod apply it on the next server startup by passing the `--apply-migrations` flag when starting the server. This helps keep the database schema versioned and in sync with your code. See the documentation's [Database section](./concepts/database/connection) for details on writing complex queries, transactions, and managing migrations.

## Conclusion

Serverpod provides a robust, full-stack solution for Flutter backend development. Its high-level architecture (endpoints for RPC, YAML-defined serializable models, and an integrated PostgreSQL-backed ORM) allows teams to move quickly and safely when building out server features. Many auxiliary concerns – from caching and authentication to logging and deployment – are handled by Serverpod's built-in modules, reducing the need for additional services and glue code. This concise overview covered the basics; as a next step, you can explore the in-depth documentation on specific topics such as endpoints, database usage, or advanced features like streams and authentication to evaluate how Serverpod fits your project's needs. A great way to learn Serverpod is also to go through our [Get started guide](./04-get-started/01-creating-endpoints.md).
