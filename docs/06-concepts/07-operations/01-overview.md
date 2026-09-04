---
description: Operations covers running a Serverpod server in production, seeing what it is doing through logs, proving it is healthy, securing its traffic, and catching exceptions.
---

# Overview

Once your server is written, the work shifts from building features to running them. This section covers what you need after deployment: seeing what the server is doing, proving to a host that it is healthy, measuring it under load, securing the traffic it accepts, and finding out when something breaks.

Everything here works the same whether you deploy to [Serverpod Cloud](../../deployments/deploy-to-serverpod-cloud) or [host it yourself](../../deployments/custom-hosting/choosing-a-strategy), though the two differ in how much is set up for you.

## What each page covers

- **[Logging](logging)**: what the server records for every call, where those records go, and how to keep the log tables from growing without bound.
- **[Health checks](health-checks)**: the HTTP endpoints a host calls to decide whether your server is alive and ready for traffic, plus the metrics Serverpod collects about itself.
- **[Load testing](load-testing)**: measuring how a production-like server behaves under concurrent traffic, with Locust or the generated client.
- **[Security and TLS](security-and-tls)**: how traffic to your server is encrypted, and when you need to configure that yourself.
- **[Exception monitoring](exception-monitoring)**: reporting exceptions to a monitoring service as they happen. This one is an experimental API.

## Related

- [Configuration](../server-fundamentals/configuration): the config files and environment variables every setting on these pages is read from.
- [Sessions](../endpoints-and-apis/sessions): the object that produces most of what ends up in your logs.
- [Caching](../endpoints-and-apis/caching): storing values in server memory or Redis.
- [Run code on shutdown](../server-fundamentals/running-your-server#run-code-on-shutdown): cleanup work when the server stops.
- [Insights](../../tools/insights): the companion app for reading logs and metrics.
