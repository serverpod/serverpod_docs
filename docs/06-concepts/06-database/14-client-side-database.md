# Client-side database

When at least one table model has `database: client` or `database: all`, the generated `Client` class gets a `createSession` method that returns a `ClientDatabaseSession` for a SQLite database file.

```dart
  /// Creates a new client-side database session for the given path.
  ///
  /// The [path] is the file path to the SQLite database file. Since SQLite uses
  /// WAL mode, note that `[path]-shm` and `[path]-wal` files might also exist
  /// transiently for the database while the session is open.
  ///
  /// If [runMigrations] is true, pending migrations will be applied when
  /// opening the database. Be careful when setting this to false, as it might
  /// lead to inconsistencies between the models and the database.
  ///
  /// If [isDebugMode] is true, the database integrity will be verified after
  /// the migrations are applied to provide feedback of possible issues. On a
  /// Flutter application, this should be set to [kDebugMode].
  Future<ClientDatabaseSession> createSession(
    String path, {
    bool runMigrations = true,
    bool isDebugMode = false,
  }) async {
    /* Generated implementation */
  }
```

:::info
When generating with client-side database support, the `serverpod_database` package is required as a dependency in your client package. Make sure to add it to your `pubspec.yaml` file.
:::

## Creating a client-side database session

On Flutter, create a client-side database session by resolving a file path and calling `createSession`:

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:my_project_client/my_project_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set the client URL to the server URL as normal.
  final client = Client(clientUrl);

  // Resolve the database path.
  final path = await resolveDatabasePath('app.db');

  // Create the session to use in database operations.
  final session = await client.createSession(path, isDebugMode: kDebugMode);

  // Store the session in your state manager to use it all database operations.
  // Since the session opens and closes the database when created, it is not
  // recommended to create a new session for each database operation.
}

Future<String> resolveDatabasePath(String fileName) async {
  if (kIsWeb) return fileName;
  final dir = await getApplicationSupportDirectory();
  return p.join(dir.path, fileName);
}
```

## Using the client-side database

The client-side database session provides access to the database methods for the generated models. It can be used normally as with the server-side database session.

```dart
var companies = await Company.db.find(
    session,
    where: (t) => t.name.like('%Ltd'),
    orderBy: (t) => t.name,
);
```

All ORM features supported by SQLite are available on the client-side as well, including full CRUD support, relations, transactions, and more.
