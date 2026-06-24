---
sidebar_label: How it works
sidebar_class_name: sidebar-icon-overview
slug: /how-it-works
description: "Understand your day with Serverpod: the save-and-hot-reload dev loop, the three-package layout and code generator, and full-stack type safety."
---

# How Serverpod works

With Serverpod you write Dart on both sides of your app and run one command to see your changes immediately. Edit a file, hit save, and your running server, your Flutter app, and the generated code that connects them update together. No manual rebuilds or restarts, no Docker to wire up, and no API code to write by hand.

Serverpod is a full backend: the database, authentication, file uploads, caching, and real-time are built in, so you build features instead of wiring together separate services. Underneath, a Serverpod project is a single workspace of Dart packages, and a code generator keeps the types shared between your server and app in sync.

## What you build

When you run `serverpod create`, you get one workspace with three Dart packages:

```text
my_project/
├── my_project_server/   # Your backend code.
├── my_project_client/   # Generated. Never edit by hand.
└── my_project_flutter/  # Your Flutter app.
```

You write your backend in the `_server` package: [endpoint methods](../concepts/working-with-endpoints) that your app calls, and [model files](../concepts/models) (`.spy.yaml`) that define your data. From those, Serverpod's code generator produces the `_client` package, a typed Dart API for your app, along with the serialization and database classes on the server. You never write serialization, HTTP calls, or API contracts.

That makes a call to the server look like a local method call:

```dart
final greeting = await client.example.hello('World');
```

The generated client handles the request, the response, and the JSON in between. Every endpoint method also receives a [`Session`](../concepts/sessions), the context for that one call, with access to the database, cache, signed-in user, and logging.

Most calls follow this request-and-response shape. For live updates, Serverpod also has [streaming endpoints](../concepts/streams) that keep a connection open so the server and app can push data to each other.

## The dev loop

Day to day, you run one command:

```bash
$ serverpod start
```

This starts your server, launches your Flutter app, and watches your code. When you save a change, Serverpod hot reloads the server, regenerates the client, and reloads your app. When your models change, it applies migrations to keep your database in sync. You stay in one terminal and see each change right away.

By default there is no Docker to set up. Serverpod runs an embedded Postgres for you, managed by the server. If you would rather run Postgres or other services in Docker, opt in with `serverpod start --docker`.

## An AI-assisted workflow

If you build with AI tools, Serverpod supports that too. When you create a project, it can scaffold agent skills for your editor (Claude, Cursor, and VS Code), and `serverpod start` runs an MCP server that lets those tools work with your running project. This path is entirely optional, and the traditional workflow above is unchanged if you do not use it.

## Choices that shape your project

The `serverpod create` command lets you tailor the project it generates. You choose:

- **Project type.** A full server, or a reusable module shared across servers.
- **Database and caching.** Postgres or SQLite, plus optional Redis for caching and cross-server messaging.
- **Authentication.** Built-in email and social sign-in, one of Serverpod's optional [modules](../concepts/modules).
- **Web server.** Optionally serve web pages and your Flutter web build alongside your API.

## Why it works

Type safety runs from your database to your Flutter app because your model files are the single source of truth. When you generate code, the same Dart class is used in database queries, server logic, and your app. Rename a field and regenerate, and the Dart compiler points you at every place in the server and the app that needs updating. A whole category of client-server bugs (mismatched field names, wrong types, forgotten null checks after an API change) becomes compile errors you fix before you ship. This safety net matters all the more when AI tools are writing some of that code for you.

## Next steps

When you are ready to ship, see [Deploy to Serverpod Cloud](../deployments/deploy-to-serverpod-cloud) to take your app to production.
