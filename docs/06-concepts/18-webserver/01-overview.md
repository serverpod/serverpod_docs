# Web Server Overview

In addition to the application server, Serverpod comes with a built-in web server. The web server allows you to access your database and business layer the same way you would from a method call from an app. This makes it simple to share data for applications that need both an app and traditional web pages. You can also use the web server to create webhooks or define custom REST APIs to communicate with third-party services.

Serverpod's web server is built on the [Relic](https://github.com/serverpod/relic) framework, giving you access to its routing engine, middleware system, and typed headers. This means you get the benefits of Serverpod's database integration and business logic alongside Relic's web server capabilities.

## Your First Route

When you create a new Serverpod project, it sets up a web server by default. Here's how to add a simple API endpoint:

```dart
import 'package:serverpod/serverpod.dart';

class HelloRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    return Response.ok(
      body: Body.fromString(
        jsonEncode({'message': 'Hello from Serverpod!'}),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

Register the route in your `server.dart` file before starting the server:

```dart
pod.webServer.addRoute(HelloRoute(), '/api/hello');
await pod.start();
```

Visit `http://localhost:8080/api/hello` to see your API response.

## Core Concepts

### Routes and Handlers

A **Route** is a destination in your web server that handles requests and generates responses. Routes extend the `Route` base class and implement the `handleCall()` method:

```dart
class ApiRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Your logic here
    return Response.ok();
  }
}
```

The `handleCall()` method receives:
- **Session** - Access to your database, logging, and authenticated user
- **Request** - The HTTP request with headers, body, and URL information

### Response Types

Return different response types based on your needs:

```dart
// Success responses
return Response.ok(body: Body.fromString('Success'));
return Response.created(body: Body.fromString('Created'));
return Response.noContent();

// Error responses
return Response.badRequest(body: Body.fromString('Invalid input'));
return Response.unauthorized(body: Body.fromString('Not authenticated'));
return Response.notFound(body: Body.fromString('Not found'));
return Response.internalServerError(body: Body.fromString('Server error'));
```

### Adding Routes

Routes are added with a path pattern:

```dart
// Exact path
pod.webServer.addRoute(UserRoute(), '/api/users');

// Path with wildcard
pod.webServer.addRoute(StaticRoute.directory(Directory('web')), '/static/**');
```

Routes are matched in the order they were added.

## When to Use What

### REST APIs → Custom Routes
For REST APIs, webhooks, or custom HTTP handlers, use custom `Route` classes:

```dart
class UsersApiRoute extends Route {
  UsersApiRoute() : super(methods: {Method.get, Method.post});
  
  @override
  Future<Result> handleCall(Session session, Request request) async {
    if (request.method == Method.get) {
      // List users
    } else {
      // Create user
    }
  }
}
```

See [Routing](routing) for details.

### Static Files → StaticRoute
For serving CSS, JavaScript, images, or other static assets:

```dart
pod.webServer.addRoute(
  StaticRoute.directory(Directory('web/static')),
  '/static/**',
);
```

See [Static Files](static-files) for cache-busting and optimization.

### HTML Pages → External Frameworks
For server-side HTML rendering, consider integrating with [Jaspr](https://docs.page/schultek/jaspr) rather than using Serverpod's built-in HTML widgets. See [Server-Side HTML](server-side-html) for basic widget usage.

## Database Access

The `Session` parameter gives you full access to your Serverpod database:

```dart
class UserRoute extends Route {
  @override
  Future<Result> handleCall(Session session, Request request) async {
    // Query database
    final users = await User.db.find(session);
    
    // Use logging
    session.log('Retrieved ${users.length} users');
    
    return Response.ok(
      body: Body.fromString(
        jsonEncode(users.map((u) => u.toJson()).toList()),
        mimeType: MimeType.json,
      ),
    );
  }
}
```

## Next Steps

- **[Routing](routing)** - Learn about HTTP methods, path parameters, and wildcards
- **[Modular Routes](modular-routes)** - Organize related endpoints with `injectIn()`
- **[Middleware](middleware)** - Add cross-cutting functionality like error handling and logging
- **[Static Files](static-files)** - Serve static assets with cache-busting
- **[Typed Headers](typed-headers)** - Work with HTTP headers in a type-safe way
