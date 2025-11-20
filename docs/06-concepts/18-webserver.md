# Web server

In addition to the application server, Serverpod comes with a built-in web server. The web server allows you to access your database and business layer the same way you would from a method call from an app. This makes it very easy to share data for applications that need both an app and traditional web pages. You can also use the web server to create webhooks or generate custom REST APIs to communicate with 3rd party services.

:::caution

Serverpod's web server is still experimental, and the APIs may change in the future. This documentation should give you some hints on getting started, but we plan to add more extensive documentation as the web server matures.

:::

When you create a new Serverpod project, it sets up a web server by default. When working with the web server, there are two main classes to understand; `WidgetRoute` and `TemplateWidget`. The `WidgetRoute` provides an entry point for a call to the server and returns a `WebWidget`. The `TemplateWidget` renders a web page using templates, while other `WebWidget` types can render JSON or other custom responses.

## Creating new routes and widgets

To add new pages to your web server, you add new routes. Typically, you do this in your server.dart file before you start the Serverpod. By default, Serverpod comes with a `RootRoute` and a static directory.

When receiving a web request, Serverpod will search and match the routes in the order they were added. You can end a route's path with an asterisk (`*`) to match all paths with the same beginning.

```dart
// Add a single page.
pod.webServer.addRoute(MyRoute(), '/my/page/address');

// Match all paths that start with /item/
pod.webServer.addRoute(AnotherRoute(), '/item/*');
```

Typically, you want to create custom routes for your pages. Do this by overriding the WidgetRoute class and implementing the build method.

```dart
class MyRoute extends WidgetRoute {
  @override
  Future<TemplateWidget> build(Session session, Request request) async {
    return MyPageWidget(title: 'Home page');
  }
}
```

Your route's build method returns a `WebWidget`. The `TemplateWidget` consists of an HTML template file and a corresponding Dart class. Create a new custom widget by extending the `TemplateWidget` class. Then add a corresponding HTML template and place it in the `web/templates` directory. The HTML file uses the [Mustache](https://mustache.github.io/) template language. You set your template parameters by updating the `values` field of your widget class. The values are converted to `String` objects before being passed to the template. This makes it possible to nest widgets, similarly to how widgets work in Flutter.

```dart
class MyPageWidget extends TemplateWidget {
  MyPageWidget({required String title}) : super(name: 'my_page') {
    values = {
      'title': title,
    };
  }
}
```

:::info

In the future, we plan to add a widget library to Serverpod with widgets corresponding to the standard widgets used by Flutter, such as Column, Row, Padding, Container, etc. This would make it possible to render server-side widgets with similar code used within Flutter.

:::

## Special widgets and routes

Serverpod comes with a few useful special widgets and routes you can use out of the box. When returning these special widget types, Serverpod's web server will automatically set the correct HTTP status codes and content types.

- `ListWidget` concatenates a list of other widgets into a single widget.
- `JsonWidget` renders a JSON document from a serializable structure of maps, lists, and basic values.
- `RedirectWidget` creates a redirect to another URL.

To serve a static directory, use the `StaticRoute.directory()` method. Serverpod will set the correct content types for most file types automatically.

:::caution

Static files are configured to be cached hard by the web browser and through Cloudfront's content delivery network (if you use the AWS deployment). If you change static files, they will need to be renamed, or users will most likely access old files. To make this easier, you can add a version number when referencing the static files. The version number will be ignored when looking up the actual file. E.g., `/static/my_image@v42.png` will serve to the `/static/my_image.png` file. More advanced cache management will be coming to a future version of Serverpod.

:::

## Database access and logging

The web server passes a `Session` object to the `WidgetRoute` class' `build` method. This gives you access to all the features you typically get from a standard method call to an endpoint. Use the database, logging, or caching the same way you would in a method call.

## Advanced routing

### Custom Route classes

While `WidgetRoute` is convenient for rendering HTML pages, you can also create custom `Route` subclasses for more control over the response. This is useful for REST APIs, file downloads, or custom response handling.

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

### HTTP methods

Routes can specify which HTTP methods they respond to using the `methods` parameter. The available methods are:

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

### Path parameters

Routes support named path parameters using the `:paramName` syntax. These are automatically extracted and made available through the `Request` object:

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

### Wildcards

Routes also support wildcard matching for catching all paths:

```dart
// Single-level wildcard - matches /item/foo but not /item/foo/bar
pod.webServer.addRoute(ItemRoute(), '/item/*');

// Multi-level wildcard - matches /item/foo and /item/foo/bar/baz
pod.webServer.addRoute(ItemRoute(), '/item/**');
```

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

### Fallback routes

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

### Modular routes with injectIn

For complex applications, you can create modular route classes that register multiple sub-routes by overriding the `injectIn` method. This allows you to organize related routes into reusable modules.

