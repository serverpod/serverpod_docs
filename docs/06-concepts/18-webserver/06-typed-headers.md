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

## Authorizationheader - authentication

The `AuthorizationHeader` supports three authentication schemes:

### Bearer token (jwt, oauth)

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

### Basic authentication

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

### Setting bearer token

```dart
headers: Headers.build((h) {
  h.authorization = BearerAuthorizationHeader(token: 'eyJhbGc...');
}),
```

## Cachecontrolheader - cache directives

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

## Contentdispositionheader - file downloads

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

## Cookieheader and setcookieheader - cookies

### Reading cookies from requests

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

### Setting cookies in responses

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

## Complete examples

### Secure api with authentication and caching

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

### File download with proper headers

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

### Cookie-based sessions

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
- Use `SameSite` cookie attribute for CSRF protection :::

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

### Multi-value header example

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

### Optional: Add extension methods for convenient access

For better ergonomics, you can add extension methods to access your custom
headers with property syntax:

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

## Next steps

- Serve [static files](static-files) with caching and compression
- Add [middleware](middleware) for cross-cutting concerns
- Learn about [modular routes](modular-routes) for organizing complex APIs
