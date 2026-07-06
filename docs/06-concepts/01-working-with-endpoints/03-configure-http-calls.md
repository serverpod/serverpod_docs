---
description: Configure HTTP calls to set CORS credentials for web apps or use platform-native networking libraries.
---

# Configure HTTP calls

The generated `Client` accepts an optional `httpClientOverride` parameter that controls the underlying HTTP transport used for API calls. Use it when you need to customize how requests are sent, such as enabling browser credentials or using platform-native HTTP stacks.

## Include CORS credentials on web

By default, browser requests do not include cookies or HTTP authentication credentials in cross-origin requests. If your app relies on cookie-based sessions or similar mechanisms, pass a `BrowserClient` with `withCredentials` enabled:

```dart
import 'package:http/browser_client.dart';

final client = Client(
  serverUrl,
  httpClientOverride: BrowserClient()..withCredentials = true,
);
```

On the server, Serverpod adds CORS headers to API responses by default through `httpResponseHeaders` and `httpOptionsResponseHeaders` on the `Serverpod` constructor. The defaults allow cross-origin `POST` requests from any origin (`Access-Control-Allow-Origin: *`) and permit common request headers such as `Authorization` on preflight `OPTIONS` requests.

Credential-aware requests require `Access-Control-Allow-Credentials: true` and a specific origin instead of the wildcard. Override the defaults in your `lib/server.dart` (or wherever you construct `Serverpod`):

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

## Use platform-native HTTP clients

You can also override the default HTTP client with a platform-native HTTP client. On iOS and macOS, you can use [cupertino_http](https://pub.dev/packages/cupertino_http) to route traffic through `NSURLSession`. On Android, you can use [cronet_http](https://pub.dev/packages/cronet_http) to use the Cronet network stack.

Add the corresponding package to your Flutter app's `pubspec.yaml` before using these clients.

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

### Support web with conditional imports

The above example does not work if your app also targets web, since `dart:io` is not available there. Put the platform-specific `http.Client` creation logic behind a conditional import instead:

```dart
import 'src/http_client_stub.dart'
    if (dart.library.io) 'src/http_client_io.dart';

final client = Client(
  serverUrl,
  httpClientOverride: createHttpClient(),
);
```

The stub file provides a fallback for platforms without `dart:io` (such as web), where the default client is used:

```dart title="src/http_client_stub.dart"
import 'package:http/http.dart' as http;

http.Client? createHttpClient() => null;
```

The `dart:io` implementation wraps the platform-native client from the example above in a top-level `createHttpClient()` function:

```dart title="src/http_client_io.dart"
import 'dart:io';

// Same imports as the platform-native example above.

http.Client? createHttpClient() {
  if (Platform.isAndroid) {
    // ... return the CronetClient shown above
  } else if (Platform.isIOS || Platform.isMacOS) {
    // ... return the CupertinoClient shown above
  }
  return null;
}
```
