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

Alternatively, you can disable single methods like in the example below, where `hello` is exposed to the client, but `goodbye` is not:

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

## Endpoint method inheritance

Endpoints can be based on other endpoint using inheritance like `class ChildEndpoint extends ParentEndpoint`. If the parent endpoint was marked as `abstract` or `@ignoreEndpoint`, no client code is generated for it, but a client will be generated for your subclass – as long as it does not opt out again.

Currently there are the following possibilities to extend another `Endpoint` class:

### Inheriting from a concrete (visible) endpoint

```dart
import 'package:serverpod/serverpod.dart';

class Calculator extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}
```

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {
  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}
```

The generated code will now contain both a `Calculator` and `MyCalculator` client.  
The `MyCalculator` endpoint will not expose both `add` and `subtract` methods.

To prevent usage of the base `Calculator` endpoint it might be appropriate to hide it.
If the base class was defined in another module like shown above, then this is currently not possible. But if it's part of your own code, you could use the `@ignoreEndpoint` annotation from the previous section, or make it `abstract` as shown below.

### Inheriting from an `abstract` base class

Endpoints marked as `abstract` require that they get sub-classed in order to be exposed on the server.

Suppose you had the following base class:

```dart
import 'package:serverpod/serverpod.dart';

abstract class Calculator extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}
```

So far this would not generate any client or server code.

If you then added a subclass which extends this base class, this subclass would be exposed to clients.

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {}
```

This `MyCalculator` endpoint now exposes the `add` endpoint method from the base class implementation. You could further extend it like this:

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {
  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}
```

Now the `MyCalculator` endpoint exposes the inherited `add` endpoint method as well as `subtract`.

### Inheriting from an `@ignoreEndpoint` base class

Suppose you had a endpoint class marked with `@ignoreEndpoint`, in which case no code would be generated for it.

```dart
import 'package:serverpod/serverpod.dart';

@ignoreEndpoint
class Calculator extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }
}
```

You could then subclass it like this:

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {}
```

Now all of the public endpoint methods of the base class, in this case just `add` would be exposed by the `MyCalculator` client.
Additionally further methods could be added to the `MyCalculator` subclass.

### Overriding endpoint methods

Suppose you had a base `Endpoint` class `Greeter` whose behavior you want to adopt.

```dart
import 'package:serverpod/serverpod.dart';

abstract class GreeterBase extends Endpoint {
  Future<String> greet(Session session, String name) async {
    return 'Hello $name';
  }
}
```

Now suppose you want to change the behavior of `greet`, to make it a little more excited. That could be achieved by subclassing that endpoint.

In this case the base class is marked as `abstract`, but the following behavior would work just the same if it were marked with `@ignoredEndpoint` or just a plain `class`. Only that in the letter case you'd end up with 2 endpoints in the end.

```dart
import 'package:serverpod/serverpod.dart';

class ExcitedGreeter extends GreeterBase {
  @override
  Future<String> greet(Session session, String name) async {
    return '${super.hello(session, name)}!!!';
  }
}
```

The `ExcitedGreeter` endpoint will now contain the single `greet` method, and it's implementation will augment the base class' one by adding `!!!` to that result.

This way you can modify the behavior of endpoint methods, while still sharing the implementation through calls to `super` where it makes sense. Only be aware that the method signature has to be compatible with the base class per Dart's rules, meaning you can add optional parameters, but can not add required parameters or change the return type.

### Hiding endpoint methods with `@ignoreEndpoint`

Suppose you had an endpoint class like this:

```dart
import 'package:serverpod/serverpod.dart';

abstract class Calculator extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }

  Future<int> subtract(Session session, int a, int b) async {
    return a - b;
  }
}
```

You might want to re-use the `add` methodm but do not want a `subtract` method on your endpoint.
To achieve this, subclass the `Calculator`, but hide `subtract` with `@ignoreEndpoint` like so:

```dart
import 'package:serverpod/serverpod.dart';

class Adder extends Calculator {
  @ignoreEndpoint
  Future<int> subtract(Session session, int a, int b) async {
    throw UnimplementedError();
  }
}
```

This `Adder` endpoint will only generate code for the `add` method, whereas `subtract` will not be visible from the client. Thus don't worry about the exception here. That is only added to satisfy the Dart compiler – in practice nothing will ever call this method on `Adder`.

### Unhiding endpoint methods with `@ignoreEndpoint`

The reverse of the previous example would be a base endpoint that has a method marked with `@ignoreEndpoint`, which you now want to expose on the subclass.

```dart
import 'package:serverpod/serverpod.dart';

abstract class Calculator extends Endpoint {
  Future<int> add(Session session, int a, int b) async {
    return a + b;
  }

  // Ignored, as this expensive computation should not be exposed by default
  @ignoreEndpoint
  Future<BigInt> addBig(Session session, BigInt a, BigInt b) async {
    return a + b;
  }
}
```

Since the base class is marked `abstract` no client or server code is generated so far at all.

Now if you just subclass the `Calculator` endpoint like this, the generated client will only expose the simple `add` method.

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {}
```

In order to expose the `addBig` method on your endpoint, override it (thus unhiding it) and defer to the base class' implementation.

```dart
import 'package:serverpod/serverpod.dart';

class MyCalculator extends Calculator {
  @override
  Future<BigInt> addBig(Session session, BigInt a, BigInt b) async {
    return super.addBig(session, a, b);
  }
}
```

Now the `MyCalculator` endpoint will expose both the `add` and `addBig` methods.

### Building base endpoints for behavior

Endpoint subclassing is not just useful to inherit (or hide) methods, it can also be used to pre-configure any other property of the `Endpoint` class.

For example you could define a base class that requires callers to be logged in:

```dart
abstract class LoggedInEndpoint extends Endpoint {
  @override
  bool get requireLogin => true;
}
```

And now every endpoint that extends `LoggedInEndpoint` will check that the user is logged in.

Similarly you could wrap up a specific set of required scopes in a base endpoint, which you can then easily use for the app's endpoints instead of repeating the scopes in each:

```dart
abstract class AdminEndpoint extends Endpoint {
  @override
  Set<Scope> get requiredScopes => {Scope.admin};
}
```

Again, just have your custom endpoint extend `AdminEndpoint` and you can be sure that the user has the appropriate permissions.