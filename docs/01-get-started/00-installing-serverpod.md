---
sidebar_position: -1
---

# Installation

## Meet Serverpod

Serverpod is an open-source, scalable app server written in Dart for the Flutter community. Serverpod automatically generates your model and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

//TODO(dkbast): add a diagram of the architecture

## Why Serverpod?

Serverpod is designed to be a full-stack solution for building server-side applications. It provides a powerful and flexible framework for building APIs, managing databases, and handling real-time communication. Serverpod is built on top of Dart and automatically generates a Flutter client making it easy to integrate with your existing Flutter applications.

//TODO(dkbast): Add a testimonal compilation

### A Progressive Framework

Serverpod is designed to be a progressive framework. It allows you to start small and grow your application as needed. You can use Serverpod for simple applications or scale it up to handle complex use cases. Serverpod is built with performance in mind, making it suitable for high-traffic applications.

### Built for the Flutter Community

Serverpod is built specifically for the Flutter community. It leverages the power of Dart and Flutter to provide a seamless experience for developers. Serverpod is designed to work well with existing Flutter libraries and tools, making it easy to integrate into your existing projects.

### Open Source

Serverpod is an open-source project, which means you can contribute to its development and customize it to fit your needs. The source code is available on GitHub, and we welcome contributions from the community.

## Installation

### Prerequisites

Serverpod is tested on Mac, Windows, and Linux. Before you can install Serverpod, you need to have **[Flutter](https://flutter.dev/docs/get-started/install)** installed.

:::info
Check your Flutter installation by running the following command in your terminal:

```bash
$ flutter doctor
```

:::

To make use of Serverpod's database connectivity, you need to have access to a PostgreSQL database. We recommend using Docker to run PostgreSQL locally. You can find instructions for installing Docker on the official [Docker website](https://docs.docker.com/get-docker/). Each Serverpod project comes with its own `docker-compose.yaml`, so there is no need to install any custom containers. We will guide you through the process in the Getting Started section.

:::info
Check your Docker installation by running the following command in your terminal:

```bash
$ docker info
```

If you are using Docker Desktop and you are getting an error, make sure that Docker is running. You can check this by looking for the Docker icon in your system tray or taskbar. If it's not running, start Docker Desktop and try again.
:::

### Install Serverpod

Serverpod is installed using the Dart package manager. To install Serverpod, run the following command in your terminal:

```bash
$ dart pub global activate serverpod_cli
```

This command will install the Serverpod command-line interface (CLI) globally on your machine. You can verify the installation by running:

```bash
$ serverpod
```

If everything is correctly configured, the help for the `serverpod` command is now displayed.

### Install the VS Code extension (recommended)

The Serverpod VS Code extension makes it easy to work with your Serverpod projects. It provides real-time diagnostics and syntax highlighting for model files in your project.
![Serverpod extension](/img/syntax-highlighting.png)

You can **[install the extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod)** from the VS Code Marketplace or search for _Serverpod_ from inside VS Code.

### Install Serverpod Insights (recommended)

**[Serverpod Insights](../tools/insights)** is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.
![Serverpod Insights](https://serverpod.dev/assets/img/serverpod-screenshot.webp)

## Creating a new project

To create a new Serverpod project, use the `serverpod create` command. It will set up a new project with a server, a client, and a Flutter app.
The project will be created in a new directory with the name you specify. For example, to create a new project called `my_project`, run the following command:

```bash
$ serverpod create my_project
```

:::tip
The name of the project must be a valid Dart package name. It should start with a lowercase letter and can only contain lowercase letters, numbers, and underscores. For example, `my_project` is a valid name, but `MyCounter` is not.
:::

To run your new project you must first start the database from the Docker file that is included with the project. Do this by running the `docker compose up` command in the server directory:

```bash
$ cd my_project/my_project_server
$ docker compose up
```

This will start the PostgreSQL database. You can stop the database server by pressing `Ctrl+C` in the terminal. If you want to run the servers in the background, you can use the `-d` flag:

```bash
$ docker compose up -d
```

This will start the database server in detached mode, meaning it will run in the background and you can safely close the terminal window without stopping it. Stop the database container by running the following command from the server directory:

```bash
$ docker compose down
```

:::tip
If you are using Docker Desktop, you can see and manage all your installed Docker containers from there. It's easy to start and stop containers, and to remove the ones you are no longer using.
:::

Now that the database is up and running we can start the Serverpod server. Because we are running the project for the first time, we need create the database tables used by Serverpod. This is done through a [database migration](RELEVANT_LINK). An initial migration is already created for us, so all we need to do is to pass the `--apply-migrations` flag to our server when we start it:

```bash
$ cd my_project/my_project_server
$ dart run bin/main.dart --apply-migrations
```

This will start the server and set up the initial database tables. You can now access the server at `http://localhost:8080` and the web server is available at `http://localhost:8082`. It should look like this:

![Serverpod web](/img/getting-started/serverpod-web.png)

Now let's run our Flutter app. You can do this by running `flutter run -d chrome` in the flutter directory:

```bash
$ cd my_project/my_project_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look like this:

![Example Flutter App](/img/getting-started/flutter-example-web.png)

## Next steps

The quickest way to learn Serverpod is to follow our 30-minute [Getting Started](/endpoints-and-server-side-logic) guide. This will give you an excellent overview of creating endpoints and models and working with the database. You will create a fun app that magically creates recipes from the ingredients you have in your fridge.
