---
sidebar_label: How it works
sidebar_class_name: sidebar-icon-overview
slug: /how-it-works
description: 'The fast way to start building with Serverpod: write endpoints, call them from Flutter, define data models, and see changes with one-command hot reload.'
---

# How Serverpod works

With Serverpod you write Dart on both sides of your app and run one command to see your changes immediately. Edit a file, hit save, and your running server, your Flutter app, and the generated code that connects them update together. No manual rebuilds or restarts, no Docker to wire up, and no API code to write by hand.

Serverpod is a full backend: the database, authentication, file uploads, caching, real-time, scheduling, and logging are built in, so you build features instead of wiring together separate services. A project is a single workspace of Dart packages, and a code generator keeps the types shared between your server and app in sync, so a renamed field or a wrong type is a compile error rather than a runtime surprise.

## Create your project

A Serverpod project starts with the `serverpod create` command, which walks you through a few choices that shape what it generates:

- **Project type:** A full server, or a reusable module shared across servers.
- **Database and caching:** Postgres or SQLite, plus optional Redis for caching and cross-server messaging.
- **Authentication:** Built-in email and social sign-in, one of Serverpod's optional [modules](../concepts/modules).
- **Web server:** Optionally serve web pages and your Flutter web build alongside your API.
- **AI agent (optional):** The coding agent you build with (Claude, Cursor, or VS Code), set up with agent skills.

The result is one workspace with three Dart packages:

```text
my_project/
├── my_project_server/   # Your backend code.
├── my_project_client/   # Generated. Never edit by hand.
└── my_project_flutter/  # Your Flutter app.
```

You write two kinds of things in the `_server` package: endpoints that your app calls, and models that define your data. Serverpod's code generator turns them into the `_client` package, a typed Dart API for your app, along with the serialization and database code on the server. You never write serialization, HTTP calls, or API contracts.

## Run your project

You run the whole project with one command:

```bash
$ serverpod start
```

This starts your server, launches your Flutter app, and watches your code. When you save a change, Serverpod regenerates the client, hot reloads the server, and reloads your app, so you see each change right away.

:::tip

Start your project before you begin building. With `serverpod start` already running, every change after that, whether you make it or an agent does, is caught and reloaded as you go.

:::

## Write an endpoint

In Serverpod, endpoints are the entry points your app calls to run code on the server. You define one as a class that extends `Endpoint`, with async methods that each take a [`Session`](../concepts/sessions) as their first argument and return a typed `Future`:

```dart
class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The `Session` is the context for that one call, with access to the database, cache, signed-in user, and logging. Parameters and return types can be the built-in types (`bool`, `int`, `double`, `String`, `DateTime`, `Duration`, `Uri`, `UuidValue`, `BigInt`, `ByteData`), a `List`, `Map`, `Set`, or `Record` of those, or any model you define. See [Working with endpoints](../concepts/working-with-endpoints) for the full list.

## Call it from your app

On the app side, the generated client turns each endpoint method into what looks like a local call:

```dart
final greeting = await client.example.hello('World');
```

The client handles the request, the response, and the JSON in between. Most calls follow this request-and-response shape. For live updates, Serverpod also has [streaming endpoints](../concepts/streams) that keep a connection open so the server and app can push data to each other.

## Define your data models

Models are the data your app and server pass back and forth, the objects your endpoints take and return. You define them in `.spy.yaml` files, each naming a class and listing its fields:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
```

When you generate code, this becomes a `Company` Dart class shared by the server and your app, so the same type flows from your endpoints into your Flutter widgets. Fields support the same types as endpoint methods, plus enums and nested models, and can be nullable. See [Working with models](../concepts/models) for the details.

Add a `table` key to also store the model in a database table:

```yaml
class: Company
table: company
fields:
  name: String
  foundedDate: DateTime?
```

The generated `Company` class then gains a `db` field with type-safe methods for reading and writing rows, so you query the database in Dart instead of SQL. For example, insert a row and read it back:

```dart
final company = await Company.db.insertRow(session, Company(name: 'Serverpod'));
final stored = await Company.db.findById(session, company.id);
```

These run on the same `session` your endpoint method receives. When you change a table model, press `M` in the `serverpod start` terminal to create a migration, then `A` to apply it. Pending migrations also apply on startup.

That database runs without setup on your part: Serverpod manages an embedded Postgres for you, with no Docker to configure. If you would rather run Postgres or other services in Docker, opt in with `serverpod start --docker`.

See [Working with the database](../concepts/database/crud) for filters, relations, and transactions.

## Build with an AI agent

Serverpod is built to work with AI coding agents. You pick your agent when you create the project, and Serverpod scaffolds skills that teach it how a Serverpod project fits together. While `serverpod start` runs, it exposes an MCP server that lets the agent work with your live project: write endpoints and models, manage the database, and reload the app as it goes. You describe the feature you want, and the agent builds it.

Your models stay the single source of truth, so when the agent renames a field or changes a type, the regenerated code turns the mismatch into a compile error rather than a runtime bug.

This path is optional, and everything above works the same without it. For a guided walkthrough, see the [Quickstart](02-quickstart.md).

## Next steps

Ready to build something? Follow [Build your first app](../05-build-your-first-app/01-creating-endpoints.md) to create your first endpoint and call it from Flutter. When you are ready to ship, [Deploy to Serverpod Cloud](../08-deployments/01-deploy-to-serverpod-cloud.md) takes your app to production.
