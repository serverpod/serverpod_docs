# Flutter web apps

Serverpod can serve your Flutter web application directly, allowing you to host both your API and web frontend from the same server. `FlutterRoute` handles the specifics of serving Flutter web apps, including WASM multi-threading headers and SPA-style routing.

## Basic setup

Use `FlutterRoute` to serve your Flutter web build:

```dart
pod.webServer.addRoute(
  FlutterRoute(Directory('web/app')),
  '/',
);
```

This configuration:

- Serves all static files from the Flutter build
- Falls back to `index.html` for client-side routing
- Adds WASM multi-threading headers automatically

## Building Flutter for web

Build your Flutter app for web with WASM support for improved performance and multi-threading:

```bash
cd my_project_flutter
flutter build web --wasm
```

:::info

WASM builds automatically fall back to JavaScript in browsers that don't support WebAssembly Garbage Collection (WasmGC). Your app works everywhere while taking advantage of WASM performance where available.

:::

## Project structure

Copy your Flutter build output to the server's `web` directory:

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

## WASM multi-threading

Flutter WASM builds can use multi-threaded rendering for improved performance. This requires `SharedArrayBuffer`, which browsers only enable with specific security headers.

`FlutterRoute` automatically adds these headers:

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

### Using WasmHeadersMiddleware directly

If you're using `SpaRoute` or custom routes instead of `FlutterRoute`, add the headers manually with `WasmHeadersMiddleware`:

```dart
pod.webServer.addMiddleware(const WasmHeadersMiddleware());

pod.webServer.addRoute(
  SpaRoute(
    Directory('web/app'),
    fallback: File('web/app/index.html'),
  ),
  '/',
);
```

## Cache control

Configure caching for Flutter's static assets:

```dart
pod.webServer.addRoute(
  FlutterRoute(
    Directory('web/app'),
    cacheControlFactory: StaticRoute.publicImmutable(
      maxAge: const Duration(minutes: 5),
    ),
  ),
  '/',
);
```

See [Static Files](static-files#cache-control) for more on cache control.

## Cache busting

Enable cache-busted URLs:

```dart
final webDir = Directory('web/app');

final cacheBustingConfig = CacheBustingConfig(
  mountPrefix: '/',
  fileSystemRoot: webDir,
);

pod.webServer.addRoute(
  FlutterRoute(
    webDir,
    cacheBustingConfig: cacheBustingConfig,
    cacheControlFactory: StaticRoute.publicImmutable(
      maxAge: const Duration(minutes: 5),
    ),
  ),
  '/',
);
```

See [Static Files](static-files#static-file-cache-busting) for more on cache busting.

## Complete example

Here's a complete `server.dart` serving a Flutter web app:

```dart
import 'dart:io';

import 'package:serverpod/serverpod.dart';

import 'src/generated/protocol.dart';
import 'src/generated/endpoints.dart';

void run(List<String> args) async {
  final pod = Serverpod(args, Protocol(), Endpoints());

  final flutterAppDir = Directory('web/app');

  if (!flutterAppDir.existsSync()) {
    print('Warning: Flutter web app not found at ${flutterAppDir.path}');
    print('Build your Flutter app and copy it to web/app/');
  } else {
    pod.webServer.addRoute(FlutterRoute(flutterAppDir), '/');
  }

  await pod.start();
}
```

With this configuration, your Flutter web app is served at the root URL of your web server (typically `http://localhost:8082` in development).
