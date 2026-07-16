---
sidebar_label: Endpoint middleware
description: Middleware on the API server intercepts endpoint requests and responses for concerns such as logging, caching, and rate limiting.
---

# Endpoint middleware

Middleware runs before and after your endpoints, making it suitable for logging, caching, and rate limiting. Serverpod middleware follows the [Relic middleware](https://docs.dartrelic.dev/reference/middleware) interface. To add middleware to web server routes instead, scoped to path prefixes, see [Web server middleware](../web-server/web-server-middleware).

## Adding middleware to your server

Add middleware to your server in the `run` function before starting the server:

```dart
import 'package:serverpod/serverpod.dart';

void run(List<String> args) async {
  final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
  );

  // Add middleware before starting
  pod.server.addMiddleware(myCustomMiddleware());

  await pod.start();
}
```

## Creating custom middleware

### Middleware signature

A middleware is a function with this signature:

```dart
typedef Handler = FutureOr<Result> Function(Request request);
typedef Middleware = Handler Function(Handler innerHandler);
```

The return value is a `Result`, which can be a `Response`, `Hijack`, or `WebSocketUpgrade`. Check `is Response` before modifying response-specific fields.

### Simple middleware example

Here's a basic middleware that adds a custom header to all responses:

```dart
Middleware customHeaderMiddleware() {
  return (Handler innerHandler) {
    return (Request req) async {
      // Inspect or modify `req` here if needed

      // Call the inner handler to process the request
      final result = await innerHandler(req);

      // Modify the response
      if (result is Response) {
        return result.copyWith(
          headers: result.headers.transform((h) {
            h['X-Custom-Header'] = ['my-value'];
          }),
        );
      }

      return result;
    };
  };
}
```

## Error handling

Middleware can catch and handle errors:

```dart
Middleware errorHandlingMiddleware() {
  return (Handler innerHandler) {
    return (Request req) async {
      try {
        return await innerHandler(req);
      } catch (e, stackTrace) {
        // Log the error
        print('Error processing request: $e');
        print('Stack trace: $stackTrace');

        // Re-throw to let Serverpod handle it
        rethrow;
      }
    };
  };
}
```

Middleware runs on every request in the order it is added, so keep each one focused and efficient.
