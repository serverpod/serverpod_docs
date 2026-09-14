---
sidebar_label: Deploy to Serverpod Cloud
sidebar_class_name: sidebar-icon-deploy-to-cloud
description: Deploy your Serverpod Flutter backend to Serverpod Cloud in minutes, with zero configuration, a managed database, and TLS.
---

# Deploy to Serverpod Cloud

[Serverpod Cloud](/cloud) is the recommended way to host a Serverpod server. It is a fully managed platform built and maintained by the Serverpod team, designed specifically for Serverpod apps. You deploy in minutes with zero configuration, and there is no VM setup, container configuration, or infrastructure to orchestrate yourself.

:::info

Your first project includes a one-month free trial, with no credit card required.

:::

Cloud manages the production infrastructure for you:

- An optional production-grade Postgres database, with migrations applied automatically on each deploy.
- Networking, load balancing, and custom domains with TLS certificates.
- Server instances with predictable pricing. A Starter project runs on one instance. A Growth project runs on 1 to 20 instances.
- A secure key manager for your app secrets.

## Deploy from the terminal

You deploy with the Serverpod CLI:

1. Run `serverpod cloud launch`. It installs the Cloud CLI if needed. If you aren't signed in, it opens your browser so you can sign in.
2. For a new project, the Cloud Console opens so you can create it. The database setting is pre-filled from your server's config.
3. When prompted, select the custom passwords from `config/passwords.yaml` to copy to Cloud. The command then deploys your server.
4. Set any other secrets (API keys, OAuth credentials) with `serverpod cloud password set`. Then run `serverpod cloud deploy` so the server picks them up.

See the [Serverpod Cloud documentation](/cloud) for the full walkthrough, including secrets, custom domains, and logs.

To run the server yourself instead, see [Custom hosting](./custom-hosting/01-choosing-a-strategy.md).
