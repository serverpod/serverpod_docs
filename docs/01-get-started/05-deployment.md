# Deploying Serverpod

## Introduction

## Server Requirements

Since Serverpod is written in Dart, it can be compiled into native code and runs on any platform that is supported by the [Dart tooling](https://dart.dev/get-dart#system-requirements).

Many users will want to deploy Serverpod using Docker. There is a basic Dockerfile included in the project that can be used to build a Docker image. This image can then be run on any platform that supports Docker.

If you don't use Docker, you will need [compile the Dart code](https://dart.dev/tools/dart-compile) and copy any assets and configuration files to the server since [asset bundling is not yet supported by Dart](https://github.com/dart-lang/sdk/issues/55195).

## Server configuration

By default Serverpod is active on three ports:

- **8080**: The main port for the server - this is where the generated client will connect to.
- **8081**: The port for connecting with the [Serverpod Insights](../tools/insights) tooling. You may want to restrict which IP addresses can connect to this port.
- **8082**: The built in webserver is running on this port.

You will also need to configure the database connection in the `config/production.yaml` file and **securely** provide the `config/passwords.yaml` file to the server.

## Health check from load balancer

The **8080** port returns a basic health check response. You can use this to check if the server is running and is healthy.

## Deploying with Serverpod Cloud

Serverpod Cloud is a managed service that allows you to deploy your Serverpod applications without having to worry about the underlying infrastructure.

Serverpod Cloud is currently in private beta. Request access by [filling out this form](https://docs.google.com/forms/d/e/1FAIpQLSfBteB7hoLJ2xPgs0CXj9RpLt2gogvJZSpEv2ye8ziWuXfGFA/viewform). Once you have access, you can deploy your Serverpod applications to the cloud in just a few minutes and with zero configuration.
