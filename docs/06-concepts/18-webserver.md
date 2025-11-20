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

### Static file cache-busting

When deploying static assets, browsers and CDNs (like CloudFront) cache files aggressively for performance. This means updated files may not be served to users unless you implement a cache-busting strategy.

Serverpod provides `CacheBustingConfig` to automatically version your static files:

```dart
final staticDir = Directory('web/static');

final cacheBustingConfig = CacheBustingConfig(
  mountPrefix: '/static',
  fileSystemRoot: staticDir,
  separator: '@',  // or use custom separator like '___'
);

pod.webServer.addRoute(
  StaticRoute.directory(
    staticDir,
    cacheBustingConfig: cacheBustingConfig,
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: 31536000),
  ),
  '/static/**',
);
```

**Generating versioned URLs:**

Use the `assetPath()` method to generate cache-busted URLs for your assets:

```dart
// In your route handler
final imageUrl = await cacheBustingConfig.assetPath('/static/logo.png');
// Returns: /static/logo@<hash>.png

// Pass to your template
return MyPageWidget(logoUrl: imageUrl);
```

The cache-busting system:
- Automatically generates content-based hashes for asset versioning
- Allows custom separators (default `@`, but you can use `___` or any other)
- Preserves file extensions
- Works transparently - requesting `/static/logo@abc123.png` serves `/static/logo.png`

**Combining with cache control:**

For optimal performance, combine cache-busting with aggressive caching:

```dart
pod.webServer.addRoute(
  StaticRoute.directory(
    staticDir,
    cacheBustingConfig: cacheBustingConfig,
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: 31536000), // 1 year
  ),
  '/static/**',
);
```

This approach ensures:
- Browsers cache files for a long time (better performance)
- When files change, new hashes force cache invalidation
- No manual version management needed

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

// Tail-match wildcard - matches /item/foo and /item/foo/bar/baz
pod.webServer.addRoute(ItemRoute(), '/item/**');
```

:::info Performance Guarantee
The `/**` wildcard is a **tail-match** pattern and can only appear at the end of a route path (e.g., `/static/**`). Patterns like `/a/**/b` are not supported. This design ensures O(h) route lookup performance, where h is the path length, without backtracking. This keeps routing fast and predictable, even with many routes.
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

### Request-scoped data with ContextProperty

`ContextProperty<T>` provides a type-safe way to attach data to a `Request` object that can be accessed by downstream middleware and route handlers. This is the recommended pattern for passing computed or authenticated data through your request pipeline.

#### Why use ContextProperty?

Instead of modifying the `Request` object directly (which you can't do since it's immutable), `ContextProperty` allows you to associate additional data with a request. Common use cases include:

- **Authentication** - Attach the authenticated user to the request
- **Rate limiting** - Store rate limit state per request
- **Request ID tracking** - Add correlation IDs for logging
- **Tenant identification** - Multi-tenant application context
- **Feature flags** - Request-specific feature toggles

#### Creating a ContextProperty

Define a `ContextProperty` as a top-level constant or static field:

```dart
// Define a property for the authenticated user
final userProperty = ContextProperty<UserInfo>();

// Define a property for request ID
final requestIdProperty = ContextProperty<String>();

// Optional: with a default value
final featureFlagsProperty = ContextProperty<FeatureFlags>(
  defaultValue: () => FeatureFlags.defaults(),
);
```

#### Setting values in middleware

Middleware can set values on the context property, making them available to all downstream handlers:

```dart
final userProperty = ContextProperty<UserInfo>();

