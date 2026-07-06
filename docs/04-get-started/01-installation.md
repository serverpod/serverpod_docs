---
sidebar_label: Installation
sidebar_class_name: sidebar-installation-icon
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

### Install Serverpod

Serverpod is installed using the Dart package manager. To install Serverpod, run the following command in your terminal:

```txt
$ dart install serverpod_cli 4.0.0-beta.0
```

This command will install the Serverpod command-line interface (CLI) globally on your machine. You can verify the installation by running:

```bash
$ serverpod version
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
