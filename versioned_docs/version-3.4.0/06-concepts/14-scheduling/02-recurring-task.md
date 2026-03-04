# Recurring Task

The recommended way to achieve cron-like scheduling is by scheduling a future call inside another.
To set this up, extend the `FutureCall` class and define two methods.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall {
  Future<void> doWork(Session session, int input) async {
    await _doWork(session, input);
  }

  Future<void> _doWork(Session session, int input) async {
    session.log('Working with input $input');
  }
}
```

Next, generate the code for your future call:

```bash
$ serverpod generate
```

:::info
Code is only generated for the public method while the private method contains the logic to be invoked as a recurring task.
:::

Next, import the generated `endpoints.dart` file and schedule the recurring future call using the generated code:

```dart
import 'package:serverpod/serverpod.dart';
import 'generated/endpoints.dart';

class ExampleFutureCall extends FutureCall {
  Future<void> doWork(Session session, int input) async {
    await session.serverpod.futureCalls
        .callWithDelay(const Duration(minutes: 20))
        .example
        .doWork(input + 1);

    await _doWork(session, input);
  }

  Future<void> _doWork(Session session, int input) async {
    session.log('Working with input $input');
  }
}
```

Now when you schedule the `doWork` future call, it will continously invoke `_doWork` at an interval of 20 minutes.

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
  await pod.futureCalls.callWithDelay(Duration(minutes: 20)).example.doWork(2);
}
```
