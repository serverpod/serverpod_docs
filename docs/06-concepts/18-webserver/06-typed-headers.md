# Typed headers

HTTP headers are traditionally accessed as strings, which means you need to
manually parse values, handle edge cases, and validate formats. Serverpod's web
server (via Relic) provides a better approach: typed headers that automatically
parse header values into strongly-typed Dart objects.

For example, instead of parsing `Authorization: Bearer abc123` as a string and
extracting the token yourself, you can access `request.headers.authorization` to
get a `BearerAuthorizationHeader` object with the token already parsed and
validated. This eliminates boilerplate code, catches errors early, and makes
your code more maintainable.

## Reading typed headers

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

## Setting typed headers

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

:::tip Best Practices

- Use typed headers for automatic parsing and validation
- Set appropriate cache headers for better performance
- Use `secure: true` and `httpOnly: true` for sensitive cookies
- Set proper `ContentDisposition` headers for file downloads
- Use `SameSite` cookie attribute for CSRF protection

:::

## Creating custom typed headers

While Relic provides typed headers for all standard HTTP headers, your
application may use custom headers for API versioning, feature flags, or
application-specific metadata. Rather than falling back to string-based access
for these custom headers, you can create your own typed headers using the same
pattern Relic uses internally.

Creating a custom typed header involves three steps: defining the header class
with parsing logic, creating a codec for serialization, and setting up a
`HeaderAccessor` for type-safe access. Once configured, your custom headers work
just like the built-in ones, with automatic parsing, validation, and convenient
property-style access.

Here's a complete example for a custom `X-API-Version` header:

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

### Using your custom header

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

### Optional: Add extension methods for convenient access

For better ergonomics, you can add extension methods to access your custom
headers with property syntax:

```dart
extension CustomHeadersEx on Headers {
  ApiVersionHeader? get apiVersion => apiVersionHeader[this]();
}

extension CustomMutableHeadersEx on MutableHeaders {
  set apiVersion(ApiVersionHeader? value) => apiVersionHeader[this].set(value);
}
```

Now you can use property syntax instead of the bracket notation:

```dart
// Reading with property syntax
final version = request.headers.apiVersion;

// Setting with property syntax
return Response.ok(
  headers: Headers.build((h) {
    h.apiVersion = ApiVersionHeader(major: 2, minor: 1);
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

## Next steps

- Serve [static files](static-files) with caching and compression
- Add [middleware](middleware) for cross-cutting concerns
- Learn about [modular routes](modular-routes) for organizing complex APIs
