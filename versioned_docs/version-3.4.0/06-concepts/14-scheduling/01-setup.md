# Setup

Serverpod supports scheduling future work with the `future call` feature. Future calls are calls that will be invoked at a later time. An example is if you want to send a drip-email campaign after a user signs up. You can schedule a future call for a day, a week, a month, or a [recurring interval](recurring-task). The calls are stored in the database, so they will persist even if the server is restarted.

A future call is guaranteed to only execute once across all your instances that are running, but execution failures are not handled automatically. It is your responsibility to schedule a new future call if the work was not able to complete.

To create future calls, extend the `FutureCall` class and define the methods you wish to invoke at a later time.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall {
  Future<void> doWork(Session session) async {
    // Do something interesting in the future here.
  }

  Future<void> doOtherWork(Session session, String data) async {
    // Do something interesting in the future here.
  }
}
```

:::info
For a method to be recognized by Serverpod as a future call, it must return a `Future<void>` and have at least one positional parameter which must be a [`Session`](../sessions) object. You can pass any serializable types as other parameters, and even use `List`, `Map`, `Set` or Dart records as long as they are typed. `Streaming` parameters are not supported.
:::

:::warning
It is not valid to override the `invoke` method of the `FutureCall` class. This method is reserved for the execution of the future call.
:::

Next, you need to generate the code for your future calls:

```bash
$ serverpod generate
```

Calling `serverpod generate` will create a type-safe interface for invoking the future calls in the server's `generated/future_calls.dart` file. This interface can be accessed from the Serverpod object.

The future calls you create are registered by `Serverpod` after the server starts.

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_auth_idp_server/core.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  await pod.start();
}
```

You are now able to schedule future calls to be invoked in the future by calling either `callWithDelay` or `callAtTime` depending on your needs.

:::note
The `futureCalls` getter is only available if at least one future call has been defined.
:::

:::warning
Scheduling a future call before the server starts will lead to exceptions.
:::

Invoke a future call 1 hour from now by calling `callWithDelay`.

```dart
await pod.futureCalls
    .callWithDelay(const Duration(hours: 1))
    .example
    .doWork();
```

Invoke a future call at a specific time and/or date in the future by calling `callAtTime`.

```dart
await pod.futureCalls
    .callAtTime(DateTime(2026, 1, 1))
    .example
    .doOtherWork('1');
```

:::info
Scheduling a future call at a specific time/date will always resolve the `DateTime` to UTC.
:::

When scheduling a future call, it is also possible to give it an `identifier` so that it can be referenced later. The same identifier can be applied to multiple future calls.

```dart
await pod.futureCalls
    .callWithDelay(
      const Duration(hours: 1),
      identifier: 'an-identifying-string',
    )
    .example
    .doWork();
```

This identifier can then be used to cancel all future calls scheduled with said identifier.

```dart
await pod.futureCalls.cancel('an-identifying-string');
```

:::info
The future call feature is not enabled when running Serverpod in serverless mode.
:::
