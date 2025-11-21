# Modular Routes

As your web server grows, managing dozens of individual route registrations can
become unwieldy. Modular routes solve this by letting you group related
endpoints into reusable modules. For example, you might create a
`UserCrudModule` that handles all user-related endpoints (`GET /users`,
`POST /users`, `PUT /users/:id`, etc.) in a single cohesive unit.

The key to modular routes is the `injectIn()` method. When you call
`pod.webServer.addRoute(route, path)`, Serverpod calls `route.injectIn(router)`
on a router group for that path. By overriding `injectIn()`, you can register
multiple handler functions instead of implementing a single `handleCall()`
method. This pattern is perfect for REST resources, API modules, or any group of
related endpoints.

## Session Access in Modular Routes

When using `injectIn()` with handler functions (`router.get('/', _handler)`),
your handlers receive only a `Request` parameter. To access the `Session`, use
`request.session`:

```dart
Future<Result> _handler(Request request) async {
  final session = request.session;  // Extract Session from Request
  // ... use session
}
```

This differs from `Route.handleCall()` which receives both Session and Request
as explicit parameters. The modular route pattern uses Relic's router directly,
which only provides Request to handlers.

## Creating a CRUD module

Here's an example of a modular CRUD route that registers multiple endpoints with
path parameters:

```dart
class UserCrudModule extends Route {
  @override
  void injectIn(RelicRouter router) {
    // Register multiple routes with path parameters
    router
      ..get('/', _list)
      ..get('/:id', _get)
      ..post('/', _create)
      ..put('/:id', _update)
      ..delete('/:id', _delete);
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

  Future<Result> _get(Request request) async {
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

    final session = request.session;
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

  Future<Result> _create(Request request) async {
    final body = await request.readAsString();
    final data = jsonDecode(body);
    final session = request.session;

    final user = User(name: data['name'], email: data['email']);
    await User.db.insertRow(session, user);

    return Response.created(
      body: Body.fromString(
        jsonEncode(user.toJson()),
        mimeType: MimeType.json,
      ),
    );
  }

  Future<Result> _update(Request request) async {
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

    final body = await request.readAsString();
    final data = jsonDecode(body);
    final session = request.session;

    final user = await User.db.findById(session, userId);
    if (user == null) {
      return Response.notFound(
        body: Body.fromString('User not found'),
      );
    }

    user.name = data['name'] ?? user.name;
    user.email = data['email'] ?? user.email;
    await User.db.updateRow(session, user);

    return Response.ok(
      body: Body.fromString(
        jsonEncode(user.toJson()),
        mimeType: MimeType.json,
      ),
    );
  }

  Future<Result> _delete(Request request) async {
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

    final session = request.session;
    final deleted = await User.db.deleteRow(session, userId);

    if (!deleted) {
      return Response.notFound(
        body: Body.fromString('User not found'),
      );
    }

    return Response.noContent();
  }

  // Required by Route but not used since we override injectIn
  @override
  Future<Result> handleCall(Session session, Request request) async {
    throw UnimplementedError('This route uses injectIn');
  }
}

// Register the entire CRUD module under /api/users
pod.webServer.addRoute(UserCrudModule(), '/api/users');
```

This creates the following RESTful endpoints:

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get a specific user (e.g., `/api/users/123`)
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user (e.g., `/api/users/123`)
- `DELETE /api/users/:id` - Delete a user (e.g., `/api/users/123`)

:::tip

Path parameters are accessed using symbols: `request.pathParameters[#paramName]`.
Always validate and parse these values since they come from user input as
strings.

:::

## Composing multiple modules

You can create a parent module that composes multiple sub-modules:

```dart
class ApiModule extends Route {
  @override
  void injectIn(RelicRouter router) {
    // Inject sub-modules at different paths
    router.group('/users').inject(UserCrudModule());
    router.group('/posts').inject(PostCrudModule());
    router.group('/comments').inject(CommentCrudModule());

    // Add module-level routes
    router.get('/health', _healthCheck);
  }

  Future<Result> _healthCheck(Request request) async {
    return Response.ok(
      body: Body.fromString(
        jsonEncode({'status': 'healthy', 'timestamp': DateTime.now().toIso8601String()}),
        mimeType: MimeType.json,
      ),
    );
  }

  @override
  Future<Result> handleCall(Session session, Request request) async {
    throw UnimplementedError('This route uses injectIn');
  }
}

// Register the entire API module
pod.webServer.addRoute(ApiModule(), '/api');
```

This pattern enables you to:

- **Organize routes hierarchically** - Group related functionality together
- **Reuse route modules** - Use the same module in different applications
- **Compose complex APIs** - Build large APIs from smaller, focused modules
- **Separate concerns** - Keep route registration logic separate from handler
  implementation

:::tip

When overriding `injectIn`, you typically don't need to implement `handleCall`
since you're registering handler functions directly with the router. You can
throw `UnimplementedError` in `handleCall` to make it clear the method isn't
used.

:::

## Next Steps

- Add [middleware](middleware) for cross-cutting concerns like logging and
  error handling
- Learn about [typed headers](typed-headers) for type-safe header access
- Explore [static file serving](static-files) for assets and downloads
