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

Alternatively you can disable single methods like in the example below, where `hello` is exposed to the client, but `goodbye` is not:

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

## Endpoint inheritance

It is possible to extend existing endpoints, from your own app or other modules, by subclassing them. In case the parent endpoint was marked as `abstract` or `@ignoreEndpoint`, no client code is generated for it, but a client will be generated for your subclass – as long as it does not opt-out by any of the aforementioned ways.

```dart
import 'package:serverpod/serverpod.dart';

abstract class GreeterBase extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }

  Future<String> goodbye(Session session, String name) async {
    return 'Bye $name';
  }

  @ignoreEndpoint
  Future<String> wave(Session session) async {
    return '👋';
  }

  Future<String> wavePerson(Session session, String name) async {
    return '👋 Hey $name';
  }
}

class ExcitedGreeter extends GreeterBase {
  @override
  Future<String> hello(Session session, String name) async {
    return '${super.hello(session, name)}!!!';
  }

  // to expose `wave` on the sub-class, override it like this to drop the `@ignoreEndpoint` annotation
  // @override
  // Future<String> wave(Session session) async {
  //   return super.wave(session);
  // }

  @override
  @ignoreEndpoint
  Future<String> wavePerson(Session session, String name) async {
    throw UnimplementedError();
  }
}
```

In the above example `ExcitedGreeter` inherits from `GreeterBase`. Since the base class is marked as `abstract` no client was generated for it, but now all of its visible endpoint methods would be exposed through the sub-class `ExcitedGreeter`.

The sub-class applies the following modifications though:

- `hello` is overriden and augments the super class' implementation with a trailing `!!!`
- `goodbye` is now exposed through the sub-class, as it was not individually hidden and the sub-class does not further augment it
- `wave`, which is explictly ignored in the base-class is still not exposed, as the sub-class did not opt into re-exposing it
- `wavePerson` was explicitly overriden to be ignored. Don't worry about the `throw` in the method implementation, which is only needed to satisfy the compiler. In practice this method can not be called from the client anymore.

### API versioning for breaking changes

Endpoint sub-class can be useful when having to do a breaking change on an endpoint, but you want to keep sharing most of it's implementation with the old endpoint.

Imagine you had a "team" management endpoint where before a user could join if they had an e-mail address ending in the expected domain, but now it should be opened up for anyone to join if they can provide an "invite code".

```dart
@Deprecated('Use TeamV2Endpoint instead')
class TeamEndpoint extends Endpoint {
  Future<TeamInfo> join(Session session) async { … }
  
  // many more methods, like `leave` etc.
}

class TeamV2Endpoint extends TeamEndpoint {
  @override
  @ignoreEndpoint
  Future<TeamInfo> join(Session session) async {
    throw UnimplementedError();
  }

  Future<TeamInfo> joinWithCode(Session session, String invitationCode) async {
    …
  }
}
```

In the above example we created a new `TeamV2` endpoint which hides the `join` method and instead exposes a `joinWithCode` method, plus all the other inherited (and untouched) methods from the parent class.

While we may have liked to re-use the `join` method name, Dart inheritance rules do not allow doing so.

Then in your client you could move all usages from `client.team` to `client.teamV2`, and could eventually remove the old endpoint. Either by marking it with `@ignoreEndpoint` on the class or deleting it and moving the untouched method implementations you want to keep to the V2 endpoint class.

An alternative pattern to consider would be to move all the business logic for an endpoint into a helper class, and then call into that from the endpoint. In case you want to create a V2 version later, you might be able to reuse most of the underlying business logic through that helper class, and don't have to sub-class the old endpoint. This has the added benefit of the endpoint class clearly listing all exposed methods, and you don't have to wonder what you inherit from the base class.

Either approach has its pros and cons, and it depends on the concrete circumstances to pick the one that is most useful. Both give you all the tools you need to extend and update your API while gracefully moving clients along, giving them time to update.
