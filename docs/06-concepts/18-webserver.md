# Web server

In addition to the application server, Serverpod comes with a built-in web server. The web server allows you to access your database and business layer the same way you would from a method call from an app. This makes it very easy to share data for applications that need both an app and traditional web pages. You can also use the web server to create webhooks or generate custom REST APIs to communicate with 3rd party services.

:::caution

Serverpod's web server is still experimental, and the APIs may change in the future. This documentation should give you some hints on getting started, but we plan to add more extensive documentation as the web server matures.

:::

When you create a new Serverpod project, it sets up a web server by default. When working with the web server, there are two main classes to understand; `ComponentRoute` and `Component`. The `ComponentRoute` provides an entry point for a call to the server and returns a `Component`. The `Component` renders a web page or response using templates, JSON, or other custom means.

## Creating new routes and components

To add new pages to your web server, you add new routes. Typically, you do this in your server.dart file before you start the Serverpod. By default, Serverpod comes with a `RootRoute` and a static directory.

When receiving a web request, Serverpod will search and match the routes in the order they were added. You can end a route's path with an asterisk (`*`) to match all paths with the same beginning.

```dart
// Add a single page.
pod.webServer.addRoute(MyRoute(), '/my/page/address');

// Match all paths that start with /item/
pod.webServer.addRoute(AnotherRoute(), '/item/*');
```

Typically, you want to create custom routes for your pages. Do this by overriding the ComponentRoute class and implementing the build method.

```dart
class MyRoute extends ComponentRoute {
  @override
  Future<Component> build(Session session, HttpRequest request) async {
    return MyPageComponent(title: 'Home page');
  }
}
```

Your route's build method returns a Component. The Component consists of an HTML template file and a corresponding Dart class. Create a new custom Component by overriding the Component class. Then add a corresponding HTML template and place it in the `web/templates` directory. The HTML file uses the [Mustache](https://mustache.github.io/) template language. You set your template parameters by updating the `values` field of your `Component` class. The values are converted to `String` objects before being passed to the template. This makes it possible to nest components, similarly to how widgets work in Flutter.

```dart
class MyPageComponent extends Component {
  MyPageComponent({String title}) : super(name: 'my_page') {
    values = {
      'title': title,
    };
  }
}
```

:::info

In the future, we plan to add a component library to Serverpod with components corresponding to the standard widgets used by Flutter, such as Column, Row, Padding, Container, etc. This would make it possible to render server-side components with similar code used within Flutter.

:::

## Special components and routes

Serverpod comes with a few useful special components and routes you can use out of the box. When returning these special component types, Serverpod's web server will automatically set the correct HTTP status codes and content types.

- `ListComponent` concatenates a list of other components into a single component.
- `JsonComponent` renders a JSON document from a serializable structure of maps, lists, and basic values.
- `RedirectComponent` creates a redirect to another URL.

To serve a static directory, use the `RouteStaticDirectory` class. Serverpod will set the correct content types for most file types automatically.

:::caution

Static files are configured to be cached hard by the web browser and through Cloudfront's content delivery network (if you use the AWS deployment). If you change static files, they will need to be renamed, or users will most likely access old files. To make this easier, you can add a version number when referencing the static files. The version number will be ignored when looking up the actual file. E.g., `/static/my_image@v42.png` will serve to the `/static/my_image.png` file. More advanced cache management will be coming to a future version of Serverpod.

:::

## Database access and logging

The web server passes a `Session` object to the `ComponentRoute` class' `build` method. This gives you access to all the features you typically get from a standard method call to an endpoint. Use the database, logging, or caching the same way you would in a method call.
