---
sidebar_label: 🐣 Serverpod Mini
---

# Serverpod Mini

## Serverpod or Serverpod Mini?

Serverpod Mini is a lightweight version of Serverpod that is perfect for small projects or when you want to try out Serverpod without setting up a Postgres database. If you start with Mini, you can upgrade to the full version of Serverpod anytime.

<details open>
<summary>__Serverpod vs Serverpod Mini comparison__</summary>
<p>

| Feature               | Serverpod | Serverpod Mini |
| --------------------- | :-------: | :------------: |
| Remote method calls   |    ✅     |       ✅       |
| Generated data models |    ✅     |       ✅       |
| Streaming data        |    ✅     |       ✅       |
| Custom auth           |    ✅     |       ✅       |
| Pre-built auth        |    ✅     |                |
| Postgres database ORM |    ✅     |                |
| Task scheduling       |    ✅     |                |
| Basic logging         |    ✅     |       ✅       |
| Serverpod Insights    |    ✅     |                |
| Caching               |    ✅     |       ✅       |
| File uploads          |    ✅     |                |
| Health checks         |    ✅     |                |
| Relic web server      |    ✅     |                |
| Easy deployment       |    ✅     |       ✅       |

</p>
</details>

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/dSBK4JOZRyI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Create a new project

Create a mini project by running:

```bash
$ serverpod create myminipod --mini
```

Serverpod will create a new project for you. It contains three Dart packages, but you only need to pay attention to the `myminipod_server` and `myminipod_flutter` directories. The server directory contains your server files, and the flutter directory contains your app. The third package (`myminipod_client`) contains generated code that is used by the Flutter app to communicate with the server.

Start your server by changing directory into your server directory, and run the `bin/main.dart` file:

```bash
$ cd myminipod/myminipod_server
$ dart bin/main.dart
```

Your default project comes with a sample Flutter app, all hooked up to talk with your server. Run it with the `flutter` command:

```bash
$ cd myminipod/myminipod_flutter
$ flutter run -d chrome
```

Easy as that. 🥳

:::tip

If you are using VS Code, install our Serverpod extension. It will help you validate any Serverpod-related files in your project!

:::

## Creating models

In Serverpod, you define your models in easy-to-read YAML-files, which you place anywhere in your server's `lib` directory with the `.spy.yaml` extension. Model files will be converted to Dart classes that can be serialized and sent to and from the server to your app. This is an example of a model file:

```yaml
class: Company
fields:
  name: String
  foundedDate: DateTime?
  employees: List<String>
```

For types, you can use most basic Dart types, such as `String`, `double`, `int`, `bool`, `DateTime`, `UuidValue`, `Uri`, `BigInt` and `ByteData`. You can also include `List`, `Set` and `Map`, just make sure to specify their types. Any supported type can also be used inside a `Record`. Any other class specified among your models is also supported.

Whenever you add or edit a model file, run `serverpod generate` in your server directory. Then, Serverpod will generate all the updated Dart classes:

```bash
$ cd myminipod/myminipod_server
$ serverpod generate
```

## Adding methods to your server

With Serverpod, you add Dart methods to endpoints placed in your server's `lib/src/endpoints` directory. By doing so, Serverpod will analyze your server code and automatically generate the corresponding methods in your Flutter app. Calling a method on the server is just like calling a local method in your app.

For the server methods to work, there are a few things you need to keep in mind:

- You must place the methods in a class that extends the Endpoint class.
- The methods must return a typed Future. The types you use in your methods are the same as those supported by your models.
- The first parameter of your method must be a Session object. The session contains extra information about the call being made to the server, such as the HTTP request object.

This is an example of an endpoint that uses the Company class that we defined in the example model in the previous section.

```dart
import 'package:serverpod/serverpod.dart';

class CompanyEndpoint extends Endpoint {
  Future<bool> isLegit(Session session, Company company) async {
    // Check if the company has the foundedDate set and that it
    // has been around for more than one year.

    if (company.foundedDate == null) {
      return false;
    }

    var oneYearAgo = DateTime.now().subract(Duration(days: 365));
    return company.foundedDate!.isBefore(oneYearAgo);
  }
}
```

After adding or modifying endpoints and endpoint methods, you must run `serverpod generate` to keep your Flutter app up-to-date.

```bash
$ cd myminipod/myminipod_server
$ serverpod generate
```

## Calling the server methods from the app

When you run `serverpod generate` Serverpod will add your endpoints and server methods to the `client` object in your Flutter app. From the client, you can access all endpoints and methods.

To call the endpoint method we just created from Flutter, just create a `Company` object, call the method, and await the result:

```dart
var company = Company(
  name: 'Serverpod',
  foundedDate: DateTime(2021, 9, 27),
  employees: [
    'Alex',
    'Isak',
    'Viktor',
  ],
);

var result = await client.company.isLegit(company);
```

## Conclusion

You are now ready to start exploring the exciting world of Serverpod! And even if you start out with Serverpod mini, you can always [upgrade](../upgrading/upgrade-from-mini) to the full version later.
