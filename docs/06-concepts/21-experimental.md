# Experimental features

:::warning
Be cautious when using experimental features in production environments, as their stability is uncertain and they may receive breaking changes in upcoming releases.
:::

"Experimental Features" are cutting-edge additions to Serverpod that are currently under development or testing or whose API is not yet stable.
These features allow developers to explore new functionalities and provide feedback, helping shape the future of Serverpod.
However, they may not be fully stable or complete and are subject to change.

Experimental features are disabled by default, i.e. they are not active unless the developer opts-in.

:::note
To make the LSP server understand the usage of experimental flags and avoid complaints about unknown syntax on model files, configure experimental features in the `config/generator.yaml` file. See the [configuration documentation](configuration#experimental-features) for more details.
:::

## Experimental internal APIs

Experimental internal APIs are placed under the `experimental` sub-API of the `Serverpod` class.
When an experimental feature matures it is moved from `experimental` to `Serverpod` proper.
If possible, the experimental API will remain for some time as `@deprecated`, and then removed.

## Command-line enabled features

Some of the experimental features are enabled by including the `--experimental-features` flag when running the serverpod command:

```bash
$ serverpod generate --experimental-features=all
```

The current options you can pass are:

| **Feature**     | Description                                                                         |
| :-------------- | :---------------------------------------------------------------------------------- |
| **all**         | Enables all available experimental features.                                        |
| **inheritance** | Allows using the `extends` keyword in your model files to create class hierarchies. |

## Inheritance

:::warning
Adding a new subtype to a class hierarchy may introduce breaking changes for older clients. Ensure client compatibility when expanding class hierarchies to avoid deserialization issues.
:::

Inheritance allows you to define class hierarchies in your model files by sharing fields between parent and child classes, simplifying class structures and promoting consistency by avoiding duplicate field definitions.

### Extending a Class

To inherit from a class, use the `extends` keyword in your model files, as shown below:

```yaml
class: ParentClass
fields:
    name: String
```

```yaml
class: ChildClass
extends: ParentClass
fields:
    int: age
```

This will generate a class with both `name` and `age` field.

```dart
class ChildClass extends ParentClass {
    String name
    int age
}
```

### Sealed Classes

In addition to the `extends` keyword, you can also use the `sealed` keyword to create sealed class hierarchies, enabling exhaustive type checking. With sealed classes, the compiler knows all subclasses, ensuring that every possible case is handled when working with the model.

```yaml
class: ParentClass
sealed: true
fields:
    name: String
```

```yaml
class: ChildClass
extends: ParentClass
fields:
    age: int
```

This will generate the following classes:

```dart
sealed class ParentClass {
    String name;
}

class ChildClass extends ParentClass {
    String name;
    int age;
}
```

:::info
All files in a sealed hierarchy need to be located in the same directory.
:::

## Exception monitoring

Serverpod allows you to monitor exceptions in a central and flexible way by using the new diagnostic event handlers.
These work both for exceptions thrown in application code and from the framework (e.g. server startup or shutdown errors).

This can be used to get all exceptions reported in realtime to services for monitoring and diagnostics,
such as [Sentry](https://sentry.io/), [Highlight](https://www.highlight.io/), and [Datadog](https://www.datadoghq.com/).

It is easy to implement handlers and define custom filters within them.
Any number of handlers can be added.
They are run asynchronously and should not affect the behavior or response times of the server.

These event handlers are for diagnostics only,
they do not allow any behavior-changing action such as suppressing exceptions or converting them to another exception type.

### Setup

This feature is enabled by providing one ore more `DiagnosticEventHandler` implementations
to the Serverpod constructor's `experimentalFeatures` specification.

Example:

```dart
  var serverpod = Serverpod(
    ...
    experimentalFeatures: ExperimentalFeatures(
      diagnosticEventHandlers: [
        AsEventHandler((event, {required space, required context}) {
          print('$event  Origin is $space\n  Context is ${context.toJson()}');
        }),
      ],
    ),
  );
```

### Submitting diagnostic events

The API for submitting diagnostic events from user code, e.g. from endpoint methods, web calls, and future calls,
is the new method `submitDiagnosticEvent` under the `experimental` member of the Serverpod class.

```dart
  void submitDiagnosticEvent(
    DiagnosticEvent event, {
    required Session session,
  })
```

Usage example:

```dart
class DiagnosticEventTestEndpoint extends Endpoint {
  Future<String> submitExceptionEvent(Session session) async {
    try {
      throw Exception('An exception is thrown');
    } catch (e, stackTrace) {
      session.serverpod.experimental.submitDiagnosticEvent(
        ExceptionEvent(e, stackTrace),
        session: session,
      );
    }
    return 'success';
  }
}
```

### Guidelines for handlers

A `DiagnosticEvent` represents an event that occurs in the server.
`DiagnosticEventHandler` implementations can react to these events
in order to gain insights into the behavior of the server.

As the name suggests the handlers should perform diagnostics only,
and not have any responsibilities that the regular functioning
of the server depends on.

The registered handlers are typically run concurrently,
can not depend on each other, and asynchronously -
they are not awaited by the operation they are triggered from.

If a handler throws an exception it will be logged to stderr
and otherwise ignored.

### Test support

This feature also includes support via the Serverpod test framework.
This means that the `withServerpod` construct can be used together with diagnostic event handlers to test that the events are submitted and propagated as intended.

Example:

```dart
void main() {
  var exceptionHandler = TestExceptionHandler();

  withServerpod('Given withServerpod with a diagnostic event handler',
      experimentalFeatures: ExperimentalFeatures(
        diagnosticEventHandlers: [exceptionHandler],
      ), (sessionBuilder, endpoints) {
    test(
        'when calling an endpoint method that submits an exception event '
        'then the diagnostic event handler gets called', () async {
      final result = await endpoints.diagnosticEventTest
          .submitExceptionEvent(sessionBuilder);
      expect(result, 'success');

      final record = await exceptionHandler.events.first.timeout(Duration(seconds: 1));
      expect(record.event.exception, isA<Exception>());
      expect(record.space, equals(OriginSpace.application));
      expect(record.context, isA<DiagnosticEventContext>());
      expect(
          record.context.toJson(),
          allOf([
            containsPair('serverId', 'default'),
            containsPair('serverRunMode', 'test'),
            containsPair('serverName', 'Server default'),
          ]));
    });
  });
}
```

## Shutdown Tasks

Serverpod provides support for registering **shutdown tasks**—asynchronous operations that are executed when the server is shutting down. This is useful for performing cleanup operations such as saving application state or releasing external resources.

Shutdown tasks are executed *after* the server has stopped accepting new requests, but *before* the Redis and database connections are closed.

All registered shutdown tasks are executed concurrently, and the server waits for all tasks to complete before fully shutting down. If any task fails, the error is logged, but it does not prevent the server from shutting down.

### Managing Shutdown Tasks

To manage shutdown tasks, use the `experimental.shutdownTasks` API on your `Serverpod` instance. This API offers methods for adding and removing tasks.

#### Add Shutdown Task

Each shutdown task is identified by a unique `Object` identifier and executes a function that returns a `Future<void>`.

To add a task, use the `addTask` method:

```dart
var serverpod = Serverpod(
  ...
);
serverpod.experimental.shutdownTasks.addTask(
  #taskIdentifier,
  () async {
    // Your shutdown logic here
  },
);

```

In the example above, a task is added with the identifier `taskIdentifier`. This identifier is used for logging any errors that occur during task execution.

#### Remove Shutdown task

To remove a shutdown task, use the `removeTask` method:

```dart
serverpod.experimental.shutdownTasks.removeTask(#taskIdentifier);
```

This will remove the previously registered task associated with `taskIdentifier`.
