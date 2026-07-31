---
description: Every option withServerpod accepts, including run mode, database rollback behavior, server output, timeouts, and test tags.
---

# Configuration

The `withServerpod` helper takes optional named arguments that control how the test server starts and how tests are isolated from each other.

Some of the values below, such as `ServerpodRunMode` and `Constant`, come from `package:serverpod/serverpod.dart` rather than the generated test tools, so import it when you use them. The `serverDirectory` option takes a `Directory` from `dart:io`.

```dart
withServerpod(
  'Given Products endpoint',
  (sessionBuilder, endpoints) {
    /* test code */
  },
  rollbackDatabase: RollbackDatabase.afterAll,
);
```

## Options

| Option | What it does | Default |
| --- | --- | --- |
| `applyMigrations` | Whether pending migrations are applied when the test server starts. | `true` |
| `configOverride` | A function that changes values in the loaded config before the server starts. | `null` |
| `enableSessionLogging` | Whether session logging is on. | `false` |
| `experimentalFeatures` | Experimental features to enable, such as [diagnostic event handlers](../operations/exception-monitoring). | `null` |
| `rollbackDatabase` | When database changes are rolled back. See [below](#rollbackdatabase). | `RollbackDatabase.afterEach` |
| `runMode` | The run mode the server starts in. | `test` |
| `runtimeParametersBuilder` | Runtime parameters to apply before startup. See [runtime parameters](../data-and-the-database/database/runtime-parameters). | `null` |
| `serverDirectory` | The directory that `config/<runMode>.yaml`, `config/passwords.yaml`, and `migrations/` are resolved against. | The directory the test process runs in |
| `serverpodLoggingMode` | The logging mode used when creating Serverpod. | `ServerpodLoggingMode.normal` |
| `serverpodStartTimeout` | How long to wait for the server to start. | 30 seconds |
| `testGroupTagsOverride` | The tags applied to the generated test group. See [below](#test-tags). | `['integration']` |
| `testServerOutputMode` | How much server output reaches your terminal. See [below](#server-output). | `TestServerOutputMode.normal` |

:::info
In a project without a database, `applyMigrations`, `rollbackDatabase`, and `runtimeParametersBuilder` are not generated at all, so passing one is a compile error. Rollback is off in that case and there is nothing to migrate.
:::

Set `serverDirectory` when tests run from somewhere other than the server package, such as the workspace root. Without it the server resolves those paths against the current directory, misses your config, and falls over later on whatever it needed from it.

## Run mode

Tests run in the `test` run mode, so the server reads `config/test.yaml`. Point them at a different mode when you need its configuration instead:

```dart
withServerpod(
  'Given Products endpoint',
  (sessionBuilder, endpoints) {
    /* test code */
  },
  runMode: ServerpodRunMode.development,
);
```

## Database rollback {#rollbackdatabase}

By default each test runs inside a transaction that is rolled back when that test ends, so tests cannot see each other's data. Three values control this:

| Value | Rolls back |
| --- | --- |
| `RollbackDatabase.afterEach` | After every test. The default. |
| `RollbackDatabase.afterAll` | Once the whole `withServerpod` group finishes. |
| `RollbackDatabase.disabled` | Never. You clean up yourself. |

Three situations call for changing it.

**Tests that build on each other.** When one test depends on what the previous one left behind, `afterAll` keeps state across the group and still rolls everything back at the end. Tests that share state are usually worth avoiding, but this helps when the setup is expensive.

**Concurrent database work in an endpoint.** The rollback wraps each test in one transaction, and concurrent calls cannot be nested inside it. An endpoint that runs database calls or transactions in parallel throws `InvalidConfigurationException` unless you pass `RollbackDatabase.disabled`:

```dart
Future<void> concurrentTransactionCalls(Session session) async {
  await Future.wait([
    session.db.transaction((tx) => /*...*/),
    // Throws InvalidConfigurationException unless rollbackDatabase
    // is RollbackDatabase.disabled.
    session.db.transaction((tx) => /*...*/),
  ]);
}
```

With rollback disabled you clean up yourself, or later tests inherit the data:

```dart
withServerpod(
  'Given ProductsEndpoint when calling concurrentTransactionCalls',
  (sessionBuilder, endpoints) {
    tearDownAll(() async {
      var session = sessionBuilder.build();
      await Product.db.deleteWhere(session, where: (_) => Constant.bool(true));
    });

    test('then it commits all transactions', () async {
      var result =
          await endpoints.products.concurrentTransactionCalls(sessionBuilder);
      // ...
    });
  },
  rollbackDatabase: RollbackDatabase.disabled,
);
```

Tests that share a database this way also need to run one at a time, since the test runner runs files in parallel by default:

```bash
dart test -t integration --concurrency=1
```

This applies only when rollback is disabled. With rollback on, each `withServerpod` group has its own transaction and is already isolated from the others.

**Caught database exceptions.** This is the one case where the test tools behave differently from production:

```dart
var transactionFuture = session.db.transaction((tx) async {
  var data = UniqueData(number: 1, email: 'test@test.com');
  try {
    await UniqueData.db.insertRow(session, data, transaction: tx);
    await UniqueData.db.insertRow(session, data, transaction: tx);
  } on DatabaseException catch (_) {
    // Ignored.
  }
});

// Throws in production, but not under the test tools.
await transactionFuture;
```

In production a transaction fails if any database exception happened inside it, even one your code caught. The test tools emulate nested transactions and do not, so code that swallows database exceptions passes a test it would fail in production. Set `RollbackDatabase.disabled` to get production behavior.

## Server output

The `testServerOutputMode` option controls what the test server prints, which is the setting to reach for when you cannot see why a server failed:

| Value | Shows |
| --- | --- |
| `TestServerOutputMode.normal` | Errors only. The default. |
| `TestServerOutputMode.verbose` | Everything the server prints. |
| `TestServerOutputMode.silent` | Nothing. |

## Test tags

Test groups created by `withServerpod` are tagged `integration`, which is what lets you run integration and unit tests separately. Change the tag with `testGroupTagsOverride`. See [running tests separately](advanced-examples#run-unit-and-integration-tests-separately).

## Related

- [Writing tests](writing-tests): the pieces every test uses.
- [Advanced examples](advanced-examples): the options above put to work.
- [Server configuration](../server-fundamentals/configuration): the config files the test server reads.
