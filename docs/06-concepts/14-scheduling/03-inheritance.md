# Inheritance

Inheritance gives you the possibility to modify the behavior of `FutureCall` classes defined in other Serverpod modules. If the parent `FutureCall` class was marked as `abstract`, no code is generated for it.

Currently, there are the following possibilities to extend another `FutureCall` class:

## Inheriting from a `FutureCall` class

Given an existing `FutureCall` class, it is possible to extend or modify its behavior while retaining the already exposed methods.

```dart
import 'package:serverpod/serverpod.dart';

class Greeter extends FutureCall {
  Future<void> hello(Session session, String name) async {
    session.log('Hello $name');
  }
}

class MyGreeter extends Greeter {
  Future<void> bye(Session session, String name) async {
    session.log('Bye $name');
  }
}
```

The generated server code will now be able to access both `Greeter` and `MyGreeter`.
Whereas the `Greeter` only exposes the original `hello` method, `MyGreeter` now exposes both the inherited `hello` and its own `bye` methods.

## Inheriting from a `FutureCall` class marked `abstract`

Future calls marked as `abstract` are not added to the server. But if they are subclassed, their methods will be exposed through the subclass.

```dart
import 'package:serverpod/serverpod.dart';

abstract class Greeter extends FutureCall {
  Future<void> hello(Session session, String name) async {
    session.log('Hello $name');
  }
}

class MyGreeter extends Greeter {}
```

Since `Greeter` is `abstract`, it will not be added to the server. However, `MyGreeter` will expose a single `hello` method.

### Extending an `abstract` `FutureCall` class

In the above example, the `MyGreeter` only exposed the inherited `hello` method. It can be further extended with custom methods like this:

```dart
import 'package:serverpod/serverpod.dart';

class MyGreeter extends Greeter {
  Future<void> bye(Session session, String name) async {
    session.log('Bye $name');
  }
}
```

In this case, it will expose both a `hello` and a `bye` method.

### Overriding future call methods

It is possible to override methods of the superclass. This can be useful when you want to modify the behavior of specific methods but preserve the rest.

```dart
import 'package:serverpod/serverpod.dart';

abstract class Greeter extends FutureCall {
  Future<void> hello(Session session, String name) async {
    session.log('Hello $name');
  }
}

class ExcitedGreeter extends Greeter {
  @override
  Future<void> hello(Session session, String name) async {
    session.log('Hello $name!!!');
  }
}
```

Since `Greeter` is `abstract`, it will not be exposed on the server. The `ExcitedGreeter` will expose a single `hello` method, and its implementation will augment the superclass's one by adding `!!!` to the output.

This way, you can modify the behavior of future call methods while still sharing the implementation through calls to `super`. Be aware that the method signature has to be compatible with the base class per Dart's rules, meaning you can add optional parameters, but can not add required parameters or change the return type.
