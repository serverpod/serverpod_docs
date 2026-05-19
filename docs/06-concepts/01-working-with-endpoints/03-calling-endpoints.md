# Calling endpoints

When you run `serverpod generate` after defining endpoints on your server, Serverpod creates a `Client` class in your client package with typed methods for each endpoint. This `client` is used to call the endpoints on the server as if they were local methods.

## Initializing the client

The client is initialized by creating the `Client` object and storing it as a singleton in your app - usually through a service locator.

```dart
// Store the client in a service locator
var client = Client('http://localhost:8080/')
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

## Connecting from a different device

If you run the app in an Android emulator, use `10.0.2.2` instead of `localhost`, since `10.0.2.2` is the IP address of the host machine from inside the emulator. To access the server from a different device on the same network (such as a physical phone), replace `localhost` with the local IP address of your machine. You can find the local IP by running `ifconfig` (Linux/macOS) or `ipconfig` (Windows).

Make sure to also update the `publicHost` in the development config to make sure the server always serves the client with the correct path to assets etc.

```yaml
# your_project_server/config/development.yaml

apiServer:
  port: 8080
  publicHost: localhost # Change this line
  publicPort: 8080
  publicScheme: http
```

## HTTP client override

The generated `Client` accepts an optional `httpClientOverride` parameter that controls the underlying HTTP transport used for API calls. Use this parameter to customize the HTTP client behavior such as CORS credentials on web or platform-native HTTP stacks.

### CORS credentials on web

By default, browser requests do not include cookies or HTTP authentication credentials in cross-origin requests. If your app relies on cookie-based sessions or similar mechanisms, pass a `BrowserClient` with `withCredentials` enabled:

```dart
import 'package:http/browser_client.dart';

final client = Client(
  serverUrl,
  httpClientOverride: BrowserClient()..withCredentials = true,
);
```

On the server, Serverpod adds CORS headers to API responses by default through `httpResponseHeaders` and `httpOptionsResponseHeaders` on the `Serverpod` constructor. The defaults allow cross-origin `POST` requests from any origin (`Access-Control-Allow-Origin: *`) and permit common request headers such as `Authorization` on preflight `OPTIONS` requests.

Credential-aware requests require stricter headers: the browser rejects `Access-Control-Allow-Origin: *` when credentials are included, and the server must respond with `Access-Control-Allow-Credentials: true` and a specific origin. Override the defaults in your `lib/server.dart` (or wherever you construct `Serverpod`):

```dart
import 'package:serverpod/serverpod.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

/// The starting point of the Serverpod server.
void run(List<String> args) async {
  // Initialize Serverpod and connect it with your generated code.
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    httpResponseHeaders: Headers.build((mh) {
      mh.accessControlAllowOrigin = AccessControlAllowOriginHeader.origin(
        origin: Uri.parse('http://localhost:49660'), // Your Flutter web app origin
      );
      mh.accessControlAllowCredentials = true;
      mh.accessControlAllowMethods = AccessControlAllowMethodsHeader.methods(
        [Method.post],
      );
    }),
    httpOptionsResponseHeaders: Headers.build((mh) {
      mh.accessControlAllowHeaders = AccessControlAllowHeadersHeader.headers([
        'Content-Type',
        'Authorization',
        'Accept',
        'User-Agent',
        'X-Requested-With',
      ]);
    }),
  );

  // Start the server
  await pod.start();
}
```

Set `origin` to the exact origin of your Flutter web app (scheme, host, and port). In production, list each allowed origin explicitly.

### Platform-native HTTP clients

You can use the `httpClientOverride` parameter to override the default HTTP client with a platform-native HTTP client. On iOS and macOS, you can use [cupertino_http](https://pub.dev/packages/cupertino_http) to route traffic through `NSURLSession`. On Android, you can use [cronet_http](https://pub.dev/packages/cronet_http) to use the Cronet network stack.

Below is an example of how to override the default HTTP client by platform-native HTTP clients.

```dart
import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;

import 'package:my_project_client/my_project_client.dart';

void main() async {
  http.Client? httpClient;

  if (Platform.isAndroid) {
    final engine = CronetEngine.build(
        cacheMode: CacheMode.memory,
        cacheMaxSize: 2 * 1024 * 1024,
        userAgent: 'Book Agent');
    httpClient = CronetClient.fromCronetEngine(engine, closeEngine: true);
  } else if (Platform.isIOS || Platform.isMacOS) {
    final config = URLSessionConfiguration.ephemeralSessionConfiguration()
      ..cache = URLCache.withCapacity(memoryCapacity: 2 * 1024 * 1024)
      ..httpAdditionalHeaders = {'User-Agent': 'Book Agent'};
    httpClient = CupertinoClient.fromSessionConfiguration(config);
  }

  final client = Client(
    serverUrl,
    httpClientOverride: httpClient,
  );
}
```

:::info
Note that the above example does not work if web also needs to be supported, since `dart:io` is not available on web. To support web, hide the `http.Client` creation logic behind a conditional import.
:::

Add the corresponding package to your Flutter app's `pubspec.yaml` before using these clients.
