---
title: Install scloud
sidebar_label: Install scloud
sidebar_class_name: sidebar-installation-icon
description: Install scloud, Serverpod Cloud's command-line interface, and authenticate it with your account.
---

# Install scloud

This page shows how to install `scloud`, Serverpod Cloud's command-line interface, and authenticate it with your account. After completing these steps, you're ready to deploy your first Serverpod app.

## Prerequisites

Before installing the CLI, make sure you have:

- **Dart installed.** Follow [Dart's install guide](https://dart.dev/get-dart#install).
- **A Serverpod Cloud account.** [Sign up for Cloud](https://console.serverpod.cloud/auth/signup).

## Install the Serverpod Cloud CLI

Install `serverpod_cloud_cli` to make the `scloud` command available:

```bash
dart install serverpod_cloud_cli
```

Verify the CLI is available:

```bash
scloud version
```

If the command prints the installed version, the CLI is ready to use.

## Authenticate the CLI

Log in to your Serverpod Cloud account from the terminal:

```bash
scloud auth login
```

This opens a browser window where you authenticate. Once authentication completes, the CLI is authorized to manage your Serverpod Cloud projects.
