# Get started
Before going through this page, make sure that you have the latest version of Serverpod installed. In the previous section, you can learn how to set up the CLI and install Serverpod Insights.

## Creating a new project
To get your local server up and running, you need to create a new Serverpod project. Make sure that [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running, then create a new project by running `serverpod create`.

```bash
serverpod create mypod
```

This command will create a new directory called `mypod`, with three dart packages inside; `mypod_server`, `mypod_client`, and `mypod_flutter`.

- `mypod_server`: This package contains your server-side code. Modify it to add new endpoints or other features your server needs.
- `mypod_client`: This is the code needed to communicate with the server. Typically, all code in this package is generated automatically, and you should not edit the files in this package.
- `mypod_flutter`: This is the Flutter app, pre-configured to connect to your local server.

:::info

It can take up to a few minutes the first time you run `serverpod create`. This is because Docker will need to download and build the containers used by Serverpod.

:::

### Starting the server
Start your Docker containers with `docker-compose up --build --detach`. It will start Postgres and Redis. Then, run `dart bin/main.dart` to start your server.

```bash
cd mypod/mypod_server
docker-compose up --build --detach
dart bin/main.dart
```

If everything is working, you should see something like this on your terminal:

```
SERVERPOD version: 1.x.x, mode: development, time: 2022-09-12 17:22:02.825468Z
Insights listening on port 8081
Server default listening on port 8080
Webserver listening on port 8082
```

:::info

If you need to stop the Docker containers at some point, just run `docker-compose stop` or use the Docker Desktop application. You can also use Docker Desktop to start, stop, and manage your containers.

:::

### Running the demo app
Start the default demo app by changing directory into the Flutter package that was created and running `flutter run`.

```bash
cd mypod/mypod_flutter
flutter run -d chrome
```

:::info

If you run the app on MacOS you will need to add permissions for outgoing connections in your Xcode project. To do this, open the `Runner.xcworkspace` in Xcode. Then check the _Outgoing Connections (Client)_ under _Runner_ > _Signing & Capabilities_ > _App Sandbox_. Make sure to add the capability for all run configurations.

:::

## Server overview
At first glance, the complexity of the server may seem daunting but there are only a few directories and files you need to pay attention to. The rest of the files will be there when you need them in the future, e.g. when you want to deploy your server or if you want to set up continuous integration.

These are the most important directories:

- `config` These are the configuration files for your Serverpod. These include a `password.yaml` file with your passwords and configurations for running your server in development, staging, and production. By default, everything is correctly configured to run your server locally.
- `lib/src/endpoints` This is where you place your server's endpoints. When you add methods to an endpoint, Serverpod will generate the corresponding methods in your client.
- `lib/src/protocol` Place your entity definition files here. These files define the classes you can pass through your API and how they relate to your database.

Both the `endpoints` and `protocol` directories contain sample files that give a quick idea of how they work. So this a great place to start learning.

### Generating code
Whenever you change your code in either the `endpoints` or `protocol` directory, you will need to regenerate the classes managed by Serverpod. Do this by running `serverpod generate`.

```bash
cd mypod/mypod_server
serverpod generate
```