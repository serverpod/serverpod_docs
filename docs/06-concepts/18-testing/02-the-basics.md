# The basics

## Using `sessionBuilder` to set up a test scenario

The `withServerpod` helper provides a `sessionBuilder` object that helps with setting up different scenarios for tests. It looks like the following:

```dart
/// A test specific builder to create a [Session] that for instance can be used to call database methods.
/// The builder can also be passed to endpoint calls. The builder will create a new session for each call.
abstract class TestSessionBuilder {
  /// Given the properties set on the session through the `copyWith` method,
  /// this returns a serverpod [Session] that has the configured state.
  Session build();

  /// Creates a new unique session with the provided properties.
  /// This is useful for setting up different session states in the tests
  /// or simulating multiple users.
  TestSessionBuilder copyWith({
    AuthenticationOverride? authentication,
    bool? enableLogging,
  });
}
```

To create a new state, simply call `copyWith` with the new properties and use the new session builder in the endpoint call.

### Setting authenticated state

To control the authenticated state of the session, the `AuthenticationOverride` class can be used:

```dart
/// An override for the authentication state in a test session.
abstract class AuthenticationOverride {
  /// Sets the session to be authenticated with the provided userId and scope.
  static AuthenticationOverride authenticationInfo(
          int userId, Set<Scope> scopes,
          {String? authId});

  /// Sets the session to be unauthenticated. This is the default.
  static AuthenticationOverride unauthenticated();
}
```

Pass it to the `sessionBuilder.copyWith` to simulate different scenarios. Below follows an example for each case:

```dart
withServerpod('Given AuthenticatedExample endpoint', (sessionBuilder, endpoints) {
  // Corresponds to an actual user id
  const int userId = 1234;

  group('when authenticated', () {
    var authenticatedSessionBuilder = sessionBuilder.copyWith(
      authentication:
          AuthenticationOverride.authenticationInfo(userId, {Scope('user')}),
    );

    test('then calling `hello` should return greeting', () async {
      final greeting = await endpoints.authenticatedExample
          .hello(authenticatedSessionBuilder, 'Michael');
      expect(greeting, 'Hello, Michael!');
    });
  });

  group('when unauthenticated', () {
    var unauthenticatedSessionBuilder = sessionBuilder.copyWith(
      authentication: AuthenticationOverride.unauthenticated(),
    );

    test(
        'then calling `hello` should throw `ServerpodUnauthenticatedException`',
        () async {
      final future = endpoints.authenticatedExample
          .hello(unauthenticatedSessionBuilder, 'Michael');
      await expectLater(
          future, throwsA(isA<ServerpodUnauthenticatedException>()));
    });
  });
});
```

### Seeding the database

To seed the database before tests, simply `build` a `session` and pass to the database call exactly the same as in production code.

:::info

