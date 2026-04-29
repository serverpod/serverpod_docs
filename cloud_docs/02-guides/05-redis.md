---
title: Redis (PubSub and caching)
---

# Redis (PubSub and caching)

Serverpod Cloud does not yet provide Redis natively. You can use a third-party Redis service and point your Serverpod app at it. This guide uses [Upstash](https://upstash.com) as an example; other Redis-compatible providers that support TLS and password auth will work with the same configuration pattern.

Serverpod uses Redis for **distributed caching** and **PubSub** when running across multiple servers. The connection is configured via environment variables and a password.

## Prerequisites

- Completed the **Installation** steps (`scloud` installed and authenticated).
- A Serverpod Cloud project already deployed (or ready to deploy).
- Linked your project (run from your server directory, or use `-p your-project-id`).

## Create a Redis database on Upstash

1. Sign up or log in at [Upstash](https://console.upstash.com/).
2. Click **Create Database**.
3. Give the database a name and choose **Primary Region**. For Serverpod Cloud, the closest option is `EU-CENTRAL-1` (Frankfurt).
4. Choose a plan and create the database.
5. On the database page, open **REST API** or **Connect to your database** and note:
   - **Endpoint** (host)
   - **Port**
   - **Password** (copy it; you will not see it again in full in some views).

Upstash enables TLS for all databases and does not allow disabling it, so you will set `SERVERPOD_REDIS_REQUIRE_SSL` to `true` below.

## Set the Redis password in Serverpod Cloud

Serverpod expects the Redis password under the built-in key `redis`. Set it with the Serverpod Cloud CLI:

```bash
scloud password set redis "YOUR_UPSTASH_PASSWORD"
```

Use the exact password from the Upstash database page.

## Set Redis connection variables

Configure host, port, enable Redis, and require SSL using environment variables. From your server project directory (or with `-p your-project-id`):

```bash
scloud variable create SERVERPOD_REDIS_HOST "YOUR_UPSTASH_ENDPOINT"
scloud variable create SERVERPOD_REDIS_PORT "YOUR_UPSTASH_PORT"
scloud variable create SERVERPOD_REDIS_ENABLED "true"
scloud variable create SERVERPOD_REDIS_REQUIRE_SSL "true"
```

Replace `YOUR_UPSTASH_ENDPOINT` with the Upstash endpoint (host only, no `rediss://` or port). Replace `YOUR_UPSTASH_PORT` with the port number as a string (most likely `6380` for Upstash).

:::note

If your Redis provider uses a username (e.g. ACL), you can set:

```bash
scloud variable create SERVERPOD_REDIS_USER "default"
```

:::

## Redeploy

Environment variables and passwords are applied when your server deploys. Redeploy so the new Redis config is used:

```bash
scloud deploy
```

After a successful deploy, your server will use Upstash for Redis-backed caching and PubSub.

## Related documentation

- [Serverpod configuration](https://docs.serverpod.dev/concepts/configuration) – Redis options and environment variables
- [Serverpod caching](https://docs.serverpod.dev/concepts/caching) – Local and Redis-backed caches
- [Upstash: Connect your client](https://upstash.com/docs/redis/howto/connectclient) – Connection details and TLS
- [Passwords and environment variables](./02-passwords.md) – How Serverpod Cloud injects passwords and variables
