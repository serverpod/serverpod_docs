---
description: Configuration in Serverpod comes from YAML files, environment variables, or a Dart config object, with run modes, source precedence, and secrets.
---

# Configuration

Configuration decides what your server listens on, which database and Redis it connects to, and how it behaves in each run mode, so the same code runs locally, in staging, and in production without edits. Serverpod reads configuration from three sources: environment variables, the `config/<run-mode>.yaml` files, and a `ServerpodConfig` Dart object passed to the `Serverpod` constructor. You can mix them, and each source overrides the ones before it.

The only settings you must provide are for the API server. With no configuration at all, Serverpod uses its built-in defaults.

## How configuration works

The three sources apply in order of precedence. The YAML files are the baseline, environment variables override the YAML files, and the Dart configuration object overrides both:

- **YAML files** (`config/development.yaml`, `config/staging.yaml`, `config/production.yaml`, `config/test.yaml`): the baseline configuration, one file per run mode.
- **Environment variables**: override matching YAML values, useful for per-deployment settings and secrets.
- **Dart configuration object**: a `ServerpodConfig` passed to the `Serverpod` constructor, overriding everything else.

For every available option, its environment variable, config-file key, and default, see the [Configuration reference](lookups/configuration-reference).

## Configuration files

Name each config file after the run mode you start the server in and place it in the `config` directory at the root of the server project. For example, `config/development.yaml` is used when running in the `development` run mode.

```yaml
apiServer:
  port: 8080
  publicHost: localhost
  publicPort: 8080
  publicScheme: http
  websocketPingInterval: 30

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
  name: database_name
  user: postgres
  maxConnectionCount: 10

redis:
  enabled: false
  host: localhost
  port: 8091

maxRequestSize: 524288

sessionLogs:
  persistentEnabled: true
  cleanupInterval: 24h
  retentionPeriod: 90d
  retentionCount: 100000
  consoleEnabled: true
  consoleLogFormat: json

futureCallExecutionEnabled: true

futureCall:
  concurrencyLimit: 1
  scanInterval: 5000
```

### Database backends

Serverpod supports both PostgreSQL and SQLite as database backends.

:::warning
The same database backend must be used for all run modes. Otherwise, an error will be thrown when generating migrations. This practice is recommended to ensure that the development environment is consistent with the production environment.
:::

#### PostgreSQL

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

No database password is required when using SQLite.

## Configure in Dart

To configure Serverpod in Dart, pass an instance of the `ServerpodConfig` class to the `Serverpod` constructor. This config overrides any environment variables or config files present. The `Serverpod` constructor is normally used inside the `run` function in your `server.dart` file. At a minimum, the `apiServer` has to be provided.

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

### Default configuration

If no YAML config files exist, no environment variables are configured, and no Dart config is supplied, this default configuration is used.

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

## Secrets

Secrets are declared in the `passwords.yaml` file. Serverpod's API reads them with `getPassword`, so this page uses *secret* and *password* interchangeably. The password file is structured with a common `shared` section, any secret put here will be used in all run modes. The other sections are the names of the run modes followed by respective key/value pairs. You can also define custom secrets using [environment variables](#via-environment-variables).

### Built-in secrets

The following table shows the built-in secrets that Serverpod uses for its core functionality. These can be configured either through environment variables or by adding the corresponding key in a respective run mode or shared section in the passwords file. These are separate from any custom passwords you might define.

| Environment variable             | Passwords file | Default | Description                                                       |
| -------------------------------- | -------------- | ------- | ----------------------------------------------------------------- |
| SERVERPOD_PASSWORD_database      | database       | -       | The password for the database                                     |
| SERVERPOD_PASSWORD_serviceSecret | serviceSecret  | -       | The token used to connect with insights must be at least 20 chars |
| SERVERPOD_PASSWORD_redis         | redis          | -       | The password for the Redis server                                 |

### Secrets for first-party packages

For secrets related to first-party Serverpod packages, see their respective documentation:

