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

You need to register your custom routes with the build in router in under a given path:

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

Routes support named path parameters using the `:paramName` syntax. These are
automatically extracted and made available through the `Request` object:

```dart
class UserRoute extends Route {
  UserRoute() : super(methods: {Method.get});

  static const _idParam = IntPathParam(#id); // Typed accessor
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Extract path parameter using typed accessor
    int userId = request.pathParameters.get(_idParam);
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

// Register at /api/users - will match /api/users/123 with #id = 123
pod.webServer.addRoute(UserRoute(), '/api/users/:id');
```

You can use multiple path parameters in a single route:

```dart
pod.webServer.addRoute(route, '/:userId/posts/:postId');
// Matches: /123/posts/456 with #userId = 123, and #postId = 456
```

:::tip Accessing path parameters

Path parameters are normally accessed using const constructed `PathParam<T>`
instances. These combine the `Symbol` used to identify the parameter, with its
parser, and automatically handles caching.

Example:

```dart
const _userIdParam = IntPathParam(#userId);
const _postIdParam = IntPathParam(#postId);
int userId = request.pathParameters.get(_userIdParam); // throw if missing, ..
int postId = request.pathParameters.get(_postIdParam); // .. or not an int
```

You can also access raw non-parsed value with
`request.pathParameters.raw[#userId]`. Always validate and parse these values
since they come from user input as strings.

To learn more about typed path parameters consult the Relic documentation.

:::

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

## Modules

As your web server grows, managing dozens of individual route registrations can
become unwieldy. Modules solve this by letting you group related
endpoints into reusable components. For example, you might create a
`UserCrudModule` that handles all user-related endpoints (`GET /users`,
`POST /users`, `PUT /users/:id`, etc.) in a single cohesive unit.

The key to modular routes is the `injectIn()` method. When you call
`pod.webServer.addRoute(route, path)`, Serverpod calls `route.injectIn(router)`
on a router group for that path. By overriding `injectIn()`, you can register
multiple handler functions instead of implementing a single `handleCall()`
method. This pattern is perfect for REST resources, API modules, or any group of
related endpoints.

### Creating a module

Here's an example of a modular route that registers multiple endpoints with
path parameters:

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

This creates the following RESTful endpoints:

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get a specific user (e.g., `/api/users/123`)

:::tip Session access in modular routes

When using `injectIn()` with handler functions (`router.get('/', _handler)`),
your handlers receive only a `Request` parameter. To access the `Session`, use
`await request.session`:

```dart
Future<Result> _handler(Request request) async {
  final session = await request.session;  // Extract Session from Request
  // ... use session
}
```

This differs from `Route.handleCall()` which receives both as explicit
parameters. The modular route pattern uses Relic's router directly, which
doesn't know about Serverpod's `Session`.

:::

## Next steps

- **[Middleware](middleware)** - Intercept and transform requests and responses
- **[Static Files](static-files)** - Serve static assets
- **[Server-side HTML](server-side-html)** - Render HTML dynamically on the server
