---
sidebar_label: Deploy to Serverpod Cloud
sidebar_class_name: sidebar-icon-deploy-to-cloud
description: Serverpod Cloud is the recommended way to deploy a Serverpod server, with the database, TLS, and scaling managed for you.
---

# Deploy to Serverpod Cloud

[Serverpod Cloud](/cloud) is the recommended way to host a Serverpod server, and the path the Serverpod team builds and maintains. You deploy from the terminal with the `scloud` CLI, and Cloud manages the rest:

- A Postgres database.
- A public domain with TLS certificates.
- Scaling and the underlying infrastructure.

The flow is short:

1. Install the `scloud` CLI.
2. From your server directory, run `scloud launch`. It creates the Cloud project, provisions the database, and deploys your server.
3. Set any app secrets (API keys, OAuth credentials) with `scloud password set`.

Migrations are applied automatically on each deploy.

See the [Serverpod Cloud documentation](/cloud) for the full walkthrough, including secrets, custom domains, and logs.

To run the server yourself instead, see [Custom hosting](./custom-hosting/01-choosing-a-strategy.md).
