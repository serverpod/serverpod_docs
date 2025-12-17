# Single page apps

Single Page Applications (SPAs) handle routing on the client side, which requires special server configuration. When users navigate to a route like `/dashboard` or `/settings`, the browser requests that path from the server. Since these aren't real files, the server needs to return the main `index.html` file so the client-side router can handle the route.

Serverpod provides `SpaRoute` to handle this pattern automatically.

## Basic setup

Use `SpaRoute` to serve your SPA with automatic fallback to `index.html`:

```dart
final webDir = Directory('web/app');

pod.webServer.addRoute(
  SpaRoute(
    webDir,
    fallback: File('web/app/index.html'),
  ),
);
```

:::info
The route path defaults to `'/'` (root). See [Serving from a sub-path](#serving-from-a-sub-path) to mount the SPA at a different location.
:::

This configuration:

- Serves static files from `web/app` when they exist
- Falls back to `index.html` for any path that doesn't match a file
- Enables client-side routing frameworks (React Router, Vue Router, etc.) to work correctly

## How it works

When a request comes in:

1. `SpaRoute` first tries to serve a matching static file from the directory
2. If no file exists (404 response), it serves the fallback file instead
3. The client-side JavaScript then handles routing based on the URL

This is implemented using `FallbackMiddleware` internally, which you can also use directly for custom fallback behavior.

## Cache control

Configure caching for your static assets:

```dart
pod.webServer.addRoute(
  SpaRoute(
    webDir,
    fallback: File('web/app/index.html'),
    cacheControlFactory: StaticRoute.publicImmutable(
      maxAge: const Duration(minutes: 5),
    ),
  ),
);
```

See [Static Files](static-files#cache-control) for more on cache control.

## Cache busting

Enable cache-busted URLs for your assets:

```dart
final webDir = Directory('web/app');

final cacheBustingConfig = CacheBustingConfig(
  mountPrefix: '/',
  fileSystemRoot: webDir,
);

pod.webServer.addRoute(
  SpaRoute(
    webDir,
    fallback: File('web/app/index.html'),
    cacheBustingConfig: cacheBustingConfig,
    cacheControlFactory: StaticRoute.publicImmutable(
      maxAge: const Duration(minutes: 5),
    ),
  ),
);
```

See [Static Files](static-files#static-file-cache-busting) for more on cache busting.

## Using FallbackMiddleware directly

For more control, use `FallbackMiddleware` with `StaticRoute`:

```dart
final webDir = Directory('web/app');
final indexFile = File('web/app/index.html');

pod.webServer.addMiddleware(
  FallbackMiddleware(
    fallback: StaticRoute.file(indexFile),
    on: (response) => response.statusCode == 404,
  ),
);

pod.webServer.addRoute(StaticRoute.directory(webDir), '/');
```

This gives you flexibility to customize the fallback condition. For example, you could fall back on any 4xx error:

```dart
FallbackMiddleware(
  fallback: StaticRoute.file(indexFile),
  on: (response) => response.statusCode >= 400 && response.statusCode < 500,
)
```

## Serving from a sub-path

To serve your SPA from a sub-path instead of the root, pass the path as the second argument to `addRoute`:

```dart
final webDir = Directory('web/app');

pod.webServer.addRoute(
  SpaRoute(
    webDir,
    fallback: File('web/app/index.html'),
  ),
  '/app',
);
```

This serves the SPA at `/app`, so users would access it at `http://localhost:8082/app`.

:::note
When using cache busting with a sub-path, update the `mountPrefix` to match:

```dart
final cacheBustingConfig = CacheBustingConfig(
  mountPrefix: '/app',
  fileSystemRoot: webDir,
);
```

:::

## Serving Flutter web applications

For serving Flutter web applications specifically, see [Flutter web apps](flutter-web).