Handler authMiddleware(Handler innerHandler) {
  return (Request request) async {
    // Extract and verify token
    final token = request.headers.authorization?.headerValue;
    
    if (token == null) {
      return Response.unauthorized(
        body: Body.fromString('Authentication required'),
      );
    }
    
    // Validate token and get user info
    final user = await getUserFromToken(token);
    
    if (user == null) {
      return Response.forbidden(
        body: Body.fromString('Invalid token'),
      );
    }
    
    // Attach user to request context
    userProperty[request] = user;
    
    // Continue to next handler with user attached
    return await innerHandler(request);
  };
}
```

#### Accessing values in routes

Route handlers can retrieve the value from the context property:

```dart
class UserProfileRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Get the authenticated user from context
    final user = userProperty[request];
    
    return Response.ok(
      body: Body.fromString(
        jsonEncode({
          'id': user.id,
          'name': user.name,
          'email': user.email,
        }),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

#### Safe access with getOrNull

If a value might not be set, use `getOrNull()` to avoid exceptions:

```dart
class OptionalAuthRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Safely get user, returns null if not authenticated
    final user = userProperty.getOrNull(request);
    
    if (user != null) {
      return Response.ok(
        body: Body.fromString('Hello, ${user.name}!'),
      );
    } else {
      return Response.ok(
        body: Body.fromString('Hello, guest!'),
      );
    }
  }
}
```

#### Complete authentication example

Here's a complete example showing authentication middleware with context properties:

```dart
// Define the user info class
class UserInfo {
  final int id;
  final String name;
  final String email;
  final List<String> roles;
  
  UserInfo({
    required this.id,
    required this.name,
    required this.email,
    required this.roles,
  });
}

// Define the context property
final userProperty = ContextProperty<UserInfo>();

// Authentication middleware
Handler authMiddleware(Handler innerHandler) {
  return (Request request) async {
    final authHeader = request.headers.authorization;
    
    if (authHeader == null) {
      return Response.unauthorized(
        body: Body.fromString('Missing authorization header'),
      );
    }
    
    // Extract bearer token
    final token = authHeader.headerValue;
    if (!token.startsWith('Bearer ')) {
      return Response.unauthorized(
        body: Body.fromString('Invalid authorization format'),
      );
    }
    
    final bearerToken = token.substring(7);
    
    // Validate token and get user (implement your own logic)
    final session = request.session;
    final user = await validateTokenAndGetUser(session, bearerToken);
    
    if (user == null) {
      return Response.forbidden(
        body: Body.fromString('Invalid or expired token'),
      );
    }
    
    // Attach user to context
    userProperty[request] = user;
    
    return await innerHandler(request);
  };
}

// Role-checking middleware
Handler requireRole(String role) {
  return (Handler innerHandler) {
    return (Request request) async {
      final user = userProperty[request];
      
      if (!user.roles.contains(role)) {
        return Response.forbidden(
          body: Body.fromString('Insufficient permissions'),
        );
      }
      
      return await innerHandler(request);
    };
  };
}

// Usage in your server
pod.webServer.addMiddleware(authMiddleware, '/api');
pod.webServer.addMiddleware(requireRole('admin'), '/api/admin');

// Routes automatically have access to the user
class UserDashboardRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    final user = userProperty[request];
    
    // Fetch user-specific data
    final data = await fetchDashboardData(session, user.id);
    
    return Response.ok(
      body: Body.fromString(
        jsonEncode(data),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

#### Multiple context properties

You can use multiple context properties for different types of data:

```dart
final userProperty = ContextProperty<UserInfo>();
final requestIdProperty = ContextProperty<String>();
final tenantProperty = ContextProperty<String>();

Handler requestContextMiddleware(Handler innerHandler) {
  return (Request request) async {
    // Generate and attach request ID
    final requestId = Uuid().v4();
    requestIdProperty[request] = requestId;
    
    // Extract tenant from subdomain or header
    final tenant = extractTenant(request);
    tenantProperty[request] = tenant;
    
    return await innerHandler(request);
  };
}

// Later in your route
class TenantDataRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    final user = userProperty[request];
    final requestId = requestIdProperty[request];
    final tenant = tenantProperty[request];
    
    session.log('Request $requestId for tenant $tenant by user ${user.id}');
    
    // Fetch tenant-specific data
    final data = await fetchTenantData(session, tenant, user.id);
    
    return Response.ok(
      body: Body.fromString(jsonEncode(data), mimeType: MimeType.json),
    );
  }
}
```

:::tip Best Practices
- Define `ContextProperty` instances as top-level constants or static fields
- Use descriptive names for your properties (e.g., `userProperty`, not just `user`)
- Use `getOrNull()` when the value might not be set
- Set properties in middleware, not in routes
- Use specific types for better type safety
:::

### Built-in logging middleware

Serverpod re-exports Relic's built-in `logRequests()` middleware for convenient request logging:

```dart
import 'package:serverpod/serverpod.dart';

