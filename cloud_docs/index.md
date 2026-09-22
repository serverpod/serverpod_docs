---
title: Introduction
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
description: Serverpod Cloud is a managed hosting platform for Serverpod apps. Deploy from the command line. Cloud manages runtime, networking, database, and secrets.
---

# Introduction

Serverpod Cloud is a managed hosting platform for Serverpod apps with predictable pricing. You deploy your app with the Serverpod Cloud CLI or via CI/CD, and use the web console for account setup, billing, and project dashboards.

With [the Cloud CLI set up](/cloud/getting-started/installation), launch your first project with one command. No Dockerfile, no container config, no infrastructure setup:

```bash
serverpod cloud launch
```

## What Serverpod Cloud manages

- **Runtime and scaling.** Your app runs on a production runtime that scales as traffic grows.
- **Networking and TLS.** Encrypted endpoints, certificates, and load balancing work without configuration.
- **[Managed Postgres](/cloud/concepts/database)** (optional). Cloud can provision a production-grade Postgres database with automatic migrations and backups.
- **[File storage](/cloud/concepts/storage).** Cloud provisions a private and a public storage with every project, ready for the files your app uploads at runtime.
- **[Secrets and environment variables](/cloud/concepts/passwords-secrets-env-vars).** Manage sensitive values through the Cloud CLI. Values are encrypted where applicable.
- **[Custom domains](/cloud/concepts/custom-domains).** Attach your own domain. TLS certificates are provisioned and renewed. Cloud hosts both your backend and a preconfigured website for your Flutter web app.
- **[Logs and inspection](/cloud/concepts/logs).** View logs in the CLI or in Serverpod Insights, the desktop log viewer (requires a database).
- **Pub/sub and caching.** Supported through the Serverpod framework with a third-party Redis service you connect yourself. See [Use Redis for PubSub and caching](/cloud/guides/redis) for the typical setup.

## Where to go next

- [Set up the Cloud CLI](/cloud/getting-started/installation) to get the CLI ready and authenticate it.
- [Deploy your first app](/cloud/getting-started/launch) for a guided first deploy.
