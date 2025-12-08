# Upgrade to 3.0

## Requirements

- Baseline: Serverpod 2.9.0+
- Minimum Dart SDK: 3.8.0
- Minimum Flutter SDK: 3.32.0

:::note
The new authentication module has separate migration documentation. This guide covers only core framework changes.
:::

## Breaking Changes Summary

- **Web Server:** Relic framework integration (custom routes need updates)
- **Enum Serialization:** Default changed from `byIndex` to `byName`
- **Model System:** `SerializableEntity` removed
- **Widget Classes:** Renamed for clarity (legacy names deprecated)

## Migration Steps

1. Update Dart SDK to 3.8.0+ and Flutter SDK to 3.32.0+
2. Update all Serverpod packages to 3.0 in `pubspec.yaml`
3. Run `dart pub upgrade` and `serverpod generate`
4. Update custom Route classes (see Web Server section)
5. Update enum serialization strategy (see Enum section)
6. Replace `SerializableEntity` with `SerializableModel` in custom models
7. Test and deploy

## Web Server (Relic Framework)

Serverpod 3.0 integrates the [Relic framework](https://pub.dev/packages/relic) for web server functionality, bringing it out of experimental status. This provides improved performance, better request/response handling, and built-in WebSocket support.

### Route.handleCall Signature

| Aspect   | Serverpod 2.x         | Serverpod 3.0          |
| -------- | --------------------- | ---------------------- |
| Request  | `HttpRequest request` | `Request request`      |
| Return   | `Future<bool>`        | `FutureOr<Result>`     |
| Response | `return true`         | `return Response.ok()` |

**Before:**

```dart
import 'dart:io';

class MyRoute extends Route {
  @override
  Future<bool> handleCall(Session session, HttpRequest request) async {
    final ip = request.remoteIpAddress;
    final userAgent = request.headers.value('user-agent');
    request.response.write('<html><body>Hello</body></html>');
    return true;
  }
}
```

**After:**

```dart
class MyRoute extends Route {
  @override
  FutureOr<Result> handleCall(Session session, Request request) async {
    final ip = request.remoteInfo;
    final userAgent = request.headers.userAgent;
    return Response.ok(
      body: Body.fromString('<html><body>Hello</body></html>', mimeType: MimeType.html),
    );
  }
}
```

**Changes:**

- `HttpRequest` → `Request`
- `Future<bool>` → `FutureOr<Result>`
- `request.remoteIpAddress` → `request.remoteInfo`
- `request.headers.value()` → `request.headers.userAgent` or `request.headers['name']`
- Return `Response` instead of `bool`

### Widget Class Names

| Old (Deprecated) | New              |
| ---------------- | ---------------- |
| `AbstractWidget` | `WebWidget`      |
| `Widget`         | `TemplateWidget` |
| `WidgetList`     | `ListWidget`     |
| `WidgetJson`     | `JsonWidget`     |
| `WidgetRedirect` | `RedirectWidget` |

```dart
// Before
Future<Widget> build(...) => Widget(name: 'page')..values = {...};

// After
Future<WebWidget> build(...) => TemplateWidget(name: 'page', values: {...});
```

## Session.request Property

With the Relic framework integration, the `Session` object now provides access to the underlying HTTP request through the `request` property. This allows endpoint methods to access request metadata such as client IP address and headers directly from the session.

Use optional chaining as it's `null` on some session types (e.g., sessions created for background tasks).

```dart
class MyEndpoint extends Endpoint {
  Future<String> getClientInfo(Session session) async {
    final ip = session.request?.remoteInfo ?? 'unknown';
    final userAgent = session.request?.headers.userAgent ?? 'unknown';
    return 'IP: $ip, UA: $userAgent';
  }
}
```

## Enum Serialization

The default enum serialization strategy has changed from `byIndex` to `byName`. This change improves robustness when reordering or adding enum values, as serialized data remains valid even if the enum definition changes. With `byName`, the string representation is stored instead of the numeric index, making your data more resilient and easier to debug.

**Keep old behavior:**

```yaml
enum: UserRole
serialized: byIndex # Add this
values:
  - admin
  - user
```

**Use new default:**

```yaml
enum: UserRole
# byName is now default
values:
  - admin
  - user
```

## SerializableEntity Removed

The `SerializableEntity` class, deprecated since Serverpod 2.0, has been removed. Replace `extends SerializableEntity` with `implements SerializableModel` in your custom model classes.

```dart
// Before
class CustomClass extends SerializableEntity {
  Map<String, dynamic> toJson() => {'name': name};
}

// After
class CustomClass implements SerializableModel {
  Map<String, dynamic> toJson() => {'name': name};
  factory CustomClass.fromJson(Map<String, dynamic> json) => CustomClass(json['name']);
}
```

## Removed APIs

The following APIs have been removed in Serverpod 3.0:

- `SerializableEntity` class → Use `SerializableModel` interface
- Deprecated YAML keywords (`parent`, `database`, `api`) → Run `serverpod generate` to see errors with migration guidance

## Deprecated APIs

The following APIs have been deprecated and will be removed in a future version:

- Legacy streaming endpoints → Use [streaming methods](/concepts/streams) for new code

## Other Changes

Additional improvements in Serverpod 3.0:

- **Server Lifecycle:** Graceful SIGTERM shutdown, auto-stop on integrity check failure in dev mode

## Resources

- [Relic Framework](https://pub.dev/packages/relic)
- [GitHub Issues](https://github.com/serverpod/serverpod/issues)
- [Discord Community](https://serverpod.dev/discord)
