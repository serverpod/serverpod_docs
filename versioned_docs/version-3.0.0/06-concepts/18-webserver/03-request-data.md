# Request Data

Once a route matches, you'll need to extract data from the request. Relic
provides type-safe accessors for path parameters, query parameters, headers,
and the request body.

## Path parameters

Access path parameters using typed `PathParam` accessors:

```dart
class UserRoute extends Route {
  static const _idParam = IntPathParam(#id);

  @override
  Future<Result> handleCall(Session session, Request request) async {
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
```

The `IntPathParam` combines the symbol (`#id`) with a parser, throwing if the
parameter is missing or not a valid integer. You can also access raw unparsed
values with `request.pathParameters.raw[#id]`.

## Query parameters

Query parameters (`?key=value`) use the same typed accessor pattern:

```dart
class SearchRoute extends Route {
  static const _pageParam = IntQueryParam('page');

  @override
  Future<Result> handleCall(Session session, Request request) async {
    int page = request.queryParameters.get(_pageParam); // typed access
    String? query = request.queryParameters.raw['query']; // raw access
    // ...
  }
}
```

## Headers

Access headers through `request.headers` with type-safe getters for standard
HTTP headers:

```dart
@override
Future<Result> handleCall(Session session, Request request) async {
  // Type-safe accessors for standard headers
  final userAgent = request.headers.userAgent;
  final contentLength = request.headers.contentLength;
  final auth = request.headers.authorization;

  // Raw access for custom headers
  final apiKey = request.headers['X-API-Key']?.first;

  // ...
}
```

## Body

Read the request body using the appropriate method for your content type:

```dart
@override
Future<Result> handleCall(Session session, Request request) async {
  // Read as string (for JSON, form data, etc.)
  final body = await request.readAsString();
  final data = jsonDecode(body);

  // Or read as stream for large uploads
  final stream = request.read();
  await for (final chunk in stream) {
    // Process chunk
  }

  // ...
}
```

:::warning
The body can only be read once. Attempting to read it again will throw a
`StateError`.
:::

For more details on typed parameters and headers, see the
[Relic documentation](https://docs.dartrelic.dev/).

## Next steps

- **[Middleware](middleware)** - Intercept and transform requests and responses
- **[Static Files](static-files)** - Serve static assets
- **[Server-side HTML](server-side-html)** - Render HTML dynamically on the server
