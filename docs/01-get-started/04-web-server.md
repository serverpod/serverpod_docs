---
sidebar_label: 4. Working with the web server
---

# Working with the web server

In addition to endpoints for your Flutter app, Serverpod includes a built-in web server for REST APIs, static files, and webhooks. This is useful when you need to integrate with third-party services, serve web pages, or provide public APIs. The web server gives you full access to your database and business logic through the `Session` object, just like regular endpoints.

:::info
The web server is built on the [Relic](https://github.com/serverpod/relic) framework, which provides routing, middleware, typed headers, and more. You get the benefits of Serverpod's database integration combined with Relic's web server capabilities.
:::

## Building a REST API

Let's create a complete REST API for managing recipes with support for listing, creating, retrieving, and deleting recipes. Create a new file `magic_recipe_server/lib/src/routes/recipe_route.dart`:

```dart
import 'dart:convert';
import 'package:serverpod/serverpod.dart';

class RecipeRoute extends Route {
  // Specify which HTTP methods this route accepts
  RecipeRoute() : super(methods: {Method.get, Method.post, Method.delete});

  // Override injectIn to register multiple handler functions for different paths
  // This is called "modular routing" and lets you organize related endpoints together
  @override
  void injectIn(RelicRouter router) {
    router
      ..get('/', _list)           // GET /api/recipes
      ..get('/:id', _get)         // GET /api/recipes/123
      ..post('/', _create)        // POST /api/recipes
      ..delete('/:id', _delete);  // DELETE /api/recipes/123
  }

  Future<Result> _list(Request request) async {
    // Access the Session through request.session (modular routes only get Request)
    final recipes = await Recipe.db.find(request.session, limit: 10);
    
    return Response.ok(
      body: Body.fromString(
        jsonEncode({'recipes': recipes.map((r) => r.toJson()).toList()}),
        mimeType: MimeType.json,  // Set proper content type
      ),
    );
  }

  Future<Result> _get(Request request) async {
    // Path parameters are accessed using symbols: pathParameters[#id]
    final id = int.tryParse(request.pathParameters[#id] ?? '');
    if (id == null) return Response.badRequest();

    final recipe = await Recipe.db.findById(request.session, id);
    
    // Return different status codes based on the result
    if (recipe == null) return Response.notFound();

    return Response.ok(
      body: Body.fromString(jsonEncode(recipe.toJson()), mimeType: MimeType.json),
    );
  }

  Future<Result> _create(Request request) async {
    // Read and parse the request body
    final data = jsonDecode(await request.readAsString());
    final recipe = Recipe(
      title: data['title'],
      ingredients: data['ingredients'],
    );
    await Recipe.db.insertRow(request.session, recipe);

    // Return 201 Created with the new resource
    return Response.created(
      body: Body.fromString(jsonEncode(recipe.toJson()), mimeType: MimeType.json),
    );
  }

  Future<Result> _delete(Request request) async {
    final id = int.tryParse(request.pathParameters[#id] ?? '');
    if (id == null) return Response.badRequest();

    await Recipe.db.deleteRow(request.session, id);
    
    // 204 No Content is appropriate for successful DELETE
    return Response.noContent();
  }

  // When using injectIn, handleCall is not used
  @override
  Future<Result> handleCall(Session session, Request request) async {
    throw UnimplementedError('Uses injectIn');
  }
}
```

Register the route in your `server.dart` file before calling `pod.start()`:

```dart
// Add your web routes here
pod.webServer.addRoute(RecipeRoute(), '/api/recipes');

await pod.start();
```

This creates a complete CRUD API:

- `GET /api/recipes` - List all recipes
- `GET /api/recipes/123` - Get a specific recipe by ID
- `POST /api/recipes` - Create a new recipe
- `DELETE /api/recipes/123` - Delete a recipe

You can test it with curl:

```bash
# List recipes
curl http://localhost:8080/api/recipes

# Get a specific recipe
curl http://localhost:8080/api/recipes/1

# Create a new recipe
curl -X POST http://localhost:8080/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title":"Pasta","ingredients":"Tomatoes, pasta, basil"}'

# Delete a recipe
curl -X DELETE http://localhost:8080/api/recipes/1
```

## Middleware for cross-cutting concerns

Middleware lets you add functionality that applies to multiple routes, like logging, authentication, or error handling. Middleware functions wrap your route handlers and can inspect or modify requests and responses.

```dart
// Add this before your route registrations
Handler loggingMiddleware(Handler next) {
  return (Request request) async {
    final start = DateTime.now();
    print('→ ${request.method.name} ${request.url.path}');
    
    // Call the next handler in the chain
    final response = await next(request);
    
    final duration = DateTime.now().difference(start);
    print('← ${response.statusCode} (${duration.inMilliseconds}ms)');
    
    return response;
  };
}

// Apply to all routes
pod.webServer.addMiddleware(loggingMiddleware, '/');
```

You can add multiple middleware functions and scope them to specific paths:

```dart
// Only apply to API routes
pod.webServer.addMiddleware(authenticationMiddleware, '/api');
```

## Serving static files

For serving CSS, JavaScript, images, and other static assets, use `StaticRoute`:

```dart
import 'dart:io';

// Serve files from the web/static directory
pod.webServer.addRoute(
  StaticRoute.directory(
    Directory('web/static'),
    // Optional: set cache control for better performance
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: 31536000),
  ),
  '/static/**',  // The /** wildcard matches all paths under /static/
);
```

Now files in `web/static/` are accessible at `/static/`:

- `web/static/logo.png` → `http://localhost:8080/static/logo.png`
- `web/static/css/style.css` → `http://localhost:8080/static/css/style.css`

## Advanced features

The web server includes many more features for production-ready APIs:

**Typed headers** - Access headers in a type-safe way instead of raw strings:

```dart
// Instead of: request.headers['Authorization']
final auth = request.headers.authorization;  // Returns AuthorizationHeader?
if (auth is BearerAuthorizationHeader) {
  final token = auth.token;  // Automatically parsed
}
```

**ContextProperty** - Attach request-scoped data that middleware can set and routes can read:

```dart
final requestIdProperty = ContextProperty<String>();

// In middleware: attach a request ID
requestIdProperty[request] = Uuid().v4();

// In route: access the request ID
final requestId = requestIdProperty[request];
```

**Webhooks** - Handle incoming webhooks from third-party services by validating signatures and processing events.

**Cache-busting** - Automatically version static assets with content hashes for optimal caching.

See the full [Web Server documentation](../concepts/webserver/overview) for details on [routing](../concepts/webserver/routing), [middleware](../concepts/webserver/middleware), [typed headers](../concepts/webserver/typed-headers), [static files](../concepts/webserver/static-files), and more.
