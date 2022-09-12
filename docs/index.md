---
sidebar_position: 0
---

# Get started
Serverpod is an open-source, scalable app server, written in Dart for the Flutter community. Serverpod automatically generates your protocol and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

:::caution

This is an early release of Serverpod. The API is stable and used in production by multiple projects, but there may be minor changes in future updates. A few features are still missing that will be part of the 1.0 release. See the [roadmap](/roadmap) for more information on what's in the works.

:::

## Installing Serverpod
Serverpod is tested on Mac, support for Windows and Linux is still experimental. Before you can install Serverpod, you need to the following tools installed:
- __Flutter__ and __Dart__. You will need Flutter version 2.10 or later. https://flutter.dev/docs/get-started/install
- __Docker__. Docker is used to manage Postgres and Redis. https://docs.docker.com/get-docker/

Once you have Flutter and Docker installed and configured, open up a terminal and install Serverpod by running:

```bash
dart pub global activate serverpod_cli
```

Now test the install by running:

```bash
serverpod
```

If everything is correctly configured, the help for the serverpod command is now displayed.

## Creating your first project
To get your local server up and running, you need to create a new Serverpod project. Make sure that Docker Desktop is running, then create a new project by running `serverpod create`.

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

## Starting the server
Start your Docker containers with `docker-compose up --build --detach`, it will start Postgres and Redis. Then, run `dart bin/main.dart` to start your server.

```bash
cd mypod/mypod_server
docker-compose up --build --detach
dart bin/main.dart
```

If everything is working you should see something like this on your terminal:

```
SERVERPOD version: 0.9.11 mode: development time: 2022-09-12 17:22:02.825468Z
Insights listening on port 8081
Server default listening on port 8080
Webserver listening on port 8082
```

:::info

If you need to stop the Docker containers at some point, just run `docker-compose stop` or use the Docker Desktop application.

:::