pod.webServer.addMiddleware(logRequests(), '/');
```

This logs all requests with method, path, status code, and response time.

## Typed headers

Serverpod's web server (via Relic) provides a type-safe header system that goes beyond simple string-based HTTP headers. Instead of working with raw strings, you can access and set HTTP headers using strongly-typed Dart objects with automatic parsing and validation.

### Reading typed headers

Access typed headers through extension methods on `request.headers`:

```dart
class ApiRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Type-safe accessors return parsed objects or null
    final auth = request.headers.authorization;          // AuthorizationHeader?
    final contentType = request.headers.contentType;      // ContentTypeHeader?
    final cookies = request.headers.cookie;               // CookieHeader?
    final userAgent = request.headers.userAgent;          // String?
    final host = request.headers.host;                    // HostHeader?
    
    // Raw string access is also available for any header
    final authRaw = request.headers['Authorization'];     // Iterable<String>?
    final custom = request.headers['X-Custom-Header'];    // Iterable<String>?
    
    return Response.ok();
  }
}
```

Common request headers include:
- `authorization` - AuthorizationHeader (Bearer/Basic/Digest)
- `contentType` - ContentTypeHeader
- `contentLength` - int
- `cookie` - CookieHeader
- `accept` - AcceptHeader (media types)
- `acceptEncoding` - AcceptEncodingHeader
- `acceptLanguage` - AcceptLanguageHeader
- `userAgent` - String
- `host` - HostHeader
- `referer` - Uri
- `origin` - Uri

### Setting typed headers

Set typed headers in responses using the `Headers.build()` builder pattern:

```dart
return Response.ok(
  headers: Headers.build((h) {
    h.cacheControl = CacheControlHeader(
      maxAge: 3600,
      publicCache: true,
    );
    h.contentType = ContentTypeHeader(
      mimeType: MimeType.json,
      charset: 'utf-8',
    );
    
    // Set custom headers (raw)
    h['X-API-Version'] = ['2.0'];
  }),
  body: Body.fromString(jsonEncode(data)),
);
```

Common response headers include:
- `cacheControl` - CacheControlHeader
- `setCookie` - SetCookieHeader
- `location` - Uri
- `contentDisposition` - ContentDispositionHeader
- `etag` - ETagHeader
- `vary` - VaryHeader

### AuthorizationHeader - Authentication

The `AuthorizationHeader` supports three authentication schemes:

**Bearer Token (JWT, OAuth):**
```dart
final auth = request.headers.authorization;

if (auth is BearerAuthorizationHeader) {
  final token = auth.token;  // The actual token string
  
  // Validate token
  if (!await validateToken(token)) {
    return Response.unauthorized();
  }
}
```

**Basic Authentication:**
```dart
if (auth is BasicAuthorizationHeader) {
  final username = auth.username;
  final password = auth.password;
  
  // Validate credentials
  if (!await validateCredentials(username, password)) {
    return Response.unauthorized();
  }
}
```

**Setting Bearer token:**
```dart
headers: Headers.build((h) {
  h.authorization = BearerAuthorizationHeader(token: 'eyJhbGc...');
}),
```

### CacheControlHeader - Cache directives

Control caching behavior with type-safe cache directives:

```dart
// Public cache with 1 hour expiration
headers: Headers.build((h) {
  h.cacheControl = CacheControlHeader(
    maxAge: 3600,                  // Cache for 1 hour
    publicCache: true,             // Shared cache allowed
    mustRevalidate: true,          // Must revalidate after expiry
    staleWhileRevalidate: 86400,   // Can use stale for 1 day while revalidating
  );
}),
```

```dart
// Secure defaults for sensitive data
headers: Headers.build((h) {
  h.cacheControl = CacheControlHeader(
    noStore: true,      // Don't store anywhere
    noCache: true,      // Must revalidate
    privateCache: true, // Only private cache
  );
}),
```

Available directives:
- `noCache`, `noStore` - Cache control flags
- `maxAge`, `sMaxAge` - Seconds of freshness
- `mustRevalidate`, `proxyRevalidate` - Revalidation requirements
- `publicCache`, `privateCache` - Cache scope
- `staleWhileRevalidate`, `staleIfError` - Stale caching
- `immutable` - Content never changes

### ContentDispositionHeader - File downloads

Specify how content should be handled (inline display or download):

```dart
// File download with proper filename
headers: Headers.build((h) {
  h.contentDisposition = ContentDispositionHeader(
    type: 'attachment',
    parameters: [
      ContentDispositionParameter(name: 'filename', value: 'report.pdf'),
    ],
  );
}),
```

```dart
// With extended encoding (RFC 5987) for non-ASCII filenames
h.contentDisposition = ContentDispositionHeader(
  type: 'attachment',
  parameters: [
    ContentDispositionParameter(
      name: 'filename',
      value: 'rapport.pdf',
      isExtended: true,
      encoding: 'UTF-8',
    ),
  ],
);
```

### CookieHeader and SetCookieHeader - Cookies

**Reading cookies from requests:**
```dart
final cookieHeader = request.headers.cookie;

