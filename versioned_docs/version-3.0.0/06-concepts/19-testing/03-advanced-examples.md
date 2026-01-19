# Advanced examples

## Run unit and integration tests separately

To run unit and integration tests separately, the `"integration"` tag can be used as a filter. See the following examples:

```bash
# All tests (unit and integration)
dart test

# Only integration tests: add --tags (-t) flag
dart test -t integration

# Only unit tests: add --exclude-tags (-x) flag
dart test -x integration
```

To change the name of this tag, see the [`testGroupTagsOverride`](the-basics#configuration) configuration option.

## Test business logic that depends on `Session`

It is common to break out business logic into modules and keep it separate from the endpoints. If such a module depends on a `Session` object (e.g to interact with the database), then the `withServerpod` helper can still be used and the second `endpoint` argument can simply be ignored:

```dart
withServerpod('Given decreasing product quantity when quantity is zero', (
  sessionBuilder,
  _,
) {
  var session = sessionBuilder.build();

  setUp(() async {
    await Product.db.insertRow(session, [
      Product(
        id: 123,
        name: 'Apple',
        quantity: 0,
      ),
    ]);
  });

  test('then should throw `InvalidOperationException`',
      () async {
    var future = ProductsBusinessLogic.updateQuantity(
      session,
      id: 123,
      decrease: 1,
    );

    await expectLater(future, throwsA(isA<InvalidOperationException>()));
  });
});
```

## Multiple users interacting with a shared stream

For cases where there are multiple users reading from or writing to a stream, such as real-time communication, it can be helpful to validate this behavior in tests.

Given the following simplified endpoint:

```dart
class CommunicationExampleEndpoint {
  static const sharedStreamName = 'shared-stream';
  Future<void> postNumberToSharedStream(Session session, int number) async {
    await session.messages
        .postMessage(sharedStreamName, SimpleData(num: number));
  }

  Stream<int> listenForNumbersOnSharedStream(Session session) async* {
    var sharedStream =
        session.messages.createStream<SimpleData>(sharedStreamName);

    await for (var message in sharedStream) {
      yield message.num;
    }
  }
}
```

Then a test to verify this behavior can be written as below. Note the call to the `flushEventQueue` helper (exported by the test tools), which ensures that `listenForNumbersOnSharedStream` executes up to its first `yield` statement before continuing with the test. This guarantees that the stream was registered by Serverpod before messages are posted to it.

```dart
withServerpod('Given CommunicationExampleEndpoint', (sessionBuilder, endpoints) {
  final userId1 = '550e8400-e29b-41d4-a716-446655440000';
  final userId2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

  test(
      'when calling postNumberToSharedStream and listenForNumbersOnSharedStream '
      'with different sessions then number should be echoed',
      () async {
    var userSession1 = sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo(
        userId1,
        {},
      ),
    );
    var userSession2 = sessionBuilder.copyWith(
      authentication: AuthenticationOverride.authenticationInfo(
        userId2,
        {},
      ),
    );

    var stream =
        endpoints.testTools.listenForNumbersOnSharedStream(userSession1);
    // Wait for `listenForNumbersOnSharedStream` to execute up to its
    // `yield` statement before continuing
    await flushEventQueue();

    await endpoints.testTools.postNumberToSharedStream(userSession2, 111);
    await endpoints.testTools.postNumberToSharedStream(userSession2, 222);

    await expectLater(stream.take(2), emitsInOrder([111, 222]));
  });
});
```

## Optimising number of database connections

By default, Dart's test runner runs tests concurrently. The number of concurrent tests depends on the running hosts' available CPU cores. If the host has a lot of cores it could trigger a case where the number of connections to the database exceeeds the maximum connections limit set for the database, which will cause tests to fail.

Each `withServerpod` call will lazily create its own Serverpod instance which will connect to the database. Specifically, the code that causes the Serverpod instance to be created is `sessionBuilder.build()`, which happens at the latest in an endpoint call if not called by the test before.

If a test needs a session before the endpoint call (e.g. to seed the database), `sessionBuilder.build()` has to be called which then triggers a database connection attempt.

If the max connection limit is hit, there are two options:

- Raise the max connections limit on the database.
- Build out the session in `setUp`/`setUpAll` instead of the top level scope:

```dart
withServerpod('Given example test', (sessionBuilder, endpoints) {
  // Instead of this
  var session = sessionBuilder.build();


  // Do this to postpone connecting to the database until the test group is running
  late Session session;
  setUpAll(() {
    session = sessionBuilder.build();
  });
  // ...
});
```

:::info

This case should be rare and the above example is not a recommended best practice unless this problem is anticipated, or it has started happening.

:::
