---
sidebar_label: Deploy to Serverpod Cloud
sidebar_class_name: sidebar-icon-deploy-to-cloud
description: Serverpod Cloud is the recommended way to deploy a Serverpod server, with the database, TLS, and scaling managed for you.
---

# Deploy to Serverpod Cloud

[Serverpod Cloud](/cloud) is the recommended way to host a Serverpod server. It is a fully managed platform built and maintained by the Serverpod team, designed specifically for Serverpod apps. Because it understands Serverpod, you deploy in minutes with zero configuration, and there is no VM setup, container configuration, or infrastructure to orchestrate yourself.

Cloud manages the production infrastructure for you:

- A production-grade Postgres database, with migrations applied automatically on each deploy.
- Networking, load balancing, and custom domains with TLS certificates.
- Automatic scaling to any size, with predictable pricing.
- A secure key manager for your app secrets.

## Deploy from the terminal

You deploy with the `scloud` CLI:

1. Install the `scloud` CLI.
2. Run `scloud launch`. It creates the Cloud project, provisions the database, and deploys your server.
3. Set any app secrets (API keys, OAuth credentials) with `scloud password set`.

See the [Serverpod Cloud documentation](/cloud) for the full walkthrough, including secrets, custom domains, and logs.

To run the server yourself instead, see [Custom hosting](./custom-hosting/01-choosing-a-strategy.md).
