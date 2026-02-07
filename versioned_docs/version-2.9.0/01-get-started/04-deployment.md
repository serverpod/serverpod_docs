---
sidebar_label: 4. Deploying Serverpod
---

# Deploying Serverpod

## Server requirements

Serverpod is written in Dart and compiles to native code, allowing it to run on any platform supported by the [Dart tooling](https://dart.dev/get-dart#system-requirements).

Many users prefer to deploy Serverpod using Docker. The project includes a basic Dockerfile that you can use to build a Docker image, which can then be run on any Docker-compatible platform.

For non-Docker deployments, you'll need to [compile the Dart code](https://dart.dev/tools/dart-compile) and manually copy your assets and configuration files to the server. This manual step is necessary since [asset bundling is not yet supported by Dart](https://github.com/dart-lang/sdk/issues/55195).

## Server configuration

By default Serverpod is active on three ports:

- **8080**: The main port for the server - this is where the generated Flutter app will connect to.
- **8081**: The port for connecting with the [Serverpod Insights](../09-tools/01-insights.md) tooling. You may want to restrict which IP addresses can connect to this port.
- **8082**: The built in webserver is running on this port.

You will also need to configure the database connection in the `config/production.yaml` file and **securely** provide the `config/passwords.yaml` file to the server.

## Health checks

The server exposes a health check on the root endpoint `/` on port **8080**. Load balancers and monitoring systems can use this endpoint to verify that your server is running and healthy. The endpoint returns a basic health status response.

## Deploying with Serverpod Cloud

Serverpod Cloud is a managed service that allows you to deploy your Serverpod applications without having to worry about the underlying infrastructure.

Serverpod Cloud is currently in private beta. Request access by [filling out this form](https://docs.google.com/forms/d/e/1FAIpQLSfBteB7hoLJ2xPgs0CXj9RpLt2gogvJZSpEv2ye8ziWuXfGFA/viewform). Once you have access, you can deploy your Serverpod applications to the cloud in just a few minutes and with zero configuration.

## Other deployment options

Check out [choosing a deployment strategy](../07-deployments/01-deployment-strategy.md) for more information on how to deploy your Serverpod application to other platforms.
