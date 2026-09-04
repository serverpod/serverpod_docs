---
description: Scale Serverpod beyond a single process with server roles, isolates, Postgres indexes and pools, Redis, JWT auth, and when short RPCs beat long-lived streams.
---

# Scalability

When traffic jumps, the first bottlenecks are usually a blocked Dart event loop, an undersized database pool across many nodes, or shared state that only lives in one process. This page covers how Serverpod scales out request-serving instances, and what to change so CPU work, Postgres, auth, caching, and long-lived connections keep up.

Elastic scale-out of request handlers is already covered by [server roles](../server-fundamentals/running-your-server#choose-a-server-role). The sections below cover what still bites at high daily active users. Built-in read replicas and a Serverpod-owned Postgres tuning recipe are not available today; use cloud provider guides and the escape hatches noted here.

## How Serverpod scales

Each Serverpod process runs on one Dart isolate and one event loop. CPU-heavy work on that isolate delays request handling for every concurrent call on the same process.

HTTPS APIs with JWT auth are largely stateless and scale behind a load balancer. Features that keep in-process state (local caches, local server events, long-lived streams without a shared bus) need either sticky routing, Redis, or a redesign so state lives outside the process.

For serverless or auto-scaled fleets, run request nodes in the `serverless` role (or `monolith` if you accept in-process maintenance), and run `maintenance` on a schedule for future calls and health metric collection. See [Hosting elsewhere](../../deployments/custom-hosting/hosting-elsewhere#server-roles) and [Scheduling overview](../scheduling/overview).

## Split request and maintenance work

Use roles so request capacity and background work do not share the same scaling curve:

| Role | Serves requests | Runs future calls and health metrics |
| --- | --- | --- |
| `monolith` | Yes | Yes (continuous) |
| `serverless` | Yes | No |
| `maintenance` | No | Once, then exit |

```bash
dart run bin/main.dart --mode production --role serverless
```

Schedule a separate process in the `maintenance` role (for example once per minute) when request nodes run as `serverless`. On pure request nodes you can also set `futureCallExecutionEnabled` to `false`; see [Future call configuration](../scheduling/configuration).

## Offload CPU work to isolates

Image decoding, password hashing, and other CPU-bound work should not run on the request isolate. Use Dart's `Isolate.run` with plain data only:

```dart
Future<List<int>> buildThumbnail(List<int> bytes) async {
  return Isolate.run(() {
    // CPU-heavy decode, resize, and encode.
    // Pass only serializable data in and out.
    return processImage(bytes);
  });
}
```

Do not pass a `Session`, database connection, or Redis client into the isolate. Do I/O on the main isolate after the isolate returns.

There is no first-party Serverpod helper for this pattern. For sustained background workloads, raise `futureCall.concurrencyLimit` carefully (default `1`), or plan for a dedicated worker model as your product grows.

## Optimize Postgres queries

Declare indexes in your models for columns you filter and sort on. Without an index that covers an `ORDER BY`, Postgres may sort the full result set before applying `OFFSET` / `LIMIT`. See [Indexing](../data-and-the-database/database/indexing).

Prefer [cursor-based pagination](../data-and-the-database/database/pagination#cursor-based-pagination) over deep `offset` pages on large tables: filter with `where: (t) => t.id > lastId`, `orderBy` on `id`, and a `limit`.

At high scale, treat wide `OR` / `inSet` filters carefully, especially expressions like `(A OR B) AND (C OR D)`. Those shapes can explode into many indexed paths. Prefer a denormalized flag, a `UNION` of simpler indexed queries, or a narrower filter design when those queries dominate load.

## Size the connection pool

Each Serverpod process opens its own pool. The default `database.maxConnectionCount` is `10` (override with `SERVERPOD_DATABASE_MAX_CONNECTION_COUNT`). Across a fleet:

`(number of nodes × maxConnectionCount) + headroom ≤ Postgres max_connections`

Leave headroom for Insights, maintenance jobs, migrations, and admin tools. Unlimited pools (`0` or a negative value) are easy to misconfigure under auto-scaling. See [Database connection](../data-and-the-database/database/connection#configure-connection-pool-size).

## Scale Postgres itself

Assigning CPU, memory, and storage to Postgres is owned by your cloud provider (RDS instance class, Cloud SQL machine type, and similar). Point your operators at those guides rather than copying example parameters into Serverpod config.

Serverpod does not ship a read-only query API (there is no `MyTable.dbro`) and does not auto-route reads to replicas. Practical options today:

- Put a proxy or cloud read endpoint in front of the database (PgBouncer, RDS Proxy, or your provider's reader endpoint) when the proxy can classify traffic.
- Or wrap `session.db` with a [database interceptor](../data-and-the-database/database/database-interceptors) that routes selected reads yourself.

Treat third-party Postgres tuning examples as illustrative for your workload and instance size, not as Serverpod defaults.

## Prefer JWT for auth at scale

Modern projects use the [JWT token manager](../authentication/token-managers/jwt-token-manager). Access-token verification is local and does not query the database on every request. Refresh still hits the database; that path is far less frequent than ordinary API calls.

[Server-side sessions](../authentication/token-managers/managing-tokens) are the opposite tradeoff: a database lookup on validation, with immediate revocation. Prefer JWT when request volume is the constraint. Legacy auth key handlers that load a row per request do not belong on a high-QPS fleet.

## Share state across instances with Redis

Local caches (`session.caches.local` and `localPrio`) stay on one process. For values every instance must see, use the [global cache](../endpoints-and-apis/caching#the-global-cache-and-redis) with Redis enabled.

Cross-instance [server events](../endpoints-and-apis/server-events) need Redis as well. `MessageScope.global` requires Redis; without it, messaging stays local to the process that posted the event.

Enable Redis in production config when you run more than one request node that shares cache entries or broadcast events.

## Choose streams carefully

[Streaming endpoints](../endpoints-and-apis/streaming) keep a WebSocket session open for the life of the stream. That is the right model for chat, multiplayer, and live dashboards. At very high concurrent clients per node, long-lived connections consume file descriptors and complicate load balancing and autoscaling.

When fan-out volume is the problem, prefer short HTTPS RPCs for client-to-server work and an external push service (FCM, APNs, or similar) for server-to-client wakeups. Firebase in Serverpod is an auth identity provider, not a push delivery product; wire push as an integration outside the framework.

Keep `websocketPingInterval` (default 30 seconds) in mind under high connection counts: each open socket pays keepalive cost.

## Configuration cheat sheet

| Setting | Default | Why it matters at scale |
| --- | --- | --- |
| `role` / `SERVERPOD_SERVER_ROLE` | `monolith` | Split request nodes from maintenance work. |
| `database.maxConnectionCount` | `10` | Pool size times node count must fit Postgres. |
| `redis.enabled` | `false` in templates | Required for shared cache and global events. |
| `maxRequestSize` | `524288` | Large uploads increase memory pressure. |
| `websocketPingInterval` | `30` (seconds) | Keepalive cost under many open streams. |
| `futureCall.concurrencyLimit` | `1` | Caps background CPU and database load. |
| `sessionLogs.persistentEnabled` | mode-dependent | Extra database writes per request when on. |
| `healthCheckInterval` | about 1 minute | Metrics write load; aggressive liveness elsewhere can cascade restarts. |

Full keys and environment variables: [Configuration reference](../lookups/configuration-reference).

## Limits

- No first-class read-replica routing or `dbro` API; use a proxy or a database interceptor.
- No Serverpod-owned production Postgres tuning profile; follow your cloud database guide.
- Isolate offloading is a Dart convention in your code, not a framework API.
- Terraform and sample AWS layouts in community examples are starting points, not production scale blueprints.

## Related

- [Server roles](../server-fundamentals/running-your-server#choose-a-server-role): which processes serve traffic versus maintenance.
- [Hosting elsewhere](../../deployments/custom-hosting/hosting-elsewhere): roles and Docker on your own host.
- [Indexing](../data-and-the-database/database/indexing): declare indexes for filters and sorts.
- [Caching](../endpoints-and-apis/caching): local versus Redis-backed global cache.
- [Health checks](health-checks): probes and metric collection under load.
- [Configuration reference](../lookups/configuration-reference): every scale-related env var.
