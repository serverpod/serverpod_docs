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

There are some limitations to how endpoint methods can be implemented. Parameters and return types can be of type `bool`, `int`, `double`, `String`, `UuidValue`, `Duration`, `DateTime`, `ByteData`, or generated serializable objects (see next section). A typed `Future` should always be returned. Null safety is supported. When passing a `DateTime` it is always converted to UTC.

You can also pass `List` and `Map` as parameters, but they need to be strictly typed with one of the types mentioned above. For `Map`, the keys must be non-nullable strings. E.g., `Map<String, int?>` is valid, but `Map<int, String>` is not.

:::warning

While it's possible to pass binary data through a method call and `ByteData`, it is not the most efficient way to transfer large files. See our [file upload](file-uploads) interface. The size of a call is by default limited to 512 kB. It's possible to change by adding the `maxRequestSize` to your config files. E.g., this will double the request size to 1 MB:

```yaml
maxRequestSize: 1048576
```

:::

## Return types

The return type must be a typed Future. Supported return types are the same as for parameters.

## Ignore endpoint definition

If you want the code generator to ignore an endpoint definition, you can annotate the class with `@ignoreEndpoint`, imported from `serverpod_shared/annotations.dart`.  This can be useful if you want to keep the definition in your codebase without generating server or client bindings for it.

```dart
import 'package:serverpod/serverpod.dart';
import 'package:serverpod_shared/annotations.dart';

@ignoreEndpoint
class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The above code will not generate any server or client bindings for the example endpoint.
