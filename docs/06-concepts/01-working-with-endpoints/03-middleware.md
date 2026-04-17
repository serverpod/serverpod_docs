# Middleware

Serverpod provides a middleware system that allows you to intercept and process HTTP requests before they reach your endpoints, and modify responses before they're sent to clients. This enables cross-cutting concerns like caching and rate limiting.

## Overview

Middleware in Serverpod are based on [Relic middleware](https://docs.dartrelic.dev/reference/middleware).

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
typedef Middleware = Handler Function(Handler innerHandler);
typedef Handler = Future<Response> Function(Request request);
```

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

## Best practices

1. **Order matters**: Add middleware in the order you want it to execute.

2. **Keep middleware focused**: Each middleware should have a single, well-defined responsibility.

3. **Handle errors gracefully**: Always consider error cases and decide whether to handle or rethrow.

4. **Performance considerations**: Middleware executes on every request, so keep it efficient.

5. **Test your middleware**: Write tests to verify middleware behavior in isolation and when composed.

6. **Document configuration**: If middleware accepts parameters, document them clearly.

7. **Avoid side effects**: Be cautious with middleware that modifies global state or external systems.
