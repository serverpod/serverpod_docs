---
description: The legacy string-based API for registering and scheduling future calls, prefer the type-safe API for new code.
---

# Legacy

:::warning
This approach is error prone since it involves manually registering and scheduling future calls using string identifiers. The recommended way to interact with the future calls feature is through the [type-safe API](setup).
:::

To create a future call, extend the `FutureCall` class and override the `invoke` method. The method takes two params: the first is a [`Session`](../sessions) object and the second is an optional serializable model ([See models](../models)).

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall<MyModelEntity> {
  @override
  Future<void> invoke(Session session, MyModelEntity? object) async {
    // Do something interesting in the future here.
  }
}
```

Register the future call in the `run` function in your `server.dart` file by calling `registerFutureCall` with an instance of the class and a globally unique name string. The name is used to invoke the future call later.

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

With the future call registered, you can schedule it using either `futureCallWithDelay` or `futureCallAtTime` depending on your needs.

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
  DateTime(2030, 1, 1),
);
```

:::note
`data` is an object created from a class defined in one of your yaml model files and must match the type expected by the future call. `data` may also be `null` if you don't need it.
:::

When registering a future call, it is also possible to give it an `identifier` so that it can be referenced later. The same identifier can be applied to multiple future calls.

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
