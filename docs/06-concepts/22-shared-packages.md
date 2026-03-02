# Shared packages

Shared packages let you define models and logic that can be safely imported in both server and client code. They contain the models and the protocol file, depend exclusively on the `serverpod_serialization` package, and have no server-only dependencies. This makes them ideal for data structures that need to be used across your full stack—for example, DTOs, API request/response shapes, or domain models that flow between Flutter and your Serverpod backend with their custom logic.

Models and the protocol file are generated in the shared package's own directory when you run `serverpod generate` from your server project. The shared package is tied to the project through the `shared_packages` field in `config/generator.yaml`.

## Setup

### 1. Create the shared package

Create a new Dart package (e.g., `my_shared_package`) with a minimal `pubspec.yaml`:

```yaml
name: my_shared_package
description: Models shared between server and client
version: 1.0.0
publish_to: none

environment:
  sdk: ^3.8.0

dependencies:
  serverpod_serialization: SERVERPOD_VERSION
```

:::info
Use the same Serverpod version as your project. Replace `SERVERPOD_VERSION` with your Serverpod version (e.g., `3.4.0`).
:::

### 2. Add model files

Place your `.spy.yaml` model files anywhere under the package's `lib` directory:

```text
my_shared_package/
├── lib/
│   ├── my_shared_package.dart
│   └── src/
│       └── models/
│           └── shared_model.spy.yaml
└── pubspec.yaml
```

Example model:

```yaml
# lib/src/models/shared_model.spy.yaml
class: SharedModel
fields:
  id: UuidValue, default=random
  name: String
  description: String?
  createdAt: DateTime, default=now
```

### 3. Configure the server project

Add the shared package to your server's `config/generator.yaml`:

```yaml
shared_packages:
  - ../my_shared_package
```

Paths are relative to the server project directory. You can list multiple shared packages.

### 4. Generate code

Run `serverpod generate` from your server directory.

```bash
$ serverpod generate
```

This generates the Dart classes and protocol in the shared package's `lib/src/generated/` directory. After generation, a typical shared package looks like:

```text
my_shared_package/
├── lib/
│   ├── my_shared_package.dart
│   └── src/
│       ├── generated/
│       │   ├── protocol.dart
│       │   └── models/
│       │       └── shared_model.dart
│       └── models/
│           └── shared_model.spy.yaml
└── pubspec.yaml
```

Then, add the export for the `protocol.dart` file to the shared package's `lib/my_shared_package.dart` file to make the classes available in the shared package:

```dart
export 'src/generated/protocol.dart';
```

### 5. Add the dependency

Add the shared package to both your server and client (or Flutter app) `pubspec.yaml`:

```yaml
# In my_project_server/pubspec.yaml and my_project_client/pubspec.yaml
dependencies:
  my_shared_package:
    path: ../my_shared_package
```

## Using shared models

### In server and client code

Import the shared package and use the generated classes:

```dart
import 'package:my_shared_package/my_shared_package.dart';

// Use in endpoints, Flutter widgets, etc.
final profile = UserProfile(
  displayName: 'Alice',
  avatarUrl: 'https://example.com/avatar.png',
);
```

### Extending shared models

You can define a base model in a shared package and extend it on the server to add database persistence. Shared packages cannot define table models, but the server can extend a shared model and add a `table` property.

**In the shared package** (`lib/src/shared/vehicle.spy.yaml`):

```yaml
class: Vehicle
fields:
  id: UuidValue, default=random
  brand: String
  model: String
```

**On the server** (`lib/src/models/car.spy.yaml`):

```yaml
class: Car
extends: Vehicle
table: cars
fields:
  year: int
```

The server model extends the shared `Vehicle` and adds a `table` for database persistence plus any additional fields. You can also add server-only fields with `scope=serverOnly` in the server subclass.

Note that the `Car` class will be available in the server and client packages as normal, unless it is defined as `serverOnly`.

### Referencing shared models in server models

Shared model names are available in the same namespace when the shared package is configured. Reference them directly in `extends`, `fields`, and other model definitions:

```yaml
class: MyModel
fields:
  sharedModel: SharedModel
  sharedModels: List<SharedModel>
```

## Restrictions

Shared models support most Serverpod model features, with these exceptions:

| Restriction | Reason |
| ----------- | ------ |
| No `table` property | Shared packages are not tied to a database. Use a server model that extends the shared model to add persistence. |
| No `serverOnly` on the class | Models must be usable on both server and client. |
| No `scope: serverOnly` on fields | All fields must be serializable for the client. |

If you need tables or server-only fields, define them in a server model that extends the shared model.

The shared package can also contain custom serializable classes. Register them in the server's `generator.yaml` under `extraClasses` if they need to be used in protocol serialization. See [Custom serializable classes](./configuration#custom-serializable-classes) for details.
