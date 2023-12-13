# Scheduling

With Serverpod you can schedule future work with the `future call` feature. Future calls are calls that will be invoked at a later time. An example is if you want to send a drip-email campaign after a user signs up. You can schedule a future call for a day, a week, or a month. The calls are stored in the database, so they will persist even if the server is restarted.

A future call is guaranteed to only execute once across all your instances that are running, but execution failures are not handled automatically. It is your responsibility to schedule a new future call if the work was not able to complete.

Creating a future call is simple, extend the `FutureCall` class and override the `invoke` method. The method takes two params the first being the [`Session`](sessions) object and the second being an optional SerializableEntity ([See protocol](protocol)).

:::info
The future call feature is not enabled when running Serverpod in serverless mode.
:::

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall<MyProtocolEntity> {
  @override
  Future<void> invoke(Session session, MyProtocolEntity? object) async {
    // Do something interesting in the future here.
  }
}
```

To let your Server get access to the future call you have to register it in the main run method in your `server.dart` file. You register the future call by calling `registerFutureCall` on the Serverpod object and giving it an instance of the future call together with a string that gives the future call a name. The name has to be globally unique and is used to later invoke the future call.

```dart
void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  ...

  pod.registerFutureCall(ExampleFutureCall(), 'exampleFutureCall');

  ...
}
```

You are now able to register a future call to be invoked in the future by calling either `futureCallWithDelay` or `futureCallAtTime` depending on your needs.

Invoke the future call 1 hour from now by calling `futureCallWithDelay`.

```dart
await session.serverpod.futureCallWithDelay(
  'exampleFutureCall',
  data,
  const Duration(hours: 1),
);
```

Invoke the future call at a specific time and/or date in the future by calling `futureCallAtTime`.

```dart
await session.serverpod.futureCallAtTime(
  'exampleFutureCall',
  data,
  DateTime(2025, 1, 1),
);
```

:::note
`data` is an object created from a class defined in one of your yaml files in the `protocol` folder, `data` may also be null if you don't need it.
:::

When registering a future call it is also possible to give it an `identifier` so that it can be referenced later. The same identifier can be applied to multiple future calls.

```dart
await session.serverpod.futureCallWithDelay(
  'exampleFutureCall',
  data,
  const Duration(hours: 1),
  identifier: 'an-identifying-string',
);
```

This identifier can then be used to cancel all future calls registered with said identifier.

```dart
await session.serverpod.cancelFutureCall('an-identifying-string');
```
