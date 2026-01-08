# Setup

To create future calls, extend the `FutureCall` class and define the methods you wish to invoke at a later time.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall {
  Future<void> doWork(Session session, String data) async {
    // Do something interesting in the future here.
  }
}
```

:::info
For a method to be recognized by Serverpod as a future call, it must return a `Future<void>` and take at least two parameters. The first parameter must be a [`Session`](../sessions) object. You can pass any serializable types as other parameters, and even use `List`, `Map`, `Set` or Dart records as long as they are typed.
:::

Next, you need to generate the code for your future calls. You do this by running `serverpod generate` in the server directory of your project:

```bash
$ cd your_server
$ serverpod generate
```

`serverpod generate` will create a type-safe interface for invoking the future calls in the server's `generated/future_calls.dart` file. This interface can be accessed from the Serverpod object.

The future calls you create are registered by `Serverpod` after the server starts.

```dart
void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  ...

  await pod.start();

  ...
}
```

You are now able to register a future call to be invoked in the future by calling either `callWithDelay` or `callAtTime` depending on your needs.

Invoke the future call 1 hour from now by calling `callWithDelay`.

```dart
await pod.futureCalls
    .callWithDelay(const Duration(hours: 1))
    .example
    .doWork('1');
```

Invoke the future call at a specific time and/or date in the future by calling `callAtTime`.

```dart
await pod.futureCalls
    .callAtTime(DateTime(2026, 1, 1))
    .example
    .doWork('2');
```

When registering a future call, it is also possible to give it an `identifier` so that it can be referenced later. The same identifier can be applied to multiple future calls.

```dart
await pod.futureCalls
    .callWithDelay(
      const Duration(hours: 1),
      identifier: 'an-identifying-string',
    )
    .example
    .doWork('1');
```

This identifier can then be used to cancel all future calls registered with said identifier.

```dart
await pod.futureCalls.cancel('an-identifying-string');
```
