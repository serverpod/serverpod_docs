# Static files

Static assets like images, CSS, and JavaScript files are essential for web
applications. The `StaticRoute.directory()` method makes it easy to serve entire
directories with automatic content-type detection for common file formats.

## Serving static files

The simplest way to serve static files is to use `StaticRoute.directory()`:

```dart
final staticDir = Directory('web/static');

pod.webServer.addRoute(
  StaticRoute.directory(staticDir),
  '/static/**',
);
```

This serves all files from the `web/static` directory at the `/static` path.
For example, `web/static/logo.png` becomes accessible at `/static/logo.png`.

:::info

The `/**` tail-match wildcard is required for serving directories. It matches all
paths under the prefix, allowing `StaticRoute` to map URLs to file system paths.
See [Routing](routing#wildcards) for more on wildcards.

:::

## Cache control

Control how browsers and CDNs cache your static files using the
`cacheControlFactory` parameter:

```dart
pod.webServer.addRoute(
  StaticRoute.directory(
    staticDir,
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: const Duration(years: 1)),
  ),
  '/static/**',
);
```

## Static file cache-busting

When deploying static assets, browsers and CDNs (like CloudFront) cache files
aggressively for performance. This means updated files may not be served to
users unless you implement a cache-busting strategy.

Serverpod provides `CacheBustingConfig` to automatically version your static
files. For more details, see the [Relic documentation](https://docs.dartrelic.dev/).

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
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: const Duration(years: 1)),
  ),
  '/static/**',
);
```

### Generating versioned urls

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
- Works transparently - requesting `/static/logo@abc123.png` serves
  `/static/logo.png`

## Conditional requests (`Etags` and `Last-Modified`)

`StaticRoute` automatically supports HTTP conditional requests through Relic's
`StaticHandler`. This provides efficient caching without transferring file
content when unchanged:

**Supported features:**

- **ETag headers** - Content-based fingerprinting for cache validation
- **Last-Modified headers** - Timestamp-based cache validation
- **If-None-Match** - Client sends ETag, server returns 304 Not Modified if
  unchanged
- **If-Modified-Since** - Client sends timestamp, server returns 304 if not
  modified

These work automatically without configuration:

**Initial request:**

```http
GET /static/logo.png HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
ETag: "abc123"
Last-Modified: Tue, 15 Nov 2024 12:00:00 GMT
Content-Length: 12345

[file content]
```

**Subsequent request with ETag:**

```http
GET /static/logo.png HTTP/1.1
Host: example.com
If-None-Match: "abc123"

HTTP/1.1 304 Not Modified
ETag: "abc123"

[no body - saves bandwidth]
```

When combined with cache-busting, conditional requests provide a fallback
validation mechanism even for cached assets, ensuring efficient delivery while
maintaining correctness.

For dynamic content that changes per request, see [Server-side HTML](server-side-html).
