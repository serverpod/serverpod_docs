# Routing

Routes are the foundation of your web server, directing incoming HTTP requests
to the right handlers. While simple routes work well for basic APIs, Serverpod
provides powerful routing features for complex applications: HTTP method
filtering, path parameters, wildcards, and fallback handling. Understanding
these patterns helps you build clean, maintainable APIs.

## Custom route classes

While `WidgetRoute` is convenient for rendering HTML pages, the `Route` base
class gives you complete control over request handling. By extending `Route` and
implementing `handleCall()`, you can build REST APIs, serve files, or handle any
custom HTTP interaction. This is ideal when you need to work directly with
request bodies, headers, and response formats.

```dart
class ApiRoute extends Route {
  ApiRoute() : super(methods: {Method.get, Method.post});

  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Access request method
    if (request.method == Method.post) {
      // Read request body
      final body = await request.readAsString();
      final data = jsonDecode(body);

      // Process and return JSON response
      return Response.ok(
        body: Body.fromString(
          jsonEncode({'status': 'success', 'data': data}),
          mimeType: MimeType.json,
        ),
      );
    }

    // Return data for GET requests
    return Response.ok(
      body: Body.fromString(
        jsonEncode({'message': 'Hello from API'}),
        mimeType: MimeType.json,
      ),
    );
  }
}

// Register the route
pod.webServer.addRoute(ApiRoute(), '/api/data');
```

:::info

The examples in this documentation omit error handling for brevity. See the
Error Handling section in Middleware below for the recommended approach using
global error-handling middleware.

:::

## Http methods

Routes can specify which HTTP methods they respond to using the `methods`
parameter. The available methods are:

- `Method.get` - Retrieve data
- `Method.post` - Create new resources
- `Method.put` - Update resources (full replacement)
- `Method.patch` - Update resources (partial)
- `Method.delete` - Delete resources
- `Method.head` - Same as GET but without response body
- `Method.options` - Query supported methods (used for CORS)

```dart
class UserRoute extends Route {
  UserRoute() : super(
    methods: {Method.get, Method.post, Method.delete},
  );

  @override
  Future<Result> handleCall(Session session, Request request) async {
    switch (request.method) {
      case Method.get:
        return await _getUser(request);
      case Method.post:
        return await _createUser(request);
      case Method.delete:
        return await _deleteUser(request);
      default:
        return Response.methodNotAllowed();
    }
  }
}
```

## Path parameters

Routes support named path parameters using the `:paramName` syntax. These are
automatically extracted and made available through the `Request` object:

```dart
class UserRoute extends Route {
  UserRoute() : super(methods: {Method.get});

  @override
  void injectIn(RelicRouter router) {
    // Define route with path parameter
    router.get('/:id', asHandler);
  }

  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Extract path parameter using symbol
    final id = request.pathParameters[#id];

    if (id == null) {
      return Response.badRequest(
        body: Body.fromString('Missing user ID'),
      );
    }

    final userId = int.tryParse(id);
    if (userId == null) {
      return Response.badRequest(
        body: Body.fromString('Invalid user ID'),
      );
    }

    final user = await User.db.findById(session, userId);

    if (user == null) {
      return Response.notFound();
    }

    return Response.ok(
      body: Body.fromString(
        jsonEncode(user.toJson()),
        mimeType: MimeType.json,
      ),
    );
  }
}

// Register at /api/users - will match /api/users/123
pod.webServer.addRoute(UserRoute(), '/api/users');
```

You can use multiple path parameters in a single route:

```dart
router.get('/:userId/posts/:postId', handler);
// Matches: /123/posts/456
// request.pathParameters[#userId] => '123'
// request.pathParameters[#postId] => '456'
```

## Wildcards

Routes also support wildcard matching for catching all paths:

```dart
// Single-level wildcard - matches /item/foo but not /item/foo/bar
pod.webServer.addRoute(ItemRoute(), '/item/*');

// Tail-match wildcard - matches /item/foo and /item/foo/bar/baz
pod.webServer.addRoute(ItemRoute(), '/item/**');
```

:::info Performance Guarantee

The `/**` wildcard is a **tail-match** pattern and can only appear at the end of
a route path (e.g., `/static/**`). Patterns like `/a/**/b` are not supported.
This design ensures O(h) route lookup performance, where h is the path length,
without backtracking. This keeps routing fast and predictable, even with many
routes.

:::

Access the matched path information through the `Request` object:

```dart
@override
Future<Result> handleCall(Session session, Request request) async {
  // Get the remaining path after the route prefix
  final remainingPath = request.url.path;

  // Access query parameters
  final query = request.url.queryParameters['query'];

  return Response.ok(
    body: Body.fromString('Path: $remainingPath, Query: $query'),
  );
}
```

## Fallback routes

You can set a fallback route that handles requests when no other route matches:

```dart
class NotFoundRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    return Response.notFound(
      body: Body.fromString('Page not found: ${request.url.path}'),
    );
  }
}

// Set as fallback
pod.webServer.fallbackRoute = NotFoundRoute();
```

## Next steps

- Learn about [modular routes](modular-routes) for organizing complex APIs
- Add [middleware](middleware) for request processing and error handling
- Serve [static files](static-files) like images and assets
