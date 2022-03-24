---
sidebar_position: 0
---

# Get started
Serverpod is an open-source, scalable app server, written in Dart for the Flutter community. Serverpod automatically generates your protocol and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

:::caution

This is an early release of Serverpod. The API is stable and used in production by multiple projects, but there may be minor changes in future updates. A few features are still missing that will be part of the 1.0 release. See the [roadmap](/roadmap) for more information on what's in the works.

:::

## Installing Serverpod
Serverpod is tested on Mac and Linux (Mac recommended), support for Windows is in the works. Before you can install Serverpod, you need to the following tools installed:
- __Flutter__ and __Dart__. You will need Flutter version 2.10 or later. https://flutter.dev/docs/get-started/install
- __Docker__. Docker is used to manage Postgres and Redis. https://docs.docker.com/desktop/mac/install/

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
The `serverpod run` command will start and run your server along with Postgres and Redis.

```bash
cd mypod/mypod_server
serverpod run
```

If everything is working you should see something like this on your terminal:

```
Starting Serverpod.
 • Automatic generate and reload are enabled.
 • Running Postgres and Redis in Docker container.

Spinning up serverpod generate (this can take a few seconds).
Starting Docker (for Postgres and Redis).
Waiting for Postgres on localhost:8090.
Waiting for Redis on localhost:8091.
Setup complete. Starting the server.

SERVERPOD version: 0.9.x mode: development
Insights listening on port 8081
Server id 0 listening on port 8080
```

:::info

You can also start Postgres, Redis and the server manually without using the `serverpod run` command. To do this, first `cd` into `mypod_server`, then run:
```bash
docker-compose up -d --build
```

This will build and start a set of Docker containers and give access to Postgres and Redis. If you need to stop the containers at some point, just run `docker-compose stop`.

Now you should be all set to run your server. Start it by typing:

```bash
dart bin/main.dart
```

:::
