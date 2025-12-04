# Serving Flutter web apps

Serverpod's built-in web server can serve your Flutter web application directly, allowing you to host both your API and web frontend from the same server. This simplifies deployment and infrastructure management by eliminating the need for separate static file hosting.

## Prerequisites

Before you begin, ensure you have:

- A Serverpod project with the web server enabled (included by default in new projects)
- A Flutter project configured for web (run `flutter create --platforms=web .` in your Flutter project if needed)
- Flutter SDK 3.24.0 or later (required for WASM support)

## Building Flutter for web

Flutter supports two compilation targets for web: JavaScript and WebAssembly (WASM).

### JavaScript build

The standard JavaScript build works in all modern browsers:

```bash
cd my_project_flutter
flutter build web
```

This creates the build output in `build/web/`.

### WASM build

For improved performance and multi-threading support, use the WASM build:

```bash
cd my_project_flutter
flutter build web --wasm
```

:::info

WASM builds automatically fall back to JavaScript in browsers that don't support WebAssembly Garbage Collection (WasmGC). This means your app will work everywhere while taking advantage of WASM performance where available.

:::

## Project structure

After building your Flutter app, copy the build output to your server's `web` directory:

```text
my_project/
├── my_project_server/
│   ├── lib/
│   │   └── server.dart
│   └── web/
│       └── app/              # Flutter web build output
│           ├── index.html
│           ├── main.dart.js
│           ├── flutter.js
│           └── ...
├── my_project_flutter/
│   └── build/
│       └── web/              # Flutter build output (source)
└── my_project_client/
```

## Configuring Serverpod to serve Flutter

Update your `server.dart` to serve the Flutter web application. The key steps are:

1. Add a static route for the Flutter app files
2. Configure a fallback route for client-side routing (SPA support)

```dart
import 'dart:io';

import 'package:serverpod/serverpod.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(args, Protocol(), Endpoints());

  // Path to the Flutter web build output
  final flutterAppDir = Directory('web/app');

  // Serve index.html at root
  pod.webServer.addRoute(StaticRoute.file(File('web/app/index.html')), '/');

  // Serve Flutter app static files
  pod.webServer.addRoute(StaticRoute.directory(flutterAppDir), '/**');

  pod.fallbackRoute = StaticRoute.file('web/app/index.html');

  await pod.start();
}
```

The root route (`'/'`) serves `index.html` as the entry point. The wildcard route (`'/**'`) serves all static assets including JavaScript, CSS, and other resources. This configuration enables Flutter's client-side routing to work correctly.

## Enabling multi-threading with WASM

Standard Dart isolates are not supported in Flutter web. However, when using WASM builds, you can enable multi-threaded rendering for improved performance. This requires specific HTTP headers.

### Required headers

For multi-threaded WASM to work, the browser needs `SharedArrayBuffer` access, which requires these security headers:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

### Adding headers with middleware

Create a middleware to add the required headers:

```dart
Handler wasmHeadersMiddleware(Handler innerHandler) {
  return (Request req) async {
    final result = await innerHandler(req);
    if (result is Response) {
      final existingHeaders = result.headers;
      return Response(
        result.statusCode,
        body: result.body,
        headers: Headers.build((mh) {
          // Preserve existing headers
          for (final entry in existingHeaders.entries) {
            mh[entry.key] = entry.value;
          }
          // Add COOP/COEP headers for WASM multi-threading
          mh['Cross-Origin-Opener-Policy'] = ['same-origin'];
          mh['Cross-Origin-Embedder-Policy'] = ['require-corp'];
        }),
      );
    }
    return result;
  };
}
```

Add the middleware to your web server:

```dart
void run(List<String> args) async {
  final pod = Serverpod(args, Protocol(), Endpoints());

  final flutterAppDir = Directory('web/app');
  pod.webServer.addRoute(StaticRoute.file(File('web/app/index.html')), '/');
  pod.webServer.addRoute(StaticRoute.directory(flutterAppDir), '/**');

  // Add WASM headers middleware
  pod.webServer.addMiddleware(wasmHeadersMiddleware, '/**');

  await pod.start();
}
```

## Complete example

Here's a complete `server.dart` configuration for serving a Flutter web app with WASM support:

```dart
import 'dart:io';

import 'package:serverpod/serverpod.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(args, Protocol(), Endpoints());

  final flutterAppDir = Directory('web/app');

  // Check if Flutter app exists
  if (!flutterAppDir.existsSync()) {
    print('Warning: Flutter web app not found at ${flutterAppDir.path}');
    print('Build your Flutter app and copy it to web/app/');
  } else {
    // Serve index.html at root
    pod.webServer.addRoute(StaticRoute.file(File('web/app/index.html')), '/');

    // Serve Flutter app static files
    pod.webServer.addRoute(StaticRoute.directory(flutterAppDir), '/**');

    // Add WASM headers middleware for multi-threading support
    pod.webServer.addMiddleware(wasmHeadersMiddleware, '/**');
  }

  await pod.start();
}

Handler wasmHeadersMiddleware(Handler innerHandler) {
  return (Request req) async {
    final result = await innerHandler(req);
    if (result is Response) {
      final existingHeaders = result.headers;
      return Response(
        result.statusCode,
        body: result.body,
        headers: Headers.build((mh) {
          // Preserve existing headers
          for (final entry in existingHeaders.entries) {
            mh[entry.key] = entry.value;
          }
          // Add COOP/COEP headers for WASM multi-threading
          mh['Cross-Origin-Opener-Policy'] = ['same-origin'];
          mh['Cross-Origin-Embedder-Policy'] = ['require-corp'];
        }),
      );
    }
    return result;
  };
}
```

With this configuration, your Flutter web app will be served at the root URL of your web server (typically `http://localhost:8082` in development).
