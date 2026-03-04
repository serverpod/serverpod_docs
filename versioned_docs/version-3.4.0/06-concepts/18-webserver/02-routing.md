# Routing

Routes are the foundation of your web server, directing incoming HTTP requests
to the right handlers. While simple routes work well for basic APIs, Serverpod
provides powerful routing features for complex applications: HTTP method
filtering, path parameters, wildcards, and fallback handling. Understanding
these patterns helps you build clean, maintainable APIs.

## Route classes

The `Route` base class gives you complete control over request handling. By
extending `Route` and implementing `handleCall()`, you can build REST APIs,
serve files, or handle any custom HTTP interaction. This is ideal when you need
to work directly with request bodies, headers, and response formats.

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
```

You need to register your custom routes with the built-in router under a given path:

```dart
// Register the route
pod.webServer.addRoute(ApiRoute(), '/api/data');
```

:::info

The examples in this documentation omit error handling for brevity.

:::

## Http methods

Routes can specify which HTTP methods they respond to using the `methods`
parameter.

```dart
class UserRoute extends Route {
  UserRoute() : super(
    methods: {Method.get, Method.post, Method.delete},
  );
  // ...
}
```

## Path parameters

Define path parameters in your route pattern using the `:paramName` syntax:

```dart
pod.webServer.addRoute(UserRoute(), '/api/users/:id');
// Matches: /api/users/123, /api/users/456, etc.
```

You can use multiple path parameters in a single route:

```dart
pod.webServer.addRoute(route, '/:userId/posts/:postId');
// Matches: /123/posts/456
```

## Wildcards

Routes also support wildcard matching for catching all paths:

```dart
// Single-level wildcard - matches /item/foo but not /item/foo/bar
pod.webServer.addRoute(ItemRoute(), '/item/*');

// Tail-match wildcard - matches /item/foo and /item/foo/bar/baz
pod.webServer.addRoute(ItemRoute(), '/item/**');
```

:::info Tail matches

The `/**` wildcard is a **tail-match** pattern and can only appear at the end of
a route path (e.g., `/static/**`). Patterns like `/a/**/b` are not supported.

:::

Access the matched path information through the `Request` object:

```dart
@override
Future<Result> handleCall(Session session, Request request) async {
  // Get the remaining path after the route prefix
  final remainingPath = request.remainingPath;

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

:::tip Advanced: Grouping routes into modules

As your web server grows, managing dozens of individual route registrations can
become unwieldy. You can group related endpoints into reusable modules by
overriding the `injectIn()` method. This lets you register multiple handler
functions instead of implementing a single `handleCall()` method.

Here's an example:

```dart
class UserCrudModule extends Route {
  @override
  void injectIn(RelicRouter router) {
    // Register multiple routes with path parameters
    router
      ..get('/', _list)
      ..get('/:id', _get);
  }

  // Handler methods
  Future<Result> _list(Request request) async {
    final session = request.session;
    final users = await User.db.find(session);

    return Response.ok(
      body: Body.fromString(
        jsonEncode(users.map((u) => u.toJson()).toList()),
        mimeType: MimeType.json,
      ),
    );
  }

  static const _idParam = IntPathParam(#id);
  Future<Result> _get(Request request) async {
    int userId = request.pathParameters.get(_idParam);
    final session = await request.session;
    final user = await User.db.findById(session, userId);

    if (user == null) {
      return Response.notFound(
        body: Body.fromString('User not found'),
      );
    }

    return Response.ok(
      body: Body.fromString(
        jsonEncode(user.toJson()),
        mimeType: MimeType.json,
      ),
    );
  }
}

// Register the entire CRUD module under /api/users
pod.webServer.addRoute(UserCrudModule(), '/api/users');
```

This creates `GET /api/users` and `GET /api/users/:id` endpoints.

Note that handlers receive only a `Request` parameter. To access the `Session`,
use `request.session` (unlike `Route.handleCall()` which receives both as
explicit parameters).

:::

## Virtual host routing

Virtual host routing allows you to serve different content based on the `Host` header of incoming requests. This is useful for multi-tenant applications or serving different front-ends from distinct subdomains using a single server instance - like an API on `api.example.com`, a web app on `www.example.com`, and an admin panel on `admin.example.com`.

### How it works

By default, routes match requests from any host.

```dart
// Route that responds to any host (default behavior)
class PublicRoute extends Route {
  PublicRoute() : super(); // host defaults to null

  @override
  Future<Result> handleCall(Session session, Request request) async {
    return Response.ok(
      body: Body.fromString('Public endpoint'),
    );
  }
}
```

You can restrict a route to a specific host by providing the `host` parameter when creating the route:

```dart
// Route that only responds to api.example.com
class ApiRoute extends Route {
  ApiRoute() : super(host: 'api.example.com');

  @override
  Future<Result> handleCall(Session session, Request request) async {
    return Response.ok(
      body: Body.fromString(
        jsonEncode({'message': 'API endpoint'}),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

### Registering host-specific routes

Register routes with host restrictions just like regular routes:

```dart
// Route that only responds to api.example.com
pod.webServer.addRoute(ApiRoute(), '/v1');

// Route that only responds to www.example.com
pod.webServer.addRoute(
  SpaRoute(webDir, fallback: index, host: 'www.example.com'),
  '/',
);

// Route that responds to any host (default behavior)
pod.webServer.addRoute(HealthRoute(), '/health');
```

### Supported route types

All route types support virtual host routing:

- **Custom routes** - Pass `host` to the `Route` constructor
- **StaticRoute** - Use `host` parameter in `StaticRoute.directory()` or `StaticRoute.file()`
- **SpaRoute** - Use `host` parameter in the `SpaRoute` constructor
- **FlutterRoute** - Use `host` parameter in the `FlutterRoute` constructor

```dart
// Static files for a specific host
pod.webServer.addRoute(
  StaticRoute.directory(
    Directory('web/admin'),
    host: 'admin.example.com',
  ),
  '/static/',
);

// SPA for a specific host
pod.webServer.addRoute(
  SpaRoute(
    Directory('web/app'),
    fallback: File('web/app/index.html'),
    host: 'app.example.com',
  ),
  '/',
);
```

## Next steps

- **[Request Data](request-data)** - Access path parameters, query parameters, headers, and body
- **[Middleware](middleware)** - Intercept and transform requests and responses
- **[Static Files](static-files)** - Serve static assets
- **[Server-side HTML](server-side-html)** - Render HTML dynamically on the server
