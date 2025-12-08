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
- **Polymorphism:** No longer experimental
- **Widget Classes:** Renamed for clarity (legacy names deprecated)

## Migration Steps

1. Update Dart SDK to 3.8.0+ and Flutter SDK to 3.32.0+
2. Update all Serverpod packages to 3.0 in `pubspec.yaml`
3. Run `dart pub upgrade` and `serverpod generate`
4. Update custom Route classes (see Web Server section)
5. Update enum serialization strategy (see Enum section)
6. Replace `SerializableEntity` with `SerializableModel`
7. Remove experimental flags from polymorphic models
8. Test and deploy

## Breaking Changes

### 1. Web Server (Relic Framework)

Serverpod 3.0 uses the [Relic framework](https://pub.dev/packages/relic).

#### Route.handleCall Signature

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

#### Session.request Property

Endpoint methods can access request information via `session.request`. Use optional chaining as it's `null` on some session types.

```dart
class MyEndpoint extends Endpoint {
  Future<String> getClientInfo(Session session) async {
    final ip = session.request?.remoteInfo ?? 'unknown';
    final userAgent = session.request?.headers.userAgent ?? 'unknown';
    return 'IP: $ip, UA: $userAgent';
  }
}
```

#### Widget Class Names

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

### 2. Enum Serialization

Default changed from `byIndex` to `byName`.

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

### 3. Model System

#### SerializableEntity Removed

Replace `extends SerializableEntity` with `implements SerializableModel`.

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

### 4. Polymorphism

Inheritance is now stable. Remove `inheritance` from `experimental_features` in `config/generator.yaml`.

**Before:**

```yaml
# config/generator.yaml
experimental_features:
  inheritance: true
```

**After:**

```yaml
# config/generator.yaml
# Remove the inheritance key (or entire section if that was the only feature)
```

### 5. Removed Items

- `SerializableEntity` class → Use `SerializableModel` interface
- `customConstructor` map → Removed
- Legacy streaming endpoints → Use [streaming methods](/concepts/streams)
- Deprecated YAML keywords → Run `serverpod generate` for errors

### 6. Other Changes

- **Server Lifecycle:** Graceful SIGTERM shutdown, auto-stop on integrity check failure in dev mode

## Resources

- [Serverpod Documentation](https://docs.serverpod.dev)
- [Relic Framework](https://pub.dev/packages/relic)
- [GitHub Issues](https://github.com/serverpod/serverpod/issues)
- [Discord Community](https://serverpod.dev/discord)
