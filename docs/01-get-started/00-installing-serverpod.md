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

To make use of Serverpods ORM capabilities, you need to have access to a PostgreSQL database. We recommend using Docker to run PostgreSQL locally. You will need to install Docker on your machine. You can find instructions for installing Docker on the official [Docker website](https://docs.docker.com/get-docker/). Each Serverpod projects comes with its own 'docker-compose.yaml' so there is no need for you to install containers just now. We will guide you through the process in the next section.

:::info
Check your Docker installation by running the following command in your terminal:

```bash
$ docker --version
```

If you are using Docker desktop and you are getting an error here, make sure that Docker is running. You can check this by looking for the Docker icon in your system tray or taskbar. If it's not running, start Docker Desktop and try again.
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

### [Optional] Install the VS Code Extension

//TODO(dkbast): can we make the cli install the extension for you?
The Serverpod VS Code extension makes it easy to work with your Serverpod projects. It provides real-time diagnostics and syntax highlighting for model files in your project.
![Serverpod extension](/img/syntax-highlighting.png)

You can install the extension from the VS Code Marketplace: **[Serverpod extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod)**

### [Optional] Install Serverpod Insights

//TODO(dkbast): can we make the cli install insights for you?
**[Serverpod Insights](tools/insights)** is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.
![Serverpod Insights](https://serverpod.dev/assets/img/serverpod-screenshot.webp)

## Creating a New Project

To create a new Serverpod project, you can use the `serverpod create` command. This command will generate a new project with a server, a client and a Flutter app.
The project will be created in a new directory with the name you specify. For example, to create a new project called `my_counter`, run the following command:

```bash
$ serverpod create my_counter
```

:::tip
The name of the project must be a valid Dart package name. This means it must start with a lowercase letter and can only contain lowercase letters, numbers, and underscores. For example, `my_counter` is a valid name, but `MyCounter` is not.
:::

To run your new project you need to first start the docker compose file that is included in the project. This will start a PostgreSQL database and a Redis server. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ docker-compose up
```

This will start the PostgreSQL database and Redis server in the background. You can stop the servers by pressing `Ctrl+C` in the terminal. If you want to run the servers in the background, you can use the `-d` flag:

```bash
$ docker-compose up -d
```

This will start the servers in detached mode, meaning they will run in the background and you can close the terminal without stopping them. You can stop the servers by running:

```bash
$ docker-compose down
```

Now that the database is up and running we can start the server. Because our default project already contains endpoints and tables in the database, we need to run the migrations first. This will create the tables in the database. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ serverpod generate
$ serverpod create-migrations
```

This will create the migrations in the `migrations` directory and also generate the models and client code. You can now run the server by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_server
$ dart run bin/main.dart --apply-migrations
```

This will start the server and apply the migrations to the database. You can now access the server at `http://localhost:8080`. It should look something like this:

![Serverpod web](https://serverpod.dev/assets/img/serverpod-web.png)

//TODO: You can also access the Swagger UI at `http://localhost:8080/docs` to see the available endpoints and test them.

Now let's run the client. You can do this by running the following command in the root directory of your project:

```bash
$ cd my_counter/my_counter_flutter
$ flutter run -d chrome
```

This will start the Flutter app in your browser. It should look something like this:

![Example Flutter App](https://serverpod.dev/assets/img/flutter-example-web.png)

## Next Steps

Now that you have installed Serverpod and created a new project, you can start building your application. We prepared a [build your first app](build-your-first-app) tutorial to help you get started.

In this tutorial, you will learn how to create a simple TODO app using Serverpod and Flutter. You will learn how to create endpoints, work with the database, and use the client code generated by Serverpod.

You can also check out the [Serverpod Mini](get-started-with-mini) section to learn how to use Serverpod Mini, a lightweight version of Serverpod that is designed for small projects and prototypes which don't require a full server setup.
