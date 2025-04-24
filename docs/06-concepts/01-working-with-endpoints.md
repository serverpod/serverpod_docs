# Working with endpoints

Endpoints are the connection points to the server from the client. With Serverpod, you add methods to your endpoint, and your client code will be generated to make the method call. For the code to be generated, you need to place the endpoint file anywhere under the `lib` directory of your server. Your endpoint should extend the `Endpoint` class. For methods to be generated, they need to return a typed `Future`, and its first argument should be a `Session` object. The `Session` object holds information about the call being made and provides access to the database.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The above code will create an endpoint called `example` (the Endpoint suffix will be removed) with the single `hello` method. To generate the client-side code run `serverpod generate` in the home directory of the server.

On the client side, you can now call the method by calling:

```dart
var result = await client.example.hello('World');
```

The client is initialized like this:

```dart
// Sets up a singleton client object that can be used to talk to the server from
// anywhere in our app. The client is generated from your server code.
// The client is set up to connect to a Serverpod running on a local server on
// the default port. You will need to modify this to connect to staging or
// production servers.
var client = Client('http://$localhost:8080/')
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

If you run the app in an Android emulator, the `localhost` parameter points to `10.0.2.2`, rather than `127.0.0.1` as this is the IP address of the host machine. To access the server from a different device on the same network (such as a physical phone) replace `localhost` with the local ip address. You can find the local ip by running `ifconfig` (Linux/MacOS) or `ipconfig` (Windows).

Make sure to also update the `publicHost` in the development config to make sure the server always serves the client with the correct path to assets etc.

```yaml
# your_project_server/config/development.yaml

apiServer:
  port: 8080
  publicHost: localhost # Change this line
  publicPort: 8080
  publicScheme: http
...
```

:::info

You can pass the `--watch` flag to `serverpod generate` to watch for changed files and generate code whenever your source files are updated. This is useful during the development of your server.

:::

## Passing parameters

There are some limitations to how endpoint methods can be implemented. Parameters and return types can be of type `bool`, `int`, `double`, `String`, `UuidValue`, `Duration`, `DateTime`, `ByteData`, `Uri`, `BigInt`, or generated serializable objects (see next section). A typed `Future` should always be returned. Null safety is supported. When passing a `DateTime` it is always converted to UTC.

You can also pass `List`, `Map`, `Record` and `Set` as parameters, but they need to be strictly typed with one of the types mentioned above.

:::warning

While it's possible to pass binary data through a method call and `ByteData`, it is not the most efficient way to transfer large files. See our [file upload](file-uploads) interface. The size of a call is by default limited to 512 kB. It's possible to change by adding the `maxRequestSize` to your config files. E.g., this will double the request size to 1 MB:

```yaml
maxRequestSize: 1048576
```

:::

## Return types

The return type must be a typed Future. Supported return types are the same as for parameters.

## Ignore endpoint definition

### Ignore an entire `Endpoint` class

If you want the code generator to ignore an endpoint definition, you can annotate either the entire class or individual methods with `@ignoreEndpoint`.  This can be useful if you want to keep the definition in your codebase without generating server or client bindings for it.

```dart
import 'package:serverpod/serverpod.dart';

@ignoreEndpoint
class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The above code will not generate any server or client bindings for the example endpoint.

### Ignore individual `Endpoint` methods

Alternatively, you can disable single methods by annotation them with `@ignoreEndpoint`.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }

  @ignoreEndpoint
  Future<String> goodbye(Session session, String name) async {
    return 'Bye $name';
  }
}
```

In this case the `ExampleEndpoint` will only expose the `hello` method, whereas the `goodbye` method will not be accessible externally.

## Endpoint method inheritance

Endpoints can be based on other endpoints using inheritance, like `class ChildEndpoint extends ParentEndpoint`. If the parent endpoint was marked as `abstract` or `@ignoreEndpoint`, no client code is generated for it, but a client will be generated for your subclass – as long as it does not opt out again.  
Inheritance gives you the possibility to modify the behavior of `Endpoint` classes defined in other Serverpod modules.

Currently, there are the following possibilities to extend another `Endpoint` class:

### Inheriting from an `Endpoint` class

Given an existing `Endpoint` class, it is possible to extend or modify its behavior while retaining the already exposed methods.

```dart
import 'package:serverpod/serverpod.dart';

class CalculatorEndpoint extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}

class MyCalculatorEndpoint extends CalculatorEndpoint {
  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}
```

The generated client code will now be able to access both `CalculatorEndpoint` and `MyCalculatorEndpoint`.
Whereas the `CalculatorEndpoint` only exposes the original `add` method, `MyCalculatorEndpoint` now exposes both the inherited `add` and its own `subtract` methods.

### Inheriting from an `Endpoint` class marked `abstract`

Endpoints marked as `abstract` are not added to the server. But if they are subclassed, their methods will be exposed through the subclass.

```dart
import 'package:serverpod/serverpod.dart';

