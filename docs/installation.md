---
sidebar_position: 0
sidebar_label: Installation
sidebar_class_name: sidebar-installation-icon
---

# Installation

### Prerequisites

Serverpod is tested on Mac, Windows, and Linux. Before you can install Serverpod, you need to have **[Flutter](https://flutter.dev/docs/get-started/install)** installed.

::::info
Check your Flutter installation by running the following command in your terminal:

```bash
$ flutter doctor
```

::::

To make use of Serverpod's database connectivity, you need to have access to a PostgreSQL database. We recommend using Docker to run PostgreSQL locally. You can find instructions for installing Docker on the official **[Docker website](https://docs.docker.com/get-docker/)**. Each Serverpod project comes with its own `docker-compose.yaml`, so there is no need to install any custom containers. We will guide you through the process in the Getting Started section.

::::info
Check your Docker installation by running the following command in your terminal:

```bash
$ docker info
```

::::

If you are using Docker Desktop and you get an error, make sure that Docker is running. You can check this by looking for the Docker icon in your system tray or taskbar. If it's not running, start Docker Desktop and try again.

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

**[Serverpod Insights](./09-tools/01-insights.md)** is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.
![Serverpod Insights](/img/serverpod-insights.webp)

## Creating a new project

To create a new Serverpod project, use the `serverpod create` command. It will set up a new project with a server, a client, and a Flutter app.
The project will be created in a new directory with the name you specify. For example, to create a new project called `my_project`, run the following command:

```bash
$ serverpod create my_project
```

::::tip
The name of the project must be a valid Dart package name. It should start with a lowercase letter and can only contain lowercase letters, numbers, and underscores. For example, `my_project` is a valid name, but `MyCounter` is not.
::::

After running the command, the following structure will be created:

```text
my_project/
├── my_project_server/   # Contains your server-side code.
├── my_project_client/   # Code needed for the app to communicate with the server.
└── my_project_flutter/  # Flutter app, pre-configured to connect to your local server.
```

The root-level `pubspec.yaml` file includes support for [Dart pub workspaces](https://dart.dev/tools/pub/workspaces) by default, which allows fetching dependencies at once by calling `dart pub get` from the project root.

::::info
During project creation, dependencies are automatically fetched.
::::

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

::::tip
If you are using Docker Desktop, you can see and manage all your installed Docker containers from there. It's easy to start and stop containers, and to remove the ones you are no longer using.
::::

Now that the database is up and running we can start the Serverpod server. Because we are running the project for the first time, we need to create the database tables used by Serverpod. This is done through a [database migration](./06-concepts/06-database/11-migrations.md). An initial migration is already created for us, so all we need to do is pass the `--apply-migrations` flag when starting the server:

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

The quickest way to learn Serverpod is to follow our 30-minute **[Getting Started](01-get-started/01-creating-endpoints.md)** guide. This will give you an excellent overview of creating endpoints and models and working with the database. You will create a fun app that magically creates recipes from the ingredients you have in your fridge.
