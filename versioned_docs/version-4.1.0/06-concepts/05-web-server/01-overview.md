---
description: Serverpod's built-in web server serves REST APIs, webhooks, static files, server-rendered HTML, and Flutter web apps alongside the API server.
---

# Overview

Serverpod comes with a built-in web server that runs beside the API server. It serves anything that speaks plain HTTP: REST APIs and webhooks, static files, server-rendered HTML with templates or [Jaspr](https://jaspr.site), and single-page apps including Flutter web. Web requests get the same [`Session`](../endpoints-and-apis/sessions) your endpoint methods receive, with full access to your database and business logic. The web server is built on the [Relic](https://github.com/serverpod/relic) framework, and its routing engine, middleware system, and typed headers are available directly.

The web server and the API server answer different callers. [Endpoints](../endpoints-and-apis) are the typed methods your own app calls through the generated client. Web server **routes** serve everyone else: browsers, webhooks, third-party services, and anything that needs a URL. If you are building a feature for your Flutter app, write an endpoint. If something outside your app needs to reach your server over HTTP, write a route.

## Your first route

New Serverpod projects set up the web server by default, with working web code in `lib/src/web/` and assets in `web/`. Here's how to add a simple JSON route:

```dart
import 'dart:convert';

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

Visit `http://localhost:8082/api/hello` to see your response. Port 8082 is the web server's default development port, configured per run mode in the [server configuration](../server-fundamentals/configuration).

:::info
If your project was created with the "None" web server option, the first use of `pod.webServer` throws `Bad state: Web server is disabled`. To enable it, add the `webServer` section to your `config/<run mode>.yaml` files and register at least one route before `pod.start()`. With a configuration but no routes, the web server simply does not start.
:::

## Core concepts

### Routes and handlers

A **route** is a destination in your web server that handles requests and generates responses. Routes extend the `Route` base class and implement the `handleCall()` method:

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

- **Session** - Access to your database, logging, and authenticated user. The web server creates a `WebCallSession` for each request and closes it when the response is sent.
- **Request** - The HTTP request with headers, body, and URL information.

By default, a route answers GET requests only. Pass `methods:` to the constructor to accept others:

```dart
class FormRoute extends Route {
  FormRoute() : super(methods: {Method.get, Method.post});
  // ...
}
```

A request with a method the route does not accept gets an automatic `405 Method Not Allowed` response.

### Response types

Each named `Response` constructor maps to an HTTP status code:

| Constructor | Status |
| --- | --- |
| `Response.ok` | 200 |
| `Response.noContent` | 204 |
| `Response.movedPermanently` | 301 |
| `Response.found` | 302 |
| `Response.seeOther` | 303 |
| `Response.notModified` | 304 |
| `Response.badRequest` | 400 |
| `Response.unauthorized` | 401 |
| `Response.forbidden` | 403 |
| `Response.notFound` | 404 |
| `Response.contentTooLarge` | 413 |
| `Response.internalServerError` | 500 |
| `Response.notImplemented` | 501 |

Status codes without a named constructor, such as `201 Created`, use the generic form: `Response(201, body: ...)`.

### Adding routes

Routes are added with a path pattern:

```dart
// Exact path
pod.webServer.addRoute(UserRoute(), '/api/users');

// Serve a directory (tail matching is automatic)
pod.webServer.addRoute(StaticRoute.directory(Directory('web')), '/static/');
```

Paths can contain parameters and wildcards, and requests are matched by specificity rather than registration order. See [Routing](routing) for the matching rules.

### Built-in routes

Every web server automatically answers the health probe paths `/livez`, `/readyz`, and `/startupz`. A healthy server responds with an empty `200 OK`, and deployment platforms use these paths to check that the server is alive. These paths are reserved, so avoid registering your own routes on them.

## When to use what

| You want to serve | Route type | Page |
| --- | --- | --- |
| REST APIs, webhooks, custom HTTP handlers | Your own `Route` subclass | [Routing](routing) |
| Static assets: CSS, JavaScript, images | `StaticRoute` | [Static files](static-files) |
| Server-rendered HTML, with templates or Jaspr | `WidgetRoute`, or a route rendering Jaspr | [Server-side HTML](server-side-html) |
| A single-page app with client-side routing | `SpaRoute` | [Single-page apps](single-page-apps) |
| Your Flutter app compiled for the web | `FlutterRoute` | [Flutter web](flutter-web) |

## Database access

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

## Going to production

When you deploy, the web server ships with the rest of your project. On [Serverpod Cloud](../../deployments/deploy-to-serverpod-cloud), it is served through a CDN that honors the cache headers your routes set. See [Content delivery and caching](/cloud/concepts/cdn) for how the two interact.

## Next steps

- **[Routing](routing)** - Match requests to handlers by method and URL pattern
- **[Request data](request-data)** - Access path parameters, query parameters, headers, and body
- **[Web server middleware](./web-server-middleware)** - Intercept and transform requests and responses
- **[Static files](static-files)** - Serve static assets
- **[Server-side HTML](server-side-html)** - Render HTML on the server with templates or Jaspr
- **[Single-page apps](single-page-apps)** - Serve SPAs with client-side routing
- **[Flutter web](flutter-web)** - Serve Flutter web applications
