# Upgrade to 3.0

## Web Server Changes

### Widget Class Naming Updates

In Serverpod 3.0, the web server widget classes have been reorganized for better clarity:

- The old `Widget` class (for template-based widgets) has been renamed to `TemplateWidget`
- The old `AbstractWidget` class has been renamed to `WebWidget`
- Legacy class names (`Widget`, `AbstractWidget`, `WidgetList`, `WidgetJson`, `WidgetRedirect`) are deprecated but still available for backward compatibility

The `WidgetRoute` class remains unchanged and continues to be the base class for web routes.

**Recommended migration:**

If you're using the old `Widget` class, update to `TemplateWidget`:

```dart
// Old (deprecated but still works)
class MyPageWidget extends Widget {
  MyPageWidget({required String title}) : super(name: 'my_page') {
    values = {'title': title};
  }
}

// New (recommended)
class MyPageWidget extends TemplateWidget {
  MyPageWidget({required String title}) : super(name: 'my_page') {
    values = {'title': title};
  }
}
```

### Static Route Updates

The `RouteStaticDirectory` class has been deprecated in favor of `StaticRoute.directory()`:

**Before:**

```dart
pod.webServer.addRoute(
  RouteStaticDirectory(
    serverDirectory: 'static',
    basePath: '/',
  ),
  '/static/**',
);
```

**After:**

```dart
pod.webServer.addRoute(
  StaticRoute.directory(Directory('static')),
  '/static/**',
);
```

The new `StaticRoute` provides better cache control options. You can use the built-in static helper methods for common caching scenarios:

```dart
// Example with immutable public caching
pod.webServer.addRoute(
  StaticRoute.directory(
    Directory('static'),
    cacheControlFactory: StaticRoute.publicImmutable(maxAge: 3600),
  ),
  '/static/**',
);
```

Other available cache control factory methods:

- `StaticRoute.public(maxAge: seconds)` - Public cache with optional max-age
- `StaticRoute.publicImmutable(maxAge: seconds)` - Public immutable cache with optional max-age
- `StaticRoute.privateNoCache()` - Private cache with no-cache directive
- `StaticRoute.noStore()` - No storage allowed

You can also provide a custom factory function:

```dart
pod.webServer.addRoute(
  StaticRoute.directory(
    Directory('static'),
    cacheControlFactory: (ctx, fileInfo) => CacheControlHeader(
      publicCache: true,
      maxAge: 3600,
      immutable: true,
    ),
  ),
  '/static/**',
);
```