if (cookieHeader != null) {
  // Find a specific cookie
  final sessionId = cookieHeader.getCookie('session_id')?.value;
  
  // Iterate all cookies
  for (final cookie in cookieHeader.cookies) {
    print('${cookie.name}=${cookie.value}');
  }
}
```

**Setting cookies in responses:**
```dart
headers: Headers.build((h) {
  h.setCookie = SetCookieHeader(
    name: 'session_id',
    value: '12345abcde',
    maxAge: 3600,                    // 1 hour
    path: Uri.parse('/'),
    domain: Uri.parse('example.com'),
    secure: true,                    // HTTPS only
    httpOnly: true,                  // No JavaScript access
    sameSite: SameSite.strict,       // CSRF protection
  );
}),
```

SameSite values:
- `SameSite.lax` - Default, not sent on cross-site requests (except navigation)
- `SameSite.strict` - Never sent on cross-site requests
- `SameSite.none` - Sent on all requests (requires `secure: true`)

### Complete examples

**Secure API with authentication and caching:**
```dart
class SecureApiRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Check authorization
    final auth = request.headers.authorization;
    if (auth is! BearerAuthorizationHeader) {
      return Response.unauthorized();
    }
    
    // Validate token
    if (!await validateToken(auth.token)) {
      return Response.forbidden();
    }
    
    // Return data with cache headers
    return Response.ok(
      headers: Headers.build((h) {
        h.cacheControl = CacheControlHeader(
          maxAge: 300,           // 5 minutes
          publicCache: true,
          mustRevalidate: true,
        );
        h.contentType = ContentTypeHeader(
          mimeType: MimeType.json,
          charset: 'utf-8',
        );
      }),
      body: Body.fromString(jsonEncode(data)),
    );
  }
}
```

**File download with proper headers:**
```dart
class DownloadRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    final fileId = request.pathParameters[#fileId];
    final file = await getFile(session, fileId);
    
    return Response.ok(
      headers: Headers.build((h) {
        h.contentDisposition = ContentDispositionHeader(
          type: 'attachment',
          parameters: [
            ContentDispositionParameter(
              name: 'filename',
              value: file.name,
              isExtended: true,
              encoding: 'UTF-8',
            ),
          ],
        );
        h.contentType = ContentTypeHeader(
          mimeType: file.mimeType,
        );
        h.cacheControl = CacheControlHeader(
          noCache: true,
          mustRevalidate: true,
        );
      }),
      body: Body.fromBytes(file.content),
    );
  }
}
```

**Cookie-based sessions:**
```dart
class LoginRoute extends Route {
  LoginRoute() : super(methods: {Method.post});

  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Authenticate user...
    final sessionToken = await authenticateAndCreateSession(session, request);
    
