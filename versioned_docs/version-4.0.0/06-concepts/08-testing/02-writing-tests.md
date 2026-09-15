---
description: The pieces every Serverpod test uses, the session builder, simulated authentication, seeding the database, and the exceptions the test tools throw.
---

# Writing tests

Every test you write with the test tools uses the same few pieces. The `withServerpod` callback hands you two of them:

- **`sessionBuilder`** describes the server state a call runs under, such as who is signed in. You pass it to endpoint calls, and you can build it into a `Session` when you need one directly.
- **`endpoints`** is your generated endpoints, called the same way your app calls them.

```dart
withServerpod('Given Greeting endpoint', (sessionBuilder, endpoints) {
  test('then hello returns a greeting', () async {
    var greeting = await endpoints.greeting.hello(sessionBuilder, 'Bob');
    expect(greeting.message, 'Hello Bob');
  });
});
```

The generated file carries the test helpers and your endpoints. Serverpod's own types, such as `Session` and `Scope`, and your models come from their own packages:

```dart
import 'package:serverpod/serverpod.dart';
import 'package:test/test.dart';
import 'package:my_project_server/src/generated/protocol.dart';

import 'test_tools/serverpod_test_tools.dart';
```

## Set up a scenario

Call `copyWith` on the session builder to change the state a call runs under. It returns a new builder, leaving the original untouched, so each scenario in a test file can have its own.

| Property | What it does | If you omit it |
| --- | --- | --- |
| `authentication` | Who is signed in for calls made with this builder. | Inherits from the builder you called `copyWith` on. |
| `enableLogging` | Whether the session writes log entries. | Inherits from the builder you called `copyWith` on. |

A fresh builder from `withServerpod` starts out unauthenticated, and logs only if you passed [`enableSessionLogging`](configuration#options).

When you need a `Session` rather than a builder, for a database call or to pass into [your own business logic](advanced-examples#test-business-logic-that-depends-on-session), build one:

```dart
Session session = sessionBuilder.build();
```

## Simulate authentication

The `AuthenticationOverride` class sets who the call runs as. It offers two:

```dart
static AuthenticationOverride unauthenticated();

static AuthenticationOverride authenticationInfo(
  String userIdentifier,
  Set<Scope> scopes, {
  String? authId,
});
```

The `userIdentifier` is the signed-in user's id, which is a UUID string when you use Serverpod's auth module. Scopes are the permissions the call should carry. See [Authentication](../authentication/basics) for both.

Pass an override through `copyWith` to test each case:

```dart
withServerpod('Given AuthenticatedExample endpoint', (sessionBuilder, endpoints) {
  final userId = '550e8400-e29b-41d4-a716-446655440000';

  group('when authenticated', () {
    var authenticated = sessionBuilder.copyWith(
      authentication:
          AuthenticationOverride.authenticationInfo(userId, {Scope('user')}),
    );

    test('then calling `hello` returns a greeting', () async {
      final greeting =
          await endpoints.authenticatedExample.hello(authenticated, 'Michael');
      expect(greeting, 'Hello, Michael!');
    });
  });

  group('when unauthenticated', () {
    var unauthenticated = sessionBuilder.copyWith(
      authentication: AuthenticationOverride.unauthenticated(),
    );

    test('then calling `hello` throws', () async {
      final future =
          endpoints.authenticatedExample.hello(unauthenticated, 'Michael');
      await expectLater(
          future, throwsA(isA<ServerpodUnauthenticatedException>()));
    });
  });
});
```

## Seed the database

Build a session and use it for database calls exactly as your server code would:

```dart
withServerpod('Given Products endpoint', (sessionBuilder, endpoints) {
  var session = sessionBuilder.build();

  setUp(() async {
    await Product.db.insert(session, [
      Product(name: 'Apple', price: 10),
      Product(name: 'Banana', price: 10),
    ]);
  });

  test('then calling `all` returns all products', () async {
    final products = await endpoints.products.all(sessionBuilder);
    expect(products, hasLength(2));
    expect(products.map((p) => p.name), containsAll(['Apple', 'Banana']));
  });
});
```

Everything a test writes to the database is rolled back when the test ends, so each test starts from the same state and you do not have to clean up after yourself. You can change when that happens, or turn it off, with [`rollbackDatabase`](configuration#rollbackdatabase).

## Exceptions the test tools throw

The generated file exports these, so you can name them in a test without importing anything else.

| Exception | Thrown when |
| --- | --- |
| `ServerpodUnauthenticatedException` | An endpoint call was made without authentication and the endpoint requires it. |
| `ServerpodInsufficientAccessException` | The authentication used did not carry the scopes the endpoint requires. |
| `ConnectionClosedException` | A stream connection closed with an error, for example because authentication was revoked. |
| `InvalidConfigurationException` | The endpoint ran database calls or transactions in parallel, which the automatic rollback cannot wrap. See [`rollbackDatabase`](configuration#rollbackdatabase). |

The test server also throws when it fails to start or takes longer than the start timeout. That error type is not exported, so you cannot catch it by name, but the message says which of the two happened.

## Wait for async work

The `flushEventQueue` helper lets already-queued async work run before the test carries on. Reach for it when a call has to get as far as its first `yield` before you assert on it:

```dart
var stream = endpoints.someEndpoint.generatorFunction(sessionBuilder);
await flushEventQueue();
```

For a complete case, see [multiple users interacting with a shared stream](advanced-examples#multiple-users-interacting-with-a-shared-stream).

## Related

- [Configuration](configuration): every option `withServerpod` accepts.
- [Advanced examples](advanced-examples): streams, future calls, and business logic.
- [Sessions](../endpoints-and-apis/sessions): what a session carries in production.
