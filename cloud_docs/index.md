---
title: Introduction
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
description: Serverpod Cloud is a managed hosting platform for Serverpod apps. Deploy from the command line; Cloud manages runtime, networking, database, and secrets.
---

# Introduction

Serverpod Cloud is a managed hosting platform for Serverpod apps. You deploy and manage your app with the `scloud` command-line interface; a web console covers project management, billing, and inspection.

```bash
dart install serverpod_cloud_cli
scloud launch
```

## What Cloud manages

- **Runtime and scaling.** Your app runs on a production runtime that scales automatically.
- **Networking and TLS.** Encrypted endpoints and certificates work without configuration.
- **Managed Postgres** (optional). Cloud can provision a production-grade Postgres database with automatic migrations and backups.
- **Secrets and environment variables.** Manage sensitive values through `scloud`; values are encrypted where applicable.
- **Custom domains.** Attach your own domain; TLS certificates are provisioned and renewed. Cloud hosts both your backend and a preconfigured website for your Flutter web app.
- **Logs and inspection.** View logs in the CLI or in Serverpod Insights, the desktop log viewer (requires a database).
- **PubSub, caching, and file storage.** Supported through the Serverpod framework using third-party services today; managed services are on the roadmap.

## Where to go next

- [Install scloud](/cloud/getting-started/installation) to set up the CLI.
- [Deploy your first app](/cloud/getting-started/launch) for a guided first deploy.
