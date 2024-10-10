# Advanced examples

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
  const int userId1 = 1;
  const int userId2 = 2;

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
