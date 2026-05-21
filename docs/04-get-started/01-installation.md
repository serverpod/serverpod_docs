---
sidebar_label: Installation
sidebar_class_name: sidebar-icon-get-started-step-1
slug: /installation
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

Serverpod supports **SQLite** as a database, which means you can develop locally without installing Docker or running a separate database server. You can also use **Postgres** which includes support for vectors and other advanced features.

<details>

<summary>Using **Postgres** locally instead of SQLite</summary>

If you want to use Postgres rather than SQLite on your machine, install **[Docker](https://docs.docker.com/get-docker/)** and use it to run PostgreSQL locally. Each Serverpod project ships with its own `docker-compose.yaml`, so you do not need to assemble custom containers. The **[Getting Started](./04-creating-endpoints.md)** guide walks you through the details.

Check your Docker installation by running the following command in your terminal:

```bash
$ docker info
```

If you are using Docker Desktop and you get an error, make sure that Docker is running. You can check this by looking for the Docker icon in your system tray or taskbar. If it's not running, start Docker Desktop and try again.

</details>

### Install Serverpod

Serverpod is installed using the Dart package manager. To install Serverpod, run the following command in your terminal:

```txt
$ dart install serverpod_cli 3.5.0-beta.6
```

This command will install the Serverpod command-line interface (CLI) globally on your machine. You can verify the installation by running:

```bash
$ serverpod
```

If everything is correctly configured, the help for the `serverpod` command is now displayed.

:::warning

If the Serverpod CLI is already installed globally, deactivate it before installing or upgrading:

```txt
$ dart pub global deactivate serverpod_cli
```

:::

### Install the VS Code extension (recommended)

The Serverpod VS Code extension makes it easy to work with your Serverpod projects. It provides real-time diagnostics and syntax highlighting for model files in your project.
![Serverpod extension](/img/syntax-highlighting.png)

You can **[install the extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod)** from the VS Code Marketplace or search for _Serverpod_ from inside VS Code.

### Install Serverpod Insights (optional)

**[Serverpod Insights](../10-tools/01-insights.md)** is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.
![Serverpod Insights](/img/serverpod-insights.webp)
