# Upgrade to 3.0

## Web Server: Widget to Component Rename

In Serverpod 3.0, all web server related "Widget" classes have been renamed to "Component" to better reflect their purpose and avoid confusion with Flutter widgets.

The following classes have been renamed:

| Old Name         | New Name            |
| ---------------- | ------------------- |
| `Widget`         | `Component`         |
| `AbstractWidget` | `AbstractComponent` |
| `WidgetRoute`    | `ComponentRoute`    |
| `WidgetJson`     | `JsonComponent`     |
| `WidgetRedirect` | `RedirectComponent` |
| `WidgetList`     | `ListComponent`     |

### 1. Update Route Classes

Update all route classes that extend `WidgetRoute` to extend `ComponentRoute`, and rename them to follow the new naming convention:

**Before:**

```dart
class RouteRoot extends WidgetRoute {
  @override
  Future<Widget> build(Session session, HttpRequest request) async {
    return MyPageWidget();
  }
}
```

**After:**

```dart
class RootRoute extends ComponentRoute {
  @override
  Future<Component> build(Session session, HttpRequest request) async {
    return MyPageComponent();
  }
}
```

### 2. Update Component Classes

Update all classes that extend `Widget` to extend `Component`, and rename them from "Widget" to "Component":

**Before:**

```dart
class MyPageWidget extends Widget {
  MyPageWidget({required String title}) : super(name: 'my_page') {
    values = {
      'title': title,
    };
  }
}
```

**After:**

```dart
class MyPageComponent extends Component {
  MyPageComponent({required String title}) : super(name: 'my_page') {
    values = {
      'title': title,
    };
  }
}
```

### 3. Update Abstract Components

If you have custom abstract components, update them from `AbstractWidget` to `AbstractComponent` and rename accordingly:

**Before:**

```dart
class CustomWidget extends AbstractWidget {
  @override
  String toString() {
    return '<html>...</html>';
  }
}
```

**After:**

```dart
class CustomComponent extends AbstractComponent {
  @override
  String toString() {
    return '<html>...</html>';
  }
}
```

### 4. Update Special Component Types

Update references to special component types:

**Before:**

```dart
// JSON responses
return WidgetJson(object: {'status': 'success'});

// Redirects
return WidgetRedirect(url: '/login');

// Component lists
return WidgetList(widgets: [widget1, widget2]);
```

**After:**

```dart
// JSON responses
return JsonComponent(object: {'status': 'success'});

// Redirects
return RedirectComponent(url: '/login');

// Component lists
return ListComponent(widgets: [widget1, widget2]);
```

### 5. Update Route Registration

Update your route registration to use the renamed route classes:

**Before:**

```dart
pod.webServer.addRoute(RouteRoot(), '/');
pod.webServer.addRoute(RouteRoot(), '/index.html');
```

**After:**

```dart
pod.webServer.addRoute(RootRoute(), '/');
pod.webServer.addRoute(RootRoute(), '/index.html');
```

### Directory Structure

For consistency with the new naming convention, we recommend renaming your `widgets/` directories to `components/`. However, this is not strictly required - the directory structure can remain unchanged if needed.

### Class Names

For consistency and clarity, we recommend updating all class names from "Widget" to "Component" (e.g., `MyPageWidget` → `MyPageComponent`). While you can keep your existing class names and only update the inheritance, following the new naming convention will make your code more maintainable and consistent with Serverpod's conventions.

### Complete Example

Here's a complete example of migrating a simple web page:

**Before:**

```dart
// lib/src/web/widgets/default_page_widget.dart
import 'package:serverpod/serverpod.dart';

class DefaultPageWidget extends Widget {
  DefaultPageWidget() : super(name: 'default') {
    values = {
      'served': DateTime.now(),
      'runmode': Serverpod.instance.runMode,
    };
  }
}

// lib/src/web/routes/root.dart
import 'dart:io';
import 'package:my_server/src/web/widgets/default_page_widget.dart';
import 'package:serverpod/serverpod.dart';

class RouteRoot extends WidgetRoute {
  @override
  Future<Widget> build(Session session, HttpRequest request) async {
    return DefaultPageWidget();
  }
}
```

**After:**

```dart
// lib/src/web/components/default_page_component.dart (renamed file and directory)
import 'package:serverpod/serverpod.dart';

class DefaultPageComponent extends Component {
  DefaultPageComponent() : super(name: 'default') {
    values = {
      'served': DateTime.now(),
      'runmode': Serverpod.instance.runMode,
    };
  }
}

// lib/src/web/routes/root.dart
import 'dart:io';
import 'package:my_server/src/web/components/default_page_component.dart';
import 'package:serverpod/serverpod.dart';

class RootRoute extends ComponentRoute {
  @override
  Future<Component> build(Session session, HttpRequest request) async {
    return DefaultPageComponent();
  }
}

// server.dart
pod.webServer.addRoute(RootRoute(), '/');
pod.webServer.addRoute(RootRoute(), '/index.html');
```