    return Response.ok(
      headers: Headers.build((h) {
        h.setCookie = SetCookieHeader(
          name: 'session_id',
          value: sessionToken,
          maxAge: 86400,           // 24 hours
          path: Uri.parse('/'),
          secure: true,            // HTTPS only
          httpOnly: true,          // No JavaScript access
          sameSite: SameSite.lax,  // CSRF protection
        );
      }),
      body: Body.fromString(
        jsonEncode({'status': 'logged_in'}),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

:::tip Best Practices
- Use typed headers for automatic parsing and validation
- Set appropriate cache headers for better performance
- Use `secure: true` and `httpOnly: true` for sensitive cookies
- Set proper `ContentDisposition` headers for file downloads
- Use `SameSite` cookie attribute for CSRF protection
:::

### Creating custom typed headers

You can create your own typed headers by defining a header class and a `HeaderAccessor`. Here's a simple example for a custom `X-API-Version` header:

```dart
// Define your typed header class
final class ApiVersionHeader {
  final int major;
  final int minor;

  ApiVersionHeader({required this.major, required this.minor});

  // Parse from string format "1.2"
  factory ApiVersionHeader.parse(String value) {
    final parts = value.split('.');
    if (parts.length != 2) {
      throw const FormatException('Invalid API version format');
    }
    
    final major = int.tryParse(parts[0]);
    final minor = int.tryParse(parts[1]);
    
    if (major == null || minor == null) {
      throw const FormatException('Invalid API version numbers');
    }
    
    return ApiVersionHeader(major: major, minor: minor);
  }

  // Encode to string format
  String encode() => '$major.$minor';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ApiVersionHeader &&
          major == other.major &&
          minor == other.minor;

  @override
  int get hashCode => Object.hash(major, minor);

  @override
  String toString() => 'ApiVersionHeader($major.$minor)';
}

// Create a HeaderCodec for encoding/decoding
const _apiVersionCodec = HeaderCodec.single(
  ApiVersionHeader.parse,
  (ApiVersionHeader value) => [value.encode()],
);

// Create a global HeaderAccessor
const apiVersionHeader = HeaderAccessor(
  'x-api-version',
  _apiVersionCodec,
);
```

**Using your custom header:**

```dart
// Reading the header
class ApiRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    final version = apiVersionHeader[request.headers]();
    
    if (version != null && version.major < 2) {
      return Response.badRequest(
        body: Body.fromString('API version 2.0 or higher required'),
      );
    }
    
    return Response.ok();
  }
}

// Setting the header
return Response.ok(
  headers: Headers.build((h) {
    apiVersionHeader[h].set(ApiVersionHeader(major: 2, minor: 1));
  }),
);
```

**Multi-value header example:**

For headers that can have multiple comma-separated values:

```dart
final class CustomTagsHeader {
  final List<String> tags;

  CustomTagsHeader({required List<String> tags})
      : tags = List.unmodifiable(tags);

  // Parse from multiple values or comma-separated
  factory CustomTagsHeader.parse(Iterable<String> values) {
    final allTags = values
        .expand((v) => v.split(','))
        .map((t) => t.trim())
        .where((t) => t.isNotEmpty)
        .toSet()
        .toList();
    
    if (allTags.isEmpty) {
      throw const FormatException('Tags cannot be empty');
    }
    
    return CustomTagsHeader(tags: allTags);
  }

  List<String> encode() => [tags.join(', ')];

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CustomTagsHeader &&
          const ListEquality().equals(tags, other.tags);

  @override
  int get hashCode => const ListEquality().hash(tags);
}

// Use HeaderCodec (not HeaderCodec.single) for multi-value
const _customTagsCodec = HeaderCodec(
  CustomTagsHeader.parse,
  (CustomTagsHeader value) => value.encode(),
);

const customTagsHeader = HeaderAccessor(
  'x-custom-tags',
  _customTagsCodec,
);
```

**Optional: Add extension methods for convenient access**

For better ergonomics, you can add extension methods to access your custom headers with property syntax:

```dart
extension CustomHeadersEx on Headers {
  ApiVersionHeader? get apiVersion => apiVersionHeader[this]();
  CustomTagsHeader? get customTags => customTagsHeader[this]();
}

extension CustomMutableHeadersEx on MutableHeaders {
  set apiVersion(ApiVersionHeader? value) => apiVersionHeader[this].set(value);
  set customTags(CustomTagsHeader? value) => customTagsHeader[this].set(value);
}
```

Now you can use property syntax instead of the bracket notation:

```dart
// Reading with property syntax
final version = request.headers.apiVersion;
final tags = request.headers.customTags;

// Setting with property syntax
return Response.ok(
  headers: Headers.build((h) {
    h.apiVersion = ApiVersionHeader(major: 2, minor: 1);
    h.customTags = CustomTagsHeader(tags: ['production', 'v2']);
  }),
);
```

**Key points:**

- Use `HeaderCodec.single()` when your header has only one value
- Use `HeaderCodec()` when your header can have multiple comma-separated values
- Define the `HeaderAccessor` as a global `const`
- Throw `FormatException` for invalid header values
- Implement `==` and `hashCode` for value equality
- The `HeaderAccessor` automatically caches parsed values for performance
- Optionally add extension methods for convenient property-style access
