---
sidebar_position: 1
title: Set up the Cloud CLI
sidebar_label: Set up the Cloud CLI
sidebar_class_name: sidebar-installation-icon
description: Run the Cloud CLI through the Serverpod CLI or install it on its own, then authenticate it with your account.
---

# Set up the Cloud CLI

The Serverpod Cloud CLI is the command-line tool that deploys and manages your projects on Serverpod Cloud. This page shows how to set it up and authenticate it with your account. After completing these steps, you're ready to deploy your first Serverpod app.

## Prerequisites

Before you start, make sure you have:

- **The Serverpod CLI, version 4.0 or later.** Follow the [Serverpod installation guide](/installation). To use the Cloud CLI without it, see [Install the Cloud CLI on its own](#install-the-cloud-cli-on-its-own).
- **A Serverpod Cloud account.** [Sign up for Cloud](https://console.serverpod.cloud/auth/signup).

## Run the Cloud CLI through the Serverpod CLI

The Serverpod CLI includes a `cloud` command that passes everything after it to the Cloud CLI. If the Cloud CLI isn't installed yet, the first `serverpod cloud` command installs it, so there's nothing else to set up.

Check that the Cloud CLI works:

```bash
serverpod cloud version
```

If the command prints a version number, the Cloud CLI is ready to use.

## Install the Cloud CLI on its own

If you'd rather not use the Serverpod CLI, install the Cloud CLI on its own with [Dart](https://dart.dev/get-dart#install):

```bash
dart install serverpod_cloud_cli
```

This adds the `scloud` executable, which takes the same commands as `serverpod cloud`. Use `scloud` wherever these docs show `serverpod cloud`, for example `scloud version` to verify the install.

## Authenticate the CLI

Log in to your Serverpod Cloud account from the terminal:

```bash
serverpod cloud auth login
```

This opens a browser window where you authenticate. Once authentication completes, the CLI is authorized to manage your Serverpod Cloud projects.
