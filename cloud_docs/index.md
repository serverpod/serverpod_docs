---
title: Introduction
sidebar_position: -1
sidebar_label: Introduction
sidebar_class_name: sidebar-introduction-icon
---

# Introduction

**Serverpod Cloud** is a fully managed hosting platform for Serverpod apps. It lets you deploy and run your Serverpod backend from the command line or via CI/CD. The platform manages all infrastructure needed to run your service in production. It can seamlessly scale to any size, and pricing is predictable. Serverpod Cloud handles networking, load balancing, custom domain names, and your database.

This documentation covers account setup, installing and using the `scloud` command, deploying your server, configuring environments, and operating your services in production.

## Zero-configuration deployments

Deploy your Serverpod server directly from your project directory using the command line or integrate it into your CI/CD pipeline. No manual VM setup, container configuration, or infrastructure orchestration is needed.

```bash
### Install the CLI tool
dart pub global activate serverpod_cloud_cli

### Launch your Serverpod project
scloud launch
```

## Managed runtime and networking

Your deployment automatically receives a production-ready runtime environment with:

- Encrypted endpoints and certificates that work reliably with high loads and streaming data.
- Load balancing and automatic scaling to any size.
- Health checks for your backend and related services.

This allows your server to run reliably without configuring networking or reverse proxies.

## Managed database (optional)

Serverpod Cloud can provision and manage a production-grade PostgreSQL database for your project. When enabled, database migrations are applied automatically during deployment. All authentication tokens and keys are fully managed and configured, and your database is frequently backed up.

## Secure passwords and secrets

Manage secrets, passwords, and environment variables through the `scloud` CLI. Sensitive values are encrypted where applicable, allowing you to easily connect to 3rd party services while keeping your app's configuration out of your source code.

## Custom domains and web server

Attach your own domain to a deployment. TLS certificates are automatically provisioned and renewed. Serverpod Cloud will host both your backend service and a website preconfigured for a Flutter web app.

## Insights, logs, and diagnostics

Serverpod Cloud comes with Serverpod Insights, our visual log viewer, preconfigured (requires a database). This gives you access to our world-class logging and server monitoring.

## PubSub and caching

The Serverpod framework has built-in support for sending messages between your servers, and caching objects works out of the box. We are working on building a service native to Serverpod Cloud; in the meantime, it's easy to configure a 3rd party service.

## File storage buckets

A fully managed file upload and storage service is planned for Serverpod Cloud. While it's being built, you can still use a 3rd party service, such as GCP or AWS, as these (and other compatible services) are supported by the Serverpod framework.
