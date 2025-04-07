# Working with endpoints

Endpoints are the connection points to the server from the client. With Serverpod, you add methods to your endpoint, and your client code will be generated. For the code to be generated, you need to place your endpoint in the `lib/src/endpoints` directory of your server. Your endpoint should extend the `Endpoint` class. For methods to be generated, they need to return a typed `Future`, and its first parameter should be a `Session` object. The `Session` object holds information about the call being made and provides access to the database.

```dart
import 'package:serverpod/serverpod.dart';

class ExampleEndpoint extends Endpoint {
  Future<String> hello(Session session, String name) async {
    return 'Hello $name';
  }
}
```

The above code will create an endpoint called `example` (the Endpoint suffix will be removed) with the single `hello` method. To generate the client-side code run `serverpod generate` in the home directory of the server.

On the client side, you can now invoke the method by calling:

```dart
var result = await client.example.hello('World');
```

:::tip

To learn more about endpoints, see the [Working with endpoints](../concepts/working-with-endpoints) section.

::: 