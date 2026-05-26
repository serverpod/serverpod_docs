---
sidebar_label: Choosing a strategy
description: Choose how to self-host a Serverpod server, on a server cluster, a serverless platform, or your own machine, as an alternative to Serverpod Cloud.
---

# Choosing a strategy

You can run a Serverpod server anywhere that supports a Dart process or a Docker container: a managed server cluster, a serverless platform, or your own machine. This page covers the trade-offs, and the following pages walk through each path. For the managed path, see [Serverpod Cloud](/cloud).

## Server cluster or serverless?

The two main options are running on a cluster of servers or on a serverless platform. Run on a **cluster** (such as Google Cloud Engine) if your server holds state. Run **serverless** (such as Google Cloud Run) if your server is stateless. An example of a stateful server is [Pixorama](https://pixorama.live), where the server keeps live state in memory. If you only make API calls that read and write a database, serverless may be the better fit.

|      | Server cluster                                                                            | Serverless                                                          |
| :--- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| Pros | All features are supported. Great for real-time communication. Cost-efficient at scale.   | Minimal starting cost. Easier configuration. Minimal maintenance.   |
| Cons | Slightly higher starting cost. More complex to set up.                                    | Limited feature set. The server cannot hold state.                  |

Serverless does not support:

- Future calls. (Possible to configure, but requires a more advanced setup.)
- Health metrics.
- On-server caching. Caching can still happen while a serverless instance stays warm, but it can be lost at any time. Caching with Redis is supported.
- In-memory state. Store shared state in an external service such as Postgres, Redis, or another API instead.

## Pick a guide

- [Google Cloud Engine with Terraform](./02-google-cloud-engine-terraform.md): server cluster on GCP.
- [Google Cloud Run with GCP Console](./03-google-cloud-run-console.md): serverless on GCP.
- [AWS EC2 with Terraform](./04-aws-ec2-terraform.md): server cluster on AWS.
- [Hosting elsewhere](./05-hosting-elsewhere.md): run Serverpod on any Dart or Docker host.
- [Community-supported deployments](./06-community-supported.md): tools built by the community.

## Approximate costs

A minimal **server cluster** on Google Cloud Platform:

| Service                  | Min cost |
| :----------------------- | :------- |
| Compute Engine Instance  | $7 / mo  |
| Cloud Load Balancing     | $19 / mo |
| Cloud SQL for PostgreSQL | $10 / mo |

A minimal **serverless** setup on Google Cloud Run, where you only pay for the traffic you serve and no load balancer is required:

| Service                  | Min cost |
| :----------------------- | :------- |
| Cloud Run                | $0 / mo  |
| Cloud SQL for PostgreSQL | $10 / mo |

:::info
These prices are rough approximations to give you a sense of hosting costs. Actual costs vary and change over time. Do your own research before provisioning infrastructure.
:::
