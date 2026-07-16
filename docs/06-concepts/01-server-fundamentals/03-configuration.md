---
description: Configuration in Serverpod comes from YAML files, environment variables, or a Dart config object, with run modes, source precedence, and secrets.
---

# Configuration

Configuration decides what your server listens on, which database and Redis (an in-memory store Serverpod can use for pub/sub and caching) it connects to, and how it behaves in each run mode, so the same code runs locally, in staging, and in production without edits. Serverpod reads configuration from three sources: the `config/<run-mode>.yaml` files, environment variables, and a `ServerpodConfig` Dart object passed to the `Serverpod` constructor. You can mix them, and each source overrides the ones before it.

With no configuration at all, Serverpod falls back to built-in defaults, so you can start with nothing and add configuration as you need it.

## How configuration works

The three sources apply in order of precedence. The YAML files are the baseline, environment variables override the YAML files, and the Dart configuration object overrides both:

- **YAML files** (`config/development.yaml`, `config/staging.yaml`, `config/production.yaml`, `config/test.yaml`): the baseline configuration, one file per run mode.
- **Environment variables**: override matching YAML values, useful for per-deployment settings and secrets.
- **Dart configuration object**: a `ServerpodConfig` passed to the `Serverpod` constructor, overriding everything else.

For every available option, its environment variable, config-file key, and default, see the [Configuration reference](../lookups/configuration-reference).

### Defaults

If no YAML config files exist, no environment variables are configured, and no Dart config is supplied, the server runs with this built-in default: the API server on port 8080 at `localhost`.

```dart
ServerpodConfig(
  apiServer: ServerConfig(
    port: 8080,
    publicHost: 'localhost',
    publicPort: 8080,
    publicScheme: 'http',
  ),
);
```

## Run modes

The server always runs in one of four run modes: `development` (the default), `test`, `staging`, or `production`. The run mode is selected with the `--mode` argument when the server starts, and it decides what the server loads:

