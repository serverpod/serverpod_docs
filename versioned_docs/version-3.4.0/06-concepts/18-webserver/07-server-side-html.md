# Server-Side HTML

For simple HTML pages, you can use `WidgetRoute` and `TemplateWidget`. The
`WidgetRoute` provides an entry point for handling requests and returns a
`WebWidget`. The `TemplateWidget` (which extends `WebWidget`) renders web pages
using Mustache templates.

## Creating a WidgetRoute

Create custom routes by extending the `WidgetRoute` class and implementing the
`build` method:

```dart
class MyRoute extends WidgetRoute {
  @override
  Future<TemplateWidget> build(Session session, Request request) async {
    return MyPageWidget(title: 'Home page');
  }
}

// Register the route
pod.webServer.addRoute(MyRoute(), '/my/page/address');
```

## Creating a TemplateWidget

A `TemplateWidget` consists of a Dart class and a corresponding HTML template
file. Create a custom widget by extending `TemplateWidget`:

```dart
class MyPageWidget extends TemplateWidget {
  MyPageWidget({required String title}) : super(name: 'my_page') {
    values = {
      'title': title,
    };
  }
}
```

Place the corresponding HTML template in the `web/templates` directory. The HTML
file uses the [Mustache](https://mustache.github.io/) template language:

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title}}</h1>
  <p>Welcome to my page!</p>
</body>
</html>
```

Template values are converted to `String` objects before being passed to the
template. This makes it possible to nest widgets, similarly to how widgets work
in Flutter.

## Built-in widgets

Serverpod provides several built-in widgets for common use cases:

- **`ListWidget`** - Concatenates multiple widgets into a single response

  ```dart
  return ListWidget(children: [
    HeaderWidget(),
    ContentWidget(),
    FooterWidget(),
  ]);
  ```

- **`JsonWidget`** - Renders JSON documents from serializable data structures

  ```dart
  return JsonWidget({'status': 'success', 'data': myData});
  ```

- **`RedirectWidget`** - Creates HTTP redirects to other URLs

  ```dart
  return RedirectWidget('/new/location');
  ```

## Database access and logging

The web server passes a `Session` object to the `WidgetRoute` class' `build`
method. This gives you access to all the features you typically get from a
standard method call to an endpoint. Use the database, logging, or caching the
same way you would in a method call:

```dart
class DataRoute extends WidgetRoute {
  @override
  Future<TemplateWidget> build(Session session, Request request) async {
    // Access the database
    final users = await User.db.find(session);

    // Logging
    session.log('Rendering user list page');

    return UserListWidget(users: users);
  }
}
```

:::info Alternative

If you prefer [Jaspr](https://docs.page/schultek/jaspr), which provides a
Flutter-like API for building web applications. You can integrate Jaspr with
Serverpod's web server using custom `Route` classes, giving you full control
over request handling while leveraging Jaspr's component model.

:::

## Next steps

- For modern server-side rendering, explore
  [Jaspr](https://docs.page/schultek/jaspr) integration
- Use [custom routes](routing) for REST APIs and custom request handling
- Serve [static files](static-files) for CSS, JavaScript, and images
- Add [middleware](middleware) for cross-cutting concerns like logging and
  error handling
