# Creating a new Serverpod project

The full version of Serverpod needs access to a Postgres database. The easiest way to set that up is to use our pre-configured Docker container. Install **[Flutter](https://flutter.dev/docs/get-started/install)**, **[Serverpod](/)** and **[Docker Desktop](https://docs.docker.com/get-docker/)** before you begin.

Create a new project by running `serverpod create`.

```bash
$ serverpod create mypod
```

:::info

Serverpod executes the `flutter create` command inside the flutter package during project creation. On Windows, `flutter` commands require that developer mode is enabled in the system settings.

:::

This command will create a new directory called `mypod`, with three dart packages inside; `mypod_server`, `mypod_client`, and `mypod_flutter`.

- `mypod_server`: This package contains your server-side code. Modify it to add new endpoints or other features your server needs.
- `mypod_client`: This is the code needed to communicate with the server. Typically, all code in this package is generated automatically, and you should not edit the files in this package.
- `mypod_flutter`: This is the Flutter app, pre-configured to connect to your local server.

## Starting the server

Make sure that **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** is running, then start your Docker containers with `docker compose up --build --detach`. It will start Postgres and Redis. Then, run `dart bin/main.dart --apply-migrations` to start your server.

```bash
$ cd mypod/mypod_server
$ docker compose up --build --detach
$ dart bin/main.dart --apply-migrations
```

If everything is working, you should see something like this on your terminal:

```text
SERVERPOD version: 2.x.x, mode: development, time: 2022-09-12 17:22:02.825468Z
Insights listening on port 8081
Server default listening on port 8080
Webserver listening on port 8082
```

:::info

If you need to stop the Docker containers at some point, just run `docker compose stop` or use the Docker Desktop application. You can also use Docker Desktop to start, stop, and manage your containers.

:::

:::important

In your development environment it can be helpful to always start Serverpod with the `--apply-migrations` flag, as this will ensure that the database is always up-to-date with your latest migration. However, in production you should typically start the server without the flag, unless you want to actually apply a new migration.

:::

## Running the demo app

Start the default demo app by changing the directory into the Flutter package that was created and running `flutter run`.

```bash
$ cd mypod/mypod_flutter
$ flutter run -d chrome
```

The flag `-d chrome` runs the app in Chrome, for other run options please see the Flutter documentation.

:::info

**iOS Simulator**: Because an iOS simulator has its own localhost, it won't find the server running on your machine. Therefore, you will need to pass the IP address of your machine when creating the client in `mypod/mypod_flutter/lib/main.dart`. Depending on your local network, it might look something like this:

```dart
var client = Client('http://192.168.1.117:8080/')
  ..connectivityMonitor = FlutterConnectivityMonitor();
```

:::

:::info
**MacOS**:
If you run the app on MacOS, you will need to add permissions for outgoing connections in your Xcode project. To this, open the `Runner.xcworkspace` in Xcode. Then check the _Outgoing Connections (Client)_ under _Runner_ > _Signing & Capabilities_ > _App Sandbox_. Make sure to add the capability for all run configurations.

:::
