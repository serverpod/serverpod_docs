---
sidebar_position: 0
---

# Get started
Serverpod is an open-source, scalable app server written in Dart for the Flutter community. Serverpod automatically generates your protocol and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/QN6juNWW3js" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>


## Installing Serverpod
Serverpod is tested on Mac and Linux. It works on Windows, but it's still experimental. Before you can install Serverpod, you need to have the following tools installed:
- __Flutter__ and __Dart__. You will need Flutter version 3.0 or later. https://flutter.dev/docs/get-started/install
- __Docker__. Docker is used to manage Postgres and Redis. https://docs.docker.com/get-docker/

Once you have Flutter and Docker installed and configured, open up a terminal and install Serverpod by running:

```bash
dart pub global activate serverpod_cli
```

Now test the installation by running:

```bash
serverpod
```

If everything is correctly configured, the help for the `serverpod` command is now displayed.

### Serverpod Insights
Serverpod Insights is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is currently in beta and only available for Mac, but we will be adding support for more platforms in the future.

![Serverpod Insights](/img/serverpod-insights.webp)

:::info

Download the latest version here: __[Serverpod Insights 1.0.0](https://serverpod.dev/insights/Serverpod-1.0.0.zip)__. It is compatible with Serverpod version 1.0.x. Always use the same version of Serverpod Insights as for the framework itself.

:::

## Creating your first project
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

## Starting the server
Start your Docker containers with `docker compose up --build --detach`. It will start Postgres and Redis. Then, run `dart bin/main.dart` to start your server.

```bash
cd mypod/mypod_server
docker compose up --build --detach
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

If you need to stop the Docker containers at some point, just run `docker compose stop` or use the Docker Desktop application. You can also use Docker Desktop to start, stop, and manage your containers.

:::