- **Cloud storage**: see [Uploading files](file-uploads) for Google Cloud Storage, AWS S3, and Cloudflare R2 secrets.
- **Authentication**: see [Storing Secrets](authentication/setup#storing-secrets) on the Authentication setup page.

### Custom secrets

You can define your own custom secrets in two ways.

#### Via the passwords file

Add your custom secrets directly to the passwords file under the `shared` section (available in all run modes) or under specific run mode sections.

```yaml
shared:
  myCustomSharedSecret: 'secret_key'
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

#### Via environment variables

You can also define custom passwords using environment variables with the `SERVERPOD_PASSWORD_` prefix. For example, `SERVERPOD_PASSWORD_myApiKey` will be available as `myApiKey` (the prefix is stripped). These environment variables will override any passwords defined in the passwords file if the name (after stripping the prefix) matches. Like the `shared` section in the passwords file, these environment variables are available in all run modes.

| Environment variable format | Description                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SERVERPOD_PASSWORD\_\*      | Custom password that will be available in the Session.passwords map. The prefix `SERVERPOD_PASSWORD_` will be stripped from the key name. |

To define a custom password through an environment variable:

```bash
export SERVERPOD_PASSWORD_stripeApiKey=sk_test_123...
```

### Access secrets in code

Secrets are only available on the server. They are never sent to or accessible from your Flutter app.

Inside an endpoint, read a secret from the [`Session`](sessions) through the `passwords` map:

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

On [Serverpod Cloud](/cloud), the values you read with `getPassword` live in the **Passwords** tier. Set them from the command line instead of editing a passwords file:

```bash
scloud password set stripeApiKey "sk_live_..."
```

Use `--from-file` for long or multi-line values such as a service account JSON. Cloud stores each password encrypted and injects it so `getPassword` reads it exactly as it does locally. See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for the full reference.

## Configure code generation

Serverpod uses a `generator.yaml` file to configure code generation. Place this file in the `config` directory of your server project.

For every `generator.yaml` option, its type and default, see the [Configuration reference](lookups/configuration-reference#code-generation). The sections below explain the options you set most often.

### Package types

The `type` field determines how Serverpod treats your package:

- **server**: A standard Serverpod application (default)
- **module**: A reusable module that can be imported by other Serverpod projects
- **internal**: Internal Serverpod framework packages

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

Test tools for integration testing are generated by default at `test/integration/test_tools`. To disable test tools generation, remove the `server_test_tools_path` from your configuration:

```yaml
# Remove or comment out this line to disable test tools
# server_test_tools_path: test/integration/test_tools
```

See the [testing documentation](testing/get-started) for more details.

### Module dependencies

Declare module dependencies and optionally assign nicknames for easier reference:

```yaml
modules:
  serverpod_auth_core:
    nickname: auth
  my_custom_module:
    nickname: custom
```

This allows you to reference module classes as `module:auth:AuthUser` in your model files. See the [modules documentation](modules) for more information.

### Shared packages

Shared packages let you define models that can be imported by both server and client code. They depend only on `serverpod_serialization` and are safe to use across your full stack. Configure them in `generator.yaml`:

```yaml
shared_packages:
  - ../my_shared_package
  - ../another_shared_package
```

Models and the protocol file are generated in each shared package's own directory when you run `serverpod generate` from your server project. See the [shared packages documentation](shared-packages) for setup, usage, and restrictions.

### Custom serializable classes

Register custom classes for use in your models:

```yaml
extraClasses:
  - package:my_shared_package/my_shared_package.dart:CustomClass
  - package:my_shared_package/my_shared_package.dart:AnotherCustomClass
```

See the [serialization documentation](serialization) for implementing custom serializable classes.

### Features

Control which Serverpod features are enabled:

```yaml
features:
  database: false # Disables database features
```

### Experimental features

Enable experimental features that are still in development:

```yaml
experimental_features:
  all: true # Enables all available experimental features
```

The `all` key opts into every available experimental feature. No experimental features are available in the current version. See the [experimental features documentation](experimental) for details.

:::warning
Experimental features may change or be removed in future versions.
:::
