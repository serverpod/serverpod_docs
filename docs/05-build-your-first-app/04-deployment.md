---
title: Deploy your app
sidebar_class_name: sidebar-icon-get-started-step-4
slug: /get-started/deployment
description: Deploy your Serverpod recipe app to Serverpod Cloud with the scloud CLI, then explore other hosting options.
---

<!-- markdownlint-disable MD025 -->

# Deploy your app

Your recipe app runs locally. The last step is to put it online. The recommended path is [Serverpod Cloud](/cloud), which hosts your server and database with zero configuration.

## Deploy to Serverpod Cloud

Install the Serverpod Cloud CLI:

```bash
$ dart pub global activate serverpod_cloud_cli
```

From your project's root folder, launch the app. This creates a Cloud project, provisions a managed Postgres database (separate from the embedded one `serverpod start` runs locally), and deploys your server along with the web build of your app:

```bash
$ scloud launch
```

The first upload includes your Flutter web build and can exceed the default timeout on a slower connection. If the upload times out, retry with a higher limit (in seconds), for example, `scloud launch --timeout 600`.

Your Gemini API key lives in `passwords.yaml`, which stays on your machine and is never deployed. Set it as a secret in Cloud so the deployed server can call Gemini:

```bash
$ scloud password set geminiApiKey
```

Whenever you make changes later, redeploy with:

```bash
$ scloud deploy
```

See the [Serverpod Cloud documentation](/cloud) for the full walkthrough, including custom domains, logs, and your free trial.

## Other deployment options

Prefer to host the server yourself? See [Custom hosting](../08-deployments/custom-hosting/01-choosing-a-strategy.md) for running on a server cluster, a serverless platform, or your own machine.

## What you've built

You've built and deployed a full-stack app with Flutter and Serverpod:

- A custom endpoint that calls an external API from the server.
- A type-safe data model shared between the server and the Flutter app.
- Persistent storage with the database.
- A Flutter app that talks to your server through the generated client.

We're excited to see what you'll build next. If you need help, join the [Discord community](https://serverpod.dev/discord) or ask in our [community on GitHub](https://github.com/serverpod/serverpod/discussions). To go deeper into any topic, browse the [Concepts](../concepts/endpoints-and-apis) section.