When you call `pod.webServer.addRoute(route, path)`, Serverpod calls `route.injectIn(router)` on a router group for the specified path. By overriding `injectIn`, you can register multiple routes instead of just one.

#### Creating a CRUD module

Here's an example of a modular CRUD route that registers multiple endpoints with path parameters:

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
Path parameters are accessed using symbols: `request.pathParameters[#paramName]`. Always validate and parse these values since they come from user input as strings.
:::

#### Composing multiple modules

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
- **Separate concerns** - Keep route registration logic separate from handler implementation

:::tip
When overriding `injectIn`, you typically don't need to implement `handleCall` since you're registering handler functions directly with the router. You can throw `UnimplementedError` in `handleCall` to make it clear the method isn't used.
:::

## Middleware

Middleware allows you to add cross-cutting functionality to your web server, such as authentication, logging, CORS handling, or request validation. Middleware functions wrap your route handlers, executing code before and after the request is processed.

### Adding middleware

Use the `addMiddleware` method to apply middleware to specific path prefixes:

```dart
// Apply to all routes
pod.webServer.addMiddleware(loggingMiddleware, '/');

// Apply only to API routes
pod.webServer.addMiddleware(authMiddleware, '/api');
```

### Creating custom middleware

Middleware is a function that takes a `Handler` and returns a new `Handler`. Here's a simple logging middleware example:

```dart
Handler loggingMiddleware(Handler innerHandler) {
  return (Request request) async {
    final start = DateTime.now();
    print('→ ${request.method.name.toUpperCase()} ${request.url.path}');
    
    // Call the next handler in the chain
    final response = await innerHandler(request);
    
    final duration = DateTime.now().difference(start);
    print('← ${response.statusCode} (${duration.inMilliseconds}ms)');
    
    return response;
  };
}
```

### Authentication middleware

A common use case is adding authentication to protected routes:

```dart
Handler authMiddleware(Handler innerHandler) {
  return (Request request) async {
    // Check for authentication token
    final authHeader = request.headers.authorization;
    
    if (authHeader == null) {
      return Response.unauthorized(
        body: Body.fromString('Authentication required'),
      );
    }
    
    // Verify token (simplified example)
    final token = authHeader.headerValue;
    if (!await verifyToken(token)) {
      return Response.forbidden(
        body: Body.fromString('Invalid token'),
      );
    }
    
    // Continue to the next handler
    return await innerHandler(request);
  };
}

// Apply to protected routes
pod.webServer.addMiddleware(authMiddleware, '/admin');
```

### CORS middleware

Enable Cross-Origin Resource Sharing for your API:

```dart
Handler corsMiddleware(Handler innerHandler) {
  return (Request request) async {
    // Handle preflight requests
    if (request.method == Method.options) {
      return Response.ok(
        headers: Headers.build((h) {
          h.set('Access-Control-Allow-Origin', '*');
          h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
          h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }),
      );
    }
    
    // Process the request
    final response = await innerHandler(request);
    
    // Add CORS headers to response
    return response.change(
      headers: Headers.build((h) {
        h.set('Access-Control-Allow-Origin', '*');
      }),
    );
  };
}

pod.webServer.addMiddleware(corsMiddleware, '/api');
```

### Middleware execution order

Middleware is applied based on path hierarchy, with more specific paths taking precedence. Within the same path, middleware executes in the order it was registered:

```dart
pod.webServer.addMiddleware(loggingMiddleware, '/');      // Executes first (outer)
pod.webServer.addMiddleware(authMiddleware, '/api');      // Executes second (inner) for /api routes
pod.webServer.addMiddleware(rateLimitMiddleware, '/api'); // Executes third (innermost) for /api routes
```

For a request to `/api/users`, the execution order is:
1. `loggingMiddleware` (before)
2. `authMiddleware` (before)
3. `rateLimitMiddleware` (before)
4. Your route handler
5. `rateLimitMiddleware` (after)
6. `authMiddleware` (after)
7. `loggingMiddleware` (after)

### Using ContextProperty for request-scoped data

Instead of modifying the request object, use `ContextProperty` to attach data that middleware or routes can access:

```dart
final userProperty = ContextProperty<User>();

Handler authMiddleware(Handler innerHandler) {
  return (Request request) async {
    final token = request.headers.authorization?.headerValue;
    final user = await getUserFromToken(token);
    
    // Attach user to request context
    userProperty[request] = user;
    
    return await innerHandler(request);
  };
}

// Access in your route
class UserProfileRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    final user = userProperty[request]; // Get the authenticated user
    
    return Response.ok(
      body: Body.fromString('Hello, ${user.name}!'),
    );
  }
}
```

### Built-in logging middleware

Serverpod re-exports Relic's built-in `logRequests()` middleware for convenient request logging:

```dart
import 'package:serverpod/serverpod.dart';

pod.webServer.addMiddleware(logRequests(), '/');
```

This logs all requests with method, path, status code, and response time.
