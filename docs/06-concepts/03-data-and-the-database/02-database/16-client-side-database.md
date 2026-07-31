---
description: The client-side database runs SQLite on the Flutter client with the same ORM interface as the server, including CRUD, relations, and transactions.
---

# Client-side database

The client-side database stores data on the device your app runs on, such as a phone or a browser, in a SQLite database. You query it with the same generated model methods you use on the server. This is useful for local caches, offline data, and state that belongs to the app rather than the server.

## Enable the client-side database

A table model opts into the device database with the `database` keyword. Setting it to `client` generates the table only on the device, and `all` generates it on both the server and the device. The full value set is covered on the [Tables](tables#choosing-where-a-table-lives) page.

```yaml
class: Company
table: company
database: client
```

When at least one table model has `database: client` or `database: all`, the generated `Client` class gets a `createSession` method that opens a SQLite database file and returns a `ClientDatabaseSession`.

:::info
The generated code depends on the `serverpod_database` package. Add it to your client package's `pubspec.yaml`.
:::

## Create a session

On Flutter, resolve a file path and call `createSession`:

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:my_project_client/my_project_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Point the client at your server as usual.
  final client = Client('http://localhost:8080/');

  // Resolve the database path.
  final path = await resolveDatabasePath('app.db');

  // Create the session to use in database operations.
  final session = await client.createSession(path, isDebugMode: kDebugMode);
}

Future<String> resolveDatabasePath(String fileName) async {
  if (kIsWeb) return fileName;
  final dir = await getApplicationSupportDirectory();
  return p.join(dir.path, fileName);
}
```

Creating the session opens the database file, so keep one session for the lifetime of the app, for example in your state management, instead of creating a new one per operation. Call `close()` on the session to close the underlying database when you are done with it. On the web there is no file system, which is why the example passes a bare name instead of a path.

:::info
SQLite runs in WAL mode, so `<path>-shm` and `<path>-wal` files may exist next to the database file while the session is open.
:::

## Run migrations on the device

Client tables get their own migrations. Whenever a migration is created for a project with client database tables, matching SQLite migrations are also generated under the client package's `lib/migrations/` directory.

By default, `createSession` applies pending client migrations when it opens the database (`runMigrations: true`). Passing `false` skips them, which can leave the database out of sync with your models, so only do so if you apply migrations through another code path.

With `isDebugMode: true`, the database integrity is verified after migrations are applied. On SQLite this includes a foreign key check that throws a `SqliteForeignKeyViolationException` if it finds violating rows. See [Database exceptions](exceptions#sqlite-foreign-key-checks). On Flutter, pass `kDebugMode` so the verification runs in debug builds only.

## Use the database

The session works like a server-side session in database calls. Pass it to the generated model methods:

```dart
var companies = await Company.db.find(
    session,
    where: (t) => t.name.like('%Ltd'),
    orderBy: (t) => t.name,
);
```

[CRUD](crud), [filtering](./filtering), [sorting](./sorting), [pagination](pagination), [relations](relations/), and [transactions](transactions) all work as they do on the server. Because the database is SQLite, the SQLite-specific behaviors apply:

- `like` and `ilike` are both case-insensitive for ASCII characters. See [filtering](./filtering#ilike).
- Transaction isolation levels are ignored, and transactions always run serialized. See [transactions](transactions#transaction-isolation).
- [Row locking](row-locking) calls do nothing, since SQLite allows only one write transaction at a time.
- [Vector](vector-and-geography-fields#vector-fields) queries are not supported, and [geography](vector-and-geography-fields#geography-fields) values round-trip through CRUD but throw on spatial query operations.
