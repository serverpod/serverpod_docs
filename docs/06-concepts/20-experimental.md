# Experimental features

:::warning
Experimental features should not be used in production environments, as their stability is uncertain and they may receive breaking changes in upcoming releases.
:::

"Experimental Features" are cutting-edge additions to Serverpod that are currently under development or testing. These features allow developers to explore new functionalities and provide feedback, helping shape the future of Serverpod. However, they may not be fully stable or complete and are subject to change.

By default, experimental features are disabled. To opt into using them, include the `--experimental-features` flag when running the serverpod command:

```bash
$ serverpod generate --experimental-features=all
```

The current options you can pass are:

|**Feature**|Description|
|:-----|:---|
| **all** | Enables all available experimental features. |
| **inheritance** | Allows using the `extends` keyword in your model files to create class hierarchies.|

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

It is easy to implement handlers and to implement custom filters in them.
Any number of handlers can be added.
They are run asynchronously and should not affect the behavior or response times of the server.

These event handlers are for diagnostics only,
they do not allow any behavior-changing action such as suppressing exceptions or converting them to another type.

### Experimental

This is introduced as an experimental feature. The API should currently be regarded as unstable which means there may be breaking changes to it between minor versions of the Serverpod package. To make this clear, the important parameters and methods in the Serverpod class have their names prefixed with `unstable`.

It is opt-in by providing event handlers to the Serverpod constructor,
and by invoking the new method `unstableSubmitDiagnosticEvent`.

When this feature and its interface has matured, proper names without `unstable` will be introduced. If possible, the `unstable` names will remain for some time as `@deprecated`, and then removed.

### Setup

The Serverpod constructor now accepts `unstableDiagnosticEventHandlers` among its `experimentalFeatures` specification,
which is an optional array of diagnostic event handlers.

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

The API for submitting diagnostic events from user code, e.g. from endpoint methods, web calls and future calls,
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

This feature also includes support via the Serverpod test framework. This means that the withServerpod construct can be used together with diagnostic event handlers to test that the events are submitted and propagated as intended.

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
