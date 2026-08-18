---
description: The older string-based API for registering and scheduling future calls. Prefer the type-safe API for new code.
---

# Legacy

Before the type-safe API, future calls were registered and scheduled using string names. This older API still works, but the scheduling and cancellation methods (`futureCallWithDelay`, `futureCallAtTime`, and `cancelFutureCall`) are deprecated in Serverpod 4.0 and produce compiler warnings. Use the [type-safe API](future-calls) for new code.

:::warning
This approach is error prone because it relies on string names that the compiler cannot check. The [type-safe API](future-calls) is the recommended way to work with future calls.
:::

To create a future call, extend `FutureCall` and override the `invoke` method. The type parameter is the model passed to the call, so `FutureCall<MyModelEntity>` receives a `MyModelEntity`. The first parameter is a [`Session`](../endpoints-and-apis/sessions). The second is that model, or `null` if the call needs no data.

```dart
import 'package:serverpod/serverpod.dart';

class MyFutureCall extends FutureCall<MyModelEntity> {
  @override
  Future<void> invoke(Session session, MyModelEntity? object) async {
    // Do something interesting in the future here.
  }
}
```

Register the call in the `run` function in your `server.dart` file with `registerFutureCall`, passing an instance and a globally unique name. The name is used to schedule the call later. Registration is not deprecated. It remains the way to register a legacy future call.

```dart
void run(List<String> args) async {
  final pod = Serverpod(args);

  pod.registerFutureCall(MyFutureCall(), 'myFutureCall');

  await pod.start();
}
```

With the call registered, schedule it with `futureCallWithDelay` or `futureCallAtTime`. Both take the registered name and a data object, which is an instance of a class from one of your model files and must match the type the call expects. The data may be `null` if the call needs none.

Run the call one hour from now:

```dart
await session.serverpod.futureCallWithDelay(
  'myFutureCall',
  data,
  const Duration(hours: 1),
);
```

Run the call at a specific time:

```dart
await session.serverpod.futureCallAtTime(
  'myFutureCall',
  data,
  DateTime(2030, 1, 1),
);
```

Pass an `identifier` when you schedule a call so you can cancel it later. The same identifier can be applied to several calls.

```dart
await session.serverpod.futureCallWithDelay(
  'myFutureCall',
  data,
  const Duration(hours: 1),
  identifier: 'an-identifying-string',
);
```

Cancel every not-yet-run call scheduled with that identifier:

```dart
await session.serverpod.cancelFutureCall('an-identifying-string');
```

## Related

- [Future calls](future-calls): the type-safe API to use instead.
- [Models](../data-and-the-database/models): defining the data a legacy call receives.
