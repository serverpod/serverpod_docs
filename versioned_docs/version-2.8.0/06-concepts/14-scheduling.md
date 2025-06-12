# Scheduling

With Serverpod you can schedule future work with the `future call` feature. Future calls are calls that will be invoked at a later time. An example is if you want to send a drip-email campaign after a user signs up. You can schedule a future call for a day, a week, or a month. The calls are stored in the database, so they will persist even if the server is restarted.

A future call is guaranteed to only execute once across all your instances that are running, but execution failures are not handled automatically. It is your responsibility to schedule a new future call if the work was not able to complete.

## Future calls

Creating a future call is simple, extend the `FutureCall` class and override the `invoke` method. The method takes two params the first being the [`Session`](sessions) object and the second being an optional SerializableModel ([See models](models)).

:::info
The future call feature is not enabled when running Serverpod in serverless mode.
:::

```dart
import 'package:serverpod/serverpod.dart';

class ExampleFutureCall extends FutureCall<MyModelEntity> {
  @override
  Future<void> invoke(Session session, MyModelEntity? object) async {
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
`data` is an object created from a class defined in one of your yaml files and has to be the same as the one you expect to receive in the future call. in the `model` folder, `data` may also be null if you don't need it.
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

## Configuration

Future calls can be configured using options defined in the configuration files or environment variables. For a detailed list of configuration options, refer to the [Configuration](07-configuration.md) page.

Below is an example of how you can configure future calls in a YAML file:

```yaml
futureCallExecutionEnabled: true

futureCall:
  concurrencyLimit: 5
  scanInterval: 2000
```

### Enable or disable future call execution

This option allows you to enable or disable the execution of future calls. By default, it is set to `true`. You might want to disable future call execution in environments where you don't want background tasks to run, such as during testing or in a staging environment where you want to focus on API behavior without triggering scheduled tasks.

Example configuration:

```yaml
futureCallExecutionEnabled: false
```

### Concurrency limit

This option sets the maximum number of future calls that can run concurrently. By default, it is set to `1`. Configuring this is useful if you have resource-intensive tasks and want to avoid overloading your server. For example, in a production environment, you might want to tune this value to ensure that not all of the server's resources are allocated to future calls, leaving room for other critical tasks.

Setting this value to a negative number or `null` removes the limitation, allowing an unlimited number of concurrent future calls. However, this should be used with caution as it can lead to resource exhaustion.

Example configuration:

```yaml
futureCall:
  concurrencyLimit: 5  # Adjust this value based on your server's capacity
```

### Scan interval

This option determines how often the system scans for future calls to execute, in milliseconds. The default value is `5000` (5 seconds). Adjusting this interval can help balance responsiveness and resource usage. For example, reducing the interval can make future calls execute closer to their scheduled time, while increasing it can reduce database load in environments with limited resources.

Example configuration:

```yaml
futureCall:
  scanInterval: 2000  # Adjust this value based on your server's responsiveness needs
```
