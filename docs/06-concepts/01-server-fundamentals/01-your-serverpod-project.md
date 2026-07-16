---
description: A Serverpod project is one Dart workspace with three packages, the server, the generated client, and your Flutter app, plus its config and migrations.
---

# Your Serverpod project

A Serverpod project is one workspace holding three Dart packages: your server, a generated client, and your Flutter app. You write data models and endpoints on the server; Serverpod generates everything between them, so your app calls the server through typed Dart methods instead of hand-written networking code. Knowing what lives where makes every other page in this section easier to follow.

Running `serverpod create myproject` generates one workspace with three packages:

```text
myproject/
├── myproject_server/    # Your server: endpoints, models, config, migrations
├── myproject_client/    # Generated client: how your app calls the server
└── myproject_flutter/   # Your Flutter app
```

That is the whole mental model: you work in the server and the app, and Serverpod maintains the client between them. Everything else in the workspace supports those three, and the sections below introduce each piece as you need it.

<details>
<summary>Expand the full workspace tree.</summary>
<p>

```text
myproject/
├── pubspec.yaml                  # Workspace root: one `dart pub get` resolves all packages
├── AGENTS.md                     # Instructions for AI agents working in the project
├── .github/                      # CI workflows: analyze, format, and test
├── .vscode/                      # Attach-to-server debug configs and a serverpod start task
├── .agents/                      # Agent skills, plus MCP configs for the editors you picked
├── myproject_server/             # Your server
│   ├── bin/main.dart             # Entry point, calls run() in lib/server.dart
│   ├── lib/server.dart           # The run() function: creates and starts the server
│   ├── lib/src/greetings/        # Example feature: a model file and an endpoint
│   ├── lib/src/auth/             # Endpoints for the scaffolded email sign-in
│   ├── lib/src/web/              # Routes and widgets for the web server
│   ├── lib/src/generated/        # Generated server code (do not edit)
│   ├── config/                   # Run-mode configs, passwords, generator.yaml
│   ├── migrations/               # Database migrations
│   ├── web/                      # Static files and pages the web server serves
│   ├── test/integration/         # Endpoint tests and generated test tools
│   └── docker-compose.yaml       # Container alternative for the database, plus the test database
├── myproject_client/             # Generated client package
│   └── lib/src/protocol/         # Generated calls and models (do not edit)
└── myproject_flutter/            # Your Flutter app
    ├── lib/main.dart             # App code: creates the global Client
    ├── lib/screens/              # Scaffolded sign-in and greetings screens
    ├── lib/driver.dart           # Entry point serverpod start uses to launch the app
    └── assets/config.json        # The server URL the app reads at startup
```

The exact set depends on your create-time choices: the auth endpoints and sign-in screen come with authentication, the web pieces with the web server option, and the agent and MCP files with the editors you picked.

</p>
</details>

## How the packages relate

The Flutter app depends on the client package, and the client is how the app reaches the server: it holds a typed method for every endpoint you write. Neither the server nor the client depends on the other; instead, the server's `config/generator.yaml` points at the client package (`client_package_path`), and code generation writes the client's contents directly.

The workspace is a Dart pub workspace: each package declares `resolution: workspace`, and a single `dart pub get` at the project root resolves all three.

## Where your code lives, and what is generated

You write two kinds of source files on the server, and both can live anywhere under the server's `lib/`:

- **Model files** (`.spy.yaml`) define your serializable classes and database tables. The template keeps them next to the code that uses them, such as `lib/src/greetings/greeting.spy.yaml`. See [Working with models](../data-and-the-database/models).
- **Endpoints** are Dart classes extending `Endpoint`, such as `lib/src/greetings/greeting_endpoint.dart`. Each public method becomes a callable client method: `GreetingEndpoint.hello` is called as `client.greeting.hello(...)`. See [Working with endpoints](../endpoints-and-apis).

The scaffolded project follows the same pattern beyond the greeting example: `lib/src/auth/` holds the endpoints behind the default email sign-in, and `lib/src/web/` holds the routes the web server serves.

From those, `serverpod generate` produces the bridge between server and app:

- On the server, `lib/src/generated/` gets the endpoint dispatch code, the protocol description, and a Dart class per model.
- In the client package, `lib/src/protocol/` gets the `Client` class with its typed endpoint methods, plus the same model classes for the app's side.
- In `test/integration/test_tools/`, the generated [test tools](../testing/get-started).

Generated code is overwritten on every run, so never edit it; the scaffolded analyzer config excludes it for that reason. While [`serverpod start`](./running-your-server) runs, generation happens automatically when you save; outside a session, run `serverpod generate` yourself.

## The server entry point

The server starts in `bin/main.dart`, which only calls the `run` function in `lib/server.dart`. That function creates the server, wires it to your generated code, registers everything that is not an endpoint, and starts it:

```dart
void run(List<String> args) async {
  // Connect the server with your generated code.
  final pod = Serverpod(args, Protocol(), Endpoints());

  // Registrations go here: authentication services and web routes
  // in the scaffolded project, and anything else you add.

  // Start the server.
  await pod.start();
}
```

Endpoints need no registration: the generated `Endpoints` object passed to the constructor carries them all. Web routes, by contrast, are registered imperatively on `pod.webServer`, which is why the scaffolded `run()` contains route setup. When `pod.start()` runs, the server connects to the database, applies pending migrations when started with `--apply-migrations`, connects to Redis if enabled, brings up its servers, and starts background work such as [future calls](../scheduling/setup) and [health checks](../operations/health-checks).

## The three servers

One Serverpod instance runs up to three servers, each on its own port in development:

- **The API server (8080)** handles incoming endpoint calls from your app. This is the server your generated client talks to.
- **The Insights server (8081)** is a separate, secret-protected server used by Serverpod's tooling. See [Insights](../../tools/insights).
- **The web server (8082)** serves web content: HTML routes, static files, and your built Flutter web app. See [Web server](../web-server/overview).

The scaffolded development config also reserves port 8090 for the database and 8091 for Redis.

## The config and migrations directories

The server's `config/` directory holds one YAML file per [run mode](./configuration#run-modes) (`development`, `test`, `staging`, `production`), the `passwords.yaml` secrets file scaffolded with generated per-environment secrets, and `generator.yaml`, which configures code generation. See [Configuration](./configuration) for all of them.

The `migrations/` directory starts with one migration that creates your initial schema, and grows as your models change. See [Migrations](../data-and-the-database/database/migrations).

After the first server start, a gitignored `.serverpod/` directory also appears in the server package: it holds the [embedded database's](./configuration#database-backends) data files, one subdirectory per run mode, created by the server on demand.

## Editor and agent files

The workspace ships ready for IDE debugging and AI agents: `.vscode/` contains attach configurations that connect the debugger to a running `serverpod start` session, `AGENTS.md` instructs AI agents on how to work in the project, and, depending on the editors you picked at create time, agent skills are installed under `.agents/` and MCP configuration files register Serverpod's [MCP server](../cli/commands/mcp-server) with your editor. The agent configuration files are excluded from version control by the workspace `.gitignore`.

## Related

- [How it works](../../how-it-works): the guided tour of building with Serverpod.
- [Running your server](./running-your-server): the development loop around this project.
- [Configuration](./configuration): every file in `config/` in depth.
- [Working with endpoints](../endpoints-and-apis): writing the API the client calls.
- [Working with models](../data-and-the-database/models): defining your data.
