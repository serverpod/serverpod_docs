---
description: Operations covers running Serverpod in production through logs, health checks, TLS, exception monitoring, and scaling past a single process.
---

# Overview

Once your server is written, the work shifts from building features to running them. This section covers what you need after deployment: seeing what the server is doing, proving to a host that it is healthy, securing the traffic it accepts, finding out when something breaks, and scaling past a single process.

Everything here works the same whether you deploy to [Serverpod Cloud](../../deployments/deploy-to-serverpod-cloud) or [host it yourself](../../deployments/custom-hosting/choosing-a-strategy), though the two differ in how much is set up for you.

## What each page covers

- **[Logging](logging)**: what the server records for every call, where those records go, and how to keep the log tables from growing without bound.
- **[Health checks](health-checks)**: the HTTP endpoints a host calls to decide whether your server is alive and ready for traffic, plus the metrics Serverpod collects about itself.
- **[Security and TLS](security-and-tls)**: how traffic to your server is encrypted, and when you need to configure that yourself.
- **[Exception monitoring](exception-monitoring)**: reporting exceptions to a monitoring service as they happen. This one is an experimental API.
- **[Scalability](scalability)**: roles for scale-out, isolates for CPU work, Postgres and connection pools, Redis, JWT auth, and streaming tradeoffs.

## Related

- [Configuration](../server-fundamentals/configuration): the config files and environment variables every setting on these pages is read from.
- [Sessions](../endpoints-and-apis/sessions): the object that produces most of what ends up in your logs.
- [Caching](../endpoints-and-apis/caching): storing values in server memory or Redis.
- [Run code on shutdown](../server-fundamentals/running-your-server#run-code-on-shutdown): cleanup work when the server stops.
- [Insights](../../tools/insights): the companion app for reading logs and metrics.