By default `withServerpod` does all database operations inside a transaction that is rolled back after each `test` case. See the [rollback database configuration](#rollback-database-configuration) for how to configure this behavior.

:::

```dart
withServerpod('Given Products endpoint', (sessionBuilder, endpoints) {
  var session = sessionBuilder.build();

  setUp(() async {
    await Product.db.insert(session, [
    Product(name: 'Apple', price: 10),
    Product(name: 'Banana', price: 10)
    ]);
  });

  test('then calling `all` should return all products', () async {
    final products = await endpoints.products.all(sessionBuilder);
    expect(products, hasLength(2));
    expect(products.map((p) => p.name), contains(['Apple', 'Banana']));
  });
});
```

## Environment

By default `withServerpod` uses the `test` run mode and the database settings will be read from `config/test.yaml`.

It is possible to override the default run mode by setting the `runMode` setting:

```dart
withServerpod(
  'Given Products endpoint',
  (sessionBuilder, endpoints) {
    /* test code */
  },
  runMode: ServerpodRunMode.development,
);
```

## Configuration

The following optional configuration options are available to pass as a second argument to `withServerpod`:

|Property|Type|Default|
|:-----|:-----|:---:|
|`rollbackDatabase`|`RollbackDatabase?`|`RollbackDatabase.afterEach`|
|`runMode`|`String?`|`ServerpodRunmode.test`|
|`enableSessionLogging`|`bool?`|`false`|
|`applyMigrations`|`bool?`|`true`|

### `rollbackDatabase` {#rollback-database-configuration}

By default `withServerpod` does all database operations inside a transaction that is rolled back after each `test` case. Just like the following enum describes, the behavior of the automatic rollbacks can be configured:

```dart
/// Options for when to rollback the database during the test lifecycle.
enum RollbackDatabase {
  /// After each test. This is the default.
  afterEach,

  /// After all tests.
  afterAll,

  /// Disable rolling back the database.
  disabled,
}
```

There are two main reasons to change the default setting:

1. **Scenario tests**: when consecutive `test` cases depend on each other. While generally considered an anti-pattern, it can be useful when the set up for the test group is very expensive. In this case `rollbackDatabase` can be set to `RollbackDatabase.afterAll` to ensure that the database state persists between `test` cases. At the end of the `withServerpod` scope, all database changes will be rolled back.

2. **Concurrent transactions in endpoints**: when concurrent calls are made to `session.db.transaction` inside an endpoint, it is no longer possible for the Serverpod test tools to do these operations as part of a top level transaction. In this case this feature should be disabled by passing `RollbackDatabase.disabled`.

```dart
Future<void> concurrentTransactionCalls(
  Session session,
) async {
  await Future.wait([
    session.db.transaction((tx) => /*...*/),
    // Will throw `InvalidConfigurationException` if `rollbackDatabase` 
    // is not set to `RollbackDatabase.disabled` in `withServerpod`
    session.db.transaction((tx) => /*...*/),
  ]);
}
```

When setting `rollbackDatabase.disabled` to be able to test `concurrentTransactionCalls`, remember that the database has to be manually cleaned up to not leak data:

```dart
withServerpod(
  'Given ProductsEndpoint when calling concurrentTransactionCalls',
  (sessionBuilder, endpoints) {
    tearDownAll(() async {
      var session = sessionBuilder.build();
      // If something was saved to the database in the endpoint,
      // for example a `Product`, then it has to be cleaned up!
      await Product.db.deleteWhere(
        session,
        where: (_) => Constant.bool(true),
      );
    });

    test('then should execute and commit all transactions', () async {
      var result =
          await endpoints.products.concurrentTransactionCalls(sessionBuilder);
      // ...
    });
  },
  rollbackDatabase: RollbackDatabase.disabled,
);
```

Additionally, when setting `rollbackDatabase.disabled`, it may also be needed to pass the `--concurrency=1` flag to the dart test runner. Otherwise multiple tests might pollute each others database state:

```bash
dart test integration_test --concurrency=1
```

For the other cases this is not an issue, as each `withServerpod` has its own transaction and will therefore be isolated.

### `runMode`

The run mode that Serverpod should be running in. Defaults to `test`.

### `enableSessionLogging`

Wether session logging should be enabled. Defaults to `false`.

### `applyMigrations`

Wether pending migrations should be applied when starting Serverpod. Defaults to `true`.

## Test exceptions

The following exceptions are exported from the generated test tools file and can be thrown by the test tools in various scenarios, see below.

|Exception|Description|
|:-----|:-----|
|`ServerpodUnauthenticatedException`|Thrown during an endpoint method call when the user was not authenticated.|
|`ServerpodInsufficientAccessException`|Thrown during an endpoint method call when the authentication key provided did not have sufficient access.|
|`ConnectionClosedException`|Thrown during an endpoint method call if a stream connection was closed with an error. For example, if the user authentication was revoked.|
|`InvalidConfigurationException`|Thrown when an invalid configuration state is found.|

## Test helpers

### `flushEventQueue`

Test helper to flush the event queue.
Useful for waiting for async events to complete before continuing the test.

```dart
Future<void> flushEventQueue();
```

For example, if depending on a generator function to execute up to its `yield`, then the
event queue can be flushed to ensure the generator has executed up to that point:

```dart
var stream = endpoints.someEndoint.generatorFunction(session);
await flushEventQueue();
```

See also [this complete example](advanced-examples#multiple-users-with-stream).