- The matching `config/<run-mode>.yaml` file.
- The matching section of the [passwords file](#manage-secrets), merged with its `shared` section.

The `test` mode is used by the [test tools](../testing/get-started), which start the server against `config/test.yaml`. The other modes separate your local setup from your deployed environments. See [Running your server](./running-your-server#choose-a-run-mode) for how to pass `--mode` through `serverpod start`.

Run modes configure the server side. Your Flutter app picks the matching server address per environment on its own; see [Point the client at each environment](../endpoints-and-apis#point-the-client-at-each-environment).

## Resolve files from the server package directory

Serverpod normally resolves its runtime files relative to the process working directory. Generated projects start the process from the server package root, so they do not need any additional configuration.

Pass `serverDirectory` to the `Serverpod` constructor when another launcher starts the process from a different directory. Common examples include a monorepo-level launcher, a test isolate, or a process started by another tool with an inherited working directory.

For example, a launcher running from a monorepo root can point Serverpod at a nested server package:

```dart
import 'dart:io';

void run(List<String> args) async {
  var serverDirectory = Directory.fromUri(
    Directory.current.uri.resolve('apps/my_app_server/'),
  );

  var pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    serverDirectory: serverDirectory,
  );

  await pod.start();
}
```

Serverpod converts the directory to an absolute path when it is constructed. It uses that directory to resolve:

- `config/<run-mode>.yaml`.
- `config/passwords.yaml`.
- Migration files under `migrations/`, including module migrations.
- A relative SQLite `database.filePath`.
- A relative embedded PostgreSQL `database.dataPath`.

Passing a `ServerpodConfig` object can replace the YAML configuration, but `serverDirectory` still anchors migrations and relative database paths. Absolute database paths and SQLite's `:memory:` value are unchanged.

The selected directory is available as `pod.serverDirectory`. Serverpod does not automatically resolve paths opened by your application code, such as templates or custom static files. Anchor those paths explicitly when needed:

```dart
var template = File.fromUri(
  pod.serverDirectory.uri.resolve('assets/welcome_email.html'),
);
```

## Configure with YAML files

The `config` directory at the root of the server project holds one file per run mode, created with your project. The server loads the file named after the run mode it starts in: `config/development.yaml` is used when running in the `development` run mode. This is the scaffolded development file for a project named `myproject`, with comments and optional keys removed:

```yaml title="config/development.yaml"
apiServer:
  port: 8080
  publicHost: localhost
  publicPort: 8080
  publicScheme: http

insightsServer:
  port: 8081
  publicHost: localhost
  publicPort: 8081
  publicScheme: http

webServer:
  port: 8082
  publicHost: localhost
  publicPort: 8082
  publicScheme: http

database:
  host: localhost
  port: 8090
  name: myproject
  user: postgres
  dataPath: .serverpod/development/pgdata

redis:
  enabled: false
  host: localhost
  port: 8091

maxRequestSize: 524288

sessionLogs:
  persistentEnabled: true
  consoleEnabled: true
  consoleLogFormat: text
```

The three server blocks configure Serverpod's three servers: the API server your app talks to, the [Insights](../../tools/insights) server used by Serverpod's tooling, and the [web server](../web-server/overview) for serving web content. The `sessionLogs` block controls how session logs are stored and printed; see [Logging](../operations/logging). Keys not in the scaffolded file cover future calls, websocket ping intervals, and more; see the [Configuration reference](../lookups/configuration-reference) for the full list with defaults.

### Database backends

Serverpod supports both PostgreSQL and SQLite as database backends.

:::warning
All run modes must use the same database backend: creating migrations fails otherwise. This also keeps your development environment consistent with production.
:::

#### PostgreSQL

New projects run an embedded PostgreSQL in the `development` and `test` run modes. When `dataPath` is set, the server boots and manages a PostgreSQL in that directory before connecting, so there is no separate database to install or start. The embedded database is for local development and testing only; in production, connect to an external PostgreSQL by omitting `dataPath`:

```yaml
database:
  host: localhost
  port: 8090
  name: database_name
  user: postgres
  maxConnectionCount: 10
```

Set the database password in `passwords.yaml` (`database`) or through `SERVERPOD_PASSWORD_database`.

#### SQLite

```yaml
database:
  filePath: server.db
```

No database password is required when using SQLite. Persistent session logs are not supported on SQLite: the server keeps console logging and warns if persistent logging is enabled.

## Configure in Dart

To configure Serverpod in Dart, pass an instance of the `ServerpodConfig` class to the `Serverpod` constructor, normally inside the `run` function in your `server.dart` file. When you configure this way, `apiServer` is the one field you must provide.

```dart
Serverpod(
  args,
  Protocol(),
  Endpoints(),
  config: ServerpodConfig(
    apiServer: ServerConfig(
      port: 8080,
      publicHost: 'localhost',
      publicPort: 8080,
      publicScheme: 'http',
    ),
    insightsServer: ServerConfig(
      port: 8081,
      publicHost: 'localhost',
      publicPort: 8081,
      publicScheme: 'http',
    ),
    webServer: ServerConfig(
      port: 8082,
      publicHost: 'localhost',
      publicPort: 8082,
      publicScheme: 'http',
    ),
  ),
);
```

## Manage secrets

Secrets are declared in the `config/passwords.yaml` file. Serverpod's API reads them with `getPassword`, so this page uses *secret* and *password* interchangeably. The file has a `shared` section, applied in all run modes, and one section per run mode:

```yaml title="config/passwords.yaml"
shared:
  stripeApiKey: 'sk_test_123...'

development:
  database: 'development_password'
  redis: 'development_password'
  serviceSecret: 'development_service_secret'
  twilioApiKey: 'dev_twilio_key'

production:
  database: 'production_password'
  redis: 'production_password'
  serviceSecret: 'production_service_secret'
  twilioApiKey: 'prod_twilio_key'
```

You can also provide any secret through [environment variables](#via-environment-variables).

### Built-in secrets

The following table shows the built-in secrets that Serverpod uses for its core functionality. These can be configured either through environment variables or by adding the corresponding key in a run-mode or `shared` section of the passwords file. They are separate from any custom secrets you define.

| Environment variable             | Passwords file | Default | Description                                                          |
| -------------------------------- | -------------- | ------- | -------------------------------------------------------------------- |
| SERVERPOD_PASSWORD_database      | database       | -       | The password for the database.                                        |
| SERVERPOD_PASSWORD_serviceSecret | serviceSecret  | -       | The token used to connect with Insights. Must be at least 20 characters. |
| SERVERPOD_PASSWORD_redis         | redis          | -       | The password for the Redis server.                                    |

Each built-in secret also has a dedicated environment variable: `SERVERPOD_DATABASE_PASSWORD`, `SERVERPOD_SERVICE_SECRET`, and `SERVERPOD_REDIS_PASSWORD`. All environment variables override the passwords file, and the `SERVERPOD_PASSWORD_*` form wins when both are set.

### Secrets for first-party packages

For secrets related to first-party Serverpod packages, see their respective documentation:

- **Cloud storage**: see [Uploading files](../endpoints-and-apis/file-uploads) for Google Cloud Storage, AWS S3, and Cloudflare R2 secrets.
- **Authentication**: see [Storing Secrets](../authentication/setup#storing-secrets) on the Authentication setup page.

### Custom secrets

Add your own keys to the passwords file the same way, under `shared` or a run-mode section, as `stripeApiKey` and `twilioApiKey` are in the example above.

#### Via environment variables

You can also define custom secrets using environment variables with the `SERVERPOD_PASSWORD_` prefix. For example, `SERVERPOD_PASSWORD_myApiKey` becomes available as `myApiKey`: the prefix is stripped. These variables override same-named entries in the passwords file and, like the `shared` section, apply in all run modes.

```bash
export SERVERPOD_PASSWORD_stripeApiKey=sk_test_123...
```

### Access secrets in code

Secrets are only available on the server. They are never sent to or accessible from your Flutter app.

Inside an endpoint, read a secret from the [`Session`](../endpoints-and-apis/sessions) through the `passwords` map:

```dart
Future<void> processPayment(Session session, PaymentData data) async {
  final stripeApiKey = session.passwords['stripeApiKey'];
  // Use the API key to make requests to Stripe.
}
```

The same value is available from `session.serverpod.getPassword('stripeApiKey')`.

Outside of a request, for example during startup in your server's `run` function, read it from the `Serverpod` instance with `getPassword`:

```dart
// `pod` is the Serverpod instance created in run().
final stripeApiKey = pod.getPassword('stripeApiKey');
```

This works for built-in and custom secrets alike, whether they come from the passwords file or an environment variable.

### Secrets in production

A new project's `.gitignore` excludes `config/passwords.yaml` and credential files such as `config/firebase_service_account_key.json`, so secrets are not committed by default. Keep production secrets out of source control.

In production, set secrets through `SERVERPOD_PASSWORD_*` environment variables, or your host's secret manager, rather than a checked-in passwords file.

### Passwords on Serverpod Cloud

On [Serverpod Cloud](/cloud), you set the values that `getPassword` reads from the command line, with `scloud password set`, instead of editing a passwords file. See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for the full reference.

## Configure code generation

Serverpod uses a `generator.yaml` file to configure code generation. Place this file in the `config` directory of your server project.

For every `generator.yaml` option, its type and default, see the [Configuration reference](../lookups/configuration-reference#code-generation). The sections below explain the options you set most often.

### Package types

The `type` field determines how Serverpod treats your package:

- **server**: A standard Serverpod application (default).
- **module**: A reusable module that can be imported by other Serverpod projects.
- **internal**: Used only by Serverpod's own framework packages; you will not use this.

For modules, you can also specify a `nickname`:

```yaml
type: module
nickname: auth
```

### Client package path

By default, Serverpod expects the client package to be located at `../[project_name]_client`. You can customize this:

```yaml
client_package_path: ../my_custom_client
```

### Test tools generation

Fresh projects include this line in `generator.yaml`, which generates the integration test tools:

```yaml
server_test_tools_path: test/integration/test_tools
```

Delete the line to stop generating test tools. See the [testing documentation](../testing/get-started) for how the test tools are used.

### Module dependencies

Declare module dependencies and optionally assign nicknames for easier reference:

```yaml
modules:
  serverpod_auth_core:
    nickname: auth
  my_custom_module:
    nickname: custom
```

This allows you to reference module classes as `module:auth:AuthUser` in your model files. See the [modules documentation](./modules) for more information.

### Shared packages

Shared packages let you define models that can be imported by both server and client code. They depend only on `serverpod_serialization` and are safe to use across your full stack. Configure them in `generator.yaml`:

```yaml
shared_packages:
  - ../my_shared_package
  - ../another_shared_package
```

Models and the protocol file are generated in each shared package's own directory when you run `serverpod generate` from your server project. See the [shared packages documentation](../data-and-the-database/models/shared-packages) for setup, usage, and restrictions.

### Custom serializable classes

Register custom classes for use in your models:

```yaml
extraClasses:
  - package:my_shared_package/my_shared_package.dart:CustomClass
  - package:my_shared_package/my_shared_package.dart:AnotherCustomClass
```

See the [serialization documentation](../data-and-the-database/models/custom-serialization) for implementing custom serializable classes.

### Features

Control which Serverpod features are enabled:

```yaml
features:
  database: false
```

A server that does not use a database can set `database: false` to skip migrations and table generation.

### Experimental features

No experimental features are available in the current version. The `experimental_features` key is how you opt in when they exist; `all` enables every available one:

```yaml
experimental_features:
  all: true
```

See the [experimental features documentation](../operations/experimental-features) for details.

:::warning
Experimental features may change or be removed in future versions.
:::

## Related

- [Configuration reference](../lookups/configuration-reference): every option with its environment variable, config key, and default.
- [Running your server](./running-your-server): how the server starts and how `--mode` is passed.
- [Database connection](../data-and-the-database/database/connection): connecting to your database in depth.
- [Configure HTTP calls](../endpoints-and-apis/configure-http-calls): the API server's response headers and CORS defaults.
