---
sidebar_label: Deploy to Serverpod Cloud
sidebar_class_name: sidebar-icon-deploy-to-cloud
description: Deploy your Serverpod Flutter backend to Serverpod Cloud in minutes, with zero configuration and a managed database, TLS, and scaling.
---

# Deploy to Serverpod Cloud

[Serverpod Cloud](/cloud) is the recommended way to host a Serverpod server. It is a fully managed platform built and maintained by the Serverpod team, designed specifically for Serverpod apps. You deploy in minutes with zero configuration, and there is no VM setup, container configuration, or infrastructure to orchestrate yourself.

Your first project includes a one-month free trial, with no credit card required.

Cloud manages the production infrastructure for you:

- An optional production-grade Postgres database, with migrations applied automatically on each deploy.
- Networking, load balancing, and custom domains with TLS certificates.
- Automatic scaling to any size, with predictable pricing.
- A secure key manager for your app secrets.

## Deploy from the terminal

You deploy with the `scloud` CLI:

1. Install the `scloud` CLI.
2. Run `scloud launch`. It creates the Cloud project, provisions a database if you enable one, and deploys your server.
3. Set any app secrets (API keys, OAuth credentials) with `scloud password set`.

See the [Serverpod Cloud documentation](/cloud) for the full walkthrough, including secrets, custom domains, and logs.

To run the server yourself instead, see [Custom hosting](./custom-hosting/01-choosing-a-strategy.md).
