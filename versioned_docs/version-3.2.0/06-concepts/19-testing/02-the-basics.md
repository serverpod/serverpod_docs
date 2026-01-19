# The basics

## Set up a test scenario

The `withServerpod` helper provides a `sessionBuilder` that helps with setting up different scenarios for tests. To modify the session builder's properties, call its `copyWith` method. It takes the following named parameters:

|Property|Description|Default|
|:---|:---|:---:|
|`authentication`|See section [Setting authenticated state](#setting-authenticated-state).|`AuthenticationOverride.unauthenticated()`|
|`enableLogging`|Whether logging is turned on for the session.|`false`|

The `copyWith` method creates a new unique session builder with the provided properties. This can then be used in endpoint calls (see section [Setting authenticated state](#setting-authenticated-state) for an example).

To build out a `Session` (to use for [database calls](#seeding-the-database) or [pass on to functions](advanced-examples#test-business-logic-that-depends-on-session)), simply call the `build` method:

```dart
Session session = sessionBuilder.build();
```

Given the properties set on the session builder through the `copyWith` method, this returns a Serverpod `Session` that has the corresponding state.

### Setting authenticated state

To control the authenticated state of the session, the `AuthenticationOverride` class can be used.

To create an unauthenticated override (this is the default value for new sessions), call `AuthenticationOverride unauthenticated()`:

```dart
static AuthenticationOverride unauthenticated();
```

To create an authenticated override, call `AuthenticationOverride.authenticationInfo(...)`:

```dart
static AuthenticationOverride authenticationInfo(
  String userIdentifier,
  Set<Scope> scopes, {
  String? authId,
})
```

Pass these to `sessionBuilder.copyWith` to simulate different scenarios. Below follows an example for each case:

```dart
withServerpod('Given AuthenticatedExample endpoint', (sessionBuilder, endpoints) {
  // Corresponds to an actual user id
  final userId = '550e8400-e29b-41d4-a716-446655440000';

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

To seed the database before tests, `build` a `session` and pass it to the database call just as in production code.

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

|Property|Description|Default|
|:-----|:-----|:---:|
|`applyMigrations`|Whether pending migrations should be applied when starting Serverpod.|`true`|
|`enableSessionLogging`|Whether session logging should be enabled.|`false`|
|`rollbackDatabase`|Options for when to rollback the database during the test lifecycle (or disable it). See detailed description [here](#rollback-database-configuration).|`RollbackDatabase.afterEach`|
|`runMode`|The run mode that Serverpod should be running in.|`ServerpodRunmode.test`|
|`serverpodLoggingMode`|The logging mode used when creating Serverpod.|`ServerpodLoggingMode.normal`|
|`serverpodStartTimeout`|The timeout to use when starting Serverpod, which connects to the database among other things. Defaults to `Duration(seconds: 30)`.|`Duration(seconds: 30)`|
|`testGroupTagsOverride`|By default Serverpod test tools tags the `withServerpod` test group with `"integration"`. This is to provide a simple way to only run unit or integration tests. This property allows this tag to be overridden to something else. Defaults to `['integration']`.|`['integration']`|

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

There are a few reasons to change the default setting:

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
dart test -t integration --concurrency=1
```

For the other cases this is not an issue, as each `withServerpod` has its own transaction and will therefore be isolated.

<!-- markdownlint-disable MD029 -->
3. **Database exceptions that are quelled**: There is a specific edge case where the test tools behavior deviates from production behavior. See example below:

```dart
var transactionFuture = session.db.transaction((tx) async {
    var data = UniqueData(number: 1, email: 'test@test.com');
    try {
        await UniqueData.db.insertRow(session, data, transaction: tx);
        await UniqueData.db.insertRow(session, data, transaction: tx);
    } on DatabaseException catch (_) {
        // Ignore the database exception
    }
});

// ATTENTION: This will throw an exception in production
// but not in the test tools.
await transactionFuture;
```

In production, the transaction call will throw if any database exception happened during its execution, _even_ if the exception was first caught inside the transaction. However, in the test tools this will not throw an exception due to how the nested transactions are emulated. Quelling exceptions like this is not best practise, but if the code under test does this setting `rollbackDatabase` to `RollbackDatabse.disabled` will ensure the code behaves like in production.
<!-- markdownlint-enable MD029 -->

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

See also [this complete example](advanced-examples#multiple-users-interacting-with-a-shared-stream).