abstract class CalculatorEndpoint extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}

class MyCalculatorEndpoint extends CalculatorEndpoint {}
```

The generated client code will only be able to access `MyCalculatorEndpoint`, as the abstract `CalculatorEndpoint` is not exposed on the server.
`MyCalculatorEndpoint` exposes the `add` method it inherited from `CalculatorEndpoint`.

#### Extending an `abstract` `Endpoint` class

In the above example the `MyCalculatorEndpoint` only exposed the inherited `add` method. It can be further extended with custom methods like this:

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculatorEndpoint extends CalculatorEndpoint {
  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}
```

In this case it will expose both an `add` and a `subtract` method.

### Inheriting from an `Endpoint` class annotated with `@ignoreEndpoint`

Suppose you had an `Endpoint` class marked with `@ignoreEndpoint` and a subclass that extends it:

```dart
import 'package:serverpod/serverpod.dart';

@ignoreEndpoint
class CalculatorEndpoint extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}

class MyCalculatorEndpoint extends CalculatorEndpoint {}
```

Since `CalculatorEndpoint` is marked as `@ignoreEndpoint` it will not be exposed on the server. Only `MyCalculatorEndpoint` will be accessible from the client, which provides the inherited `add` methods from its parent class.

### Overriding endpoint methods

It is possible to override methods of the super class. This can be useful when you want to modify the behavior of specific methods but preserve the rest.

```dart
import 'package:serverpod/serverpod.dart';

abstract class GreeterBaseEndpoint extends Endpoint {
  Future<String> greet(Session session, String name) async {
    return 'Hello $name';
  }
}

class ExcitedGreeterEndpoint extends GreeterBaseEndpoint {
  @override
  Future<String> greet(Session session, String name) async {
    return '${super.hello(session, name)}!!!';
  }
}
```

Since `GreeterBaseEndpoint` is `abstract`, it will not be exposed on the server. The `ExcitedGreeterEndpoint` will expose a single `greet` method, and its implementation will augment the super class's one by adding `!!!` to that result.

This way, you can modify the behavior of endpoint methods, while still sharing the implementation through calls to `super`. Be aware that the method signature has to be compatible with the base class per Dart's rules, meaning you can add optional parameters, but can not add required parameters or change the return type.

### Hiding endpoint methods with `@ignoreEndpoint`

In case you want to hide methods from an endpoint use `@ignoreEndpoint` in the child class like so:

```dart
import 'package:serverpod/serverpod.dart';

abstract class CalculatorEndpoint extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }

  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}

class AdderEndpoint extends CalculatorEndpoint {
  @ignoreEndpoint
  Future<int> subtract(Session session, int a, int b) async {
    throw UnimplementedError();
  }
}
```

Since `CalculatorEndpoint` is `abstract` it will not be exposed on the server. `AdderEndpoint` inherits all methods from its parent class, but since it opts to hide `subtract` by annotating it with `@ignoreEndpoint` only the `add` method will be exposed.
Don't worry about the exception in the `subtract` implementation. That is only added to satisfy the Dart compiler – in practice nothing will ever call this method on `AdderEndpoint`.

Hiding endpoints from a super class is only appropriate in case the parent `class` is `abstract` or annotated with `@ignoreEndpoint`. Otherwise the method that should be hidden on the child would still be accessible via the parent class.

### Unhiding endpoint methods annotated with `@ignoreEndpoint` in the super class

The reverse of the previous example would be a base endpoint that has a method marked with `@ignoreEndpoint`, which you now want to expose on the subclass.

```dart
import 'package:serverpod/serverpod.dart';

abstract class CalculatorEndpoint extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }

  // Ignored, as this expensive computation should not be exposed by default
  @ignoreEndpoint
  Future<BigInt> addBig(Session session, BigInt a, BigInt b) async {
    return a + b;
  }
}

class MyCalculatorEndpoint extends CalculatorEndpoint {
  @override
  Future<BigInt> addBig(Session session, BigInt a, BigInt b) async {
    return super.addBig(session, a, b);
  }
}
```

Since `CalculatorEndpoint` is `abstract` it will not be exposed on the server. `MyCalculatorEndpoint` will expose both the `add` and `addBig` methods, since `addBig` was overriden and thus lost the `@ignoreEndpoint` annotation.

### Building base endpoints for behavior

Endpoint subclassing is not just useful to inherit (or hide) methods, it can also be used to pre-configure any other property of the `Endpoint` class.

For example, you could define a base class that requires callers to be logged in:

```dart
abstract class LoggedInEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;
}
```

And now every endpoint that extends `LoggedInEndpoint` will check that the user is logged in.

Similarly, you could wrap up a specific set of required scopes in a base endpoint, which you can then easily use for the app's endpoints instead of repeating the scopes in each:

```dart
abstract class AdminEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {Scope.admin};
}
```

Again, just have your custom endpoint extend `AdminEndpoint` and you can be sure that the user has the appropriate permissions.
