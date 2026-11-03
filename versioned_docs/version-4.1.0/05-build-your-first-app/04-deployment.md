---
title: Deploy your app
sidebar_class_name: sidebar-icon-get-started-step-4
slug: /get-started/deployment
description: Deploy your Serverpod recipe app to Serverpod Cloud with the Serverpod CLI, then explore other hosting options.
---

<!-- markdownlint-disable MD025 -->

# Deploy your app

Your recipe app runs locally. The last step is to put it online. The recommended path is [Serverpod Cloud](/cloud), which hosts your server and database with zero configuration.

## Deploy to Serverpod Cloud

From your project's root folder, run:

```bash
$ serverpod cloud launch
```

The command walks you through these steps:

1. If the Serverpod Cloud CLI isn't installed yet, `serverpod cloud` installs it first.
2. If you aren't signed in, your browser opens so you can sign in.
3. For a new project, the Cloud Console opens so you can create it. Keep the database enabled there, because the recipe app stores its recipes in it. Cloud provisions a managed Postgres database, separate from the embedded one `serverpod start` runs locally.
4. You choose which custom passwords from `config/passwords.yaml` to copy to Cloud. That file stays on your machine and is never deployed. Select `geminiApiKey` so the deployed server can call Gemini. It isn't selected by default, because it sits in the `development` section.
5. The command deploys your server along with the web build of your app.

The first upload includes your Flutter web build and can exceed the default timeout on a slower connection. If the upload times out, retry with a higher limit, for example, `serverpod cloud launch --timeout 600s`.

If you didn't select `geminiApiKey`, set the key as a secret. Then redeploy so the server picks it up:

```bash
$ serverpod cloud password set geminiApiKey "your-gemini-api-key"
$ serverpod cloud deploy
```

Whenever you make changes later, redeploy with:

```bash
$ serverpod cloud deploy
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
