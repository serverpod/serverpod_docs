---
sidebar_label: Installation
sidebar_class_name: sidebar-installation-icon
---

# Installation

This page shows how to install `scloud`, Serverpod Cloud's command line interface, and how to authenticate it with your account. After completing these steps, you're ready to deploy your first Serverpod server.

## Prerequisites

Before installing the CLI, make sure you have the following:

- **Dart installed** – Follow the official guide: [https://dart.dev/get-dart#install](https://dart.dev/get-dart#install)
- **A Serverpod Cloud account** – Sign up at [https://console.serverpod.cloud/auth/signup](https://console.serverpod.cloud/auth/signup)

## Install the Serverpod Cloud CLI

Install the `serverpod_cloud_cli` package globally using Dart to make the `scloud` command available:

```bash
dart pub global activate serverpod_cloud_cli
```

After installation, verify that the CLI is available:

```bash
scloud version
```

If the command prints the installed version, the CLI is ready to use.

## Authenticate the CLI

Log in to your Serverpod Cloud account from the terminal:

```bash
scloud auth login
```

This command opens a browser window where you can authenticate your account. Once authentication completes, the CLI is authorized to manage your Serverpod Cloud projects.
