# Health checks

Serverpod provides a complete health check system that allows you to monitor the health of your server and your dependencies through Kubernetes-style HTTP endpoints (`/livez`, `/readyz`, `/startupz`) - each with a specific purpose that helps orchestrators (like Kubernetes) make informed decisions about container lifecycle and traffic routing.

## Endpoints

### Liveness Probe `/livez`

The liveness probe answers: "Should this container be killed and restarted?".

- Returns `200 OK` if the server process can respond.
- Only fails if the process is fundamentally broken.
- A failed liveness check triggers a pod restart.
- Does not check dependencies (database, Redis, etc.).

This endpoint is intentionally permissive. It should only fail when the process is truly unrecoverable (deadlocks, memory corruption, infinite loops). Transient issues like slow database queries or temporary network blips should not trigger restarts.

**Example:**

```bash
curl http://localhost:8080/livez
# Returns: 200 OK
```

### Readiness Probe `/readyz`

The readiness probe answers: "Should traffic be routed to this container?".

- Returns `200 OK` if all dependencies are healthy.
- Returns `503 Service Unavailable` if any critical dependency is unavailable.
- Checks database connectivity, Redis connectivity (if configured), and custom health indicators.

A failed readiness check stops traffic routing without restarting the pod. This allows the pod to recover from temporary issues without receiving extra pressure from new traffic.

**Example:**

```bash
curl http://localhost:8080/readyz
# Returns: 200 OK or 503 Service Unavailable
```

### Startup Probe `/startupz`

The startup probe answers: "Has this container finished initializing?".

- Returns `200 OK` once server initialization (including migrations) is complete.
- Prevents premature liveness/readiness checks during boot.
- Kubernetes waits for this to pass before starting liveness/readiness probes.

This endpoint will determine when the pod is ready to receive traffic. While this endpoint is failing, the orchestrator will not route any traffic to the pod.

**Example:**

```bash
curl http://localhost:8080/startupz
# Returns: 200 OK once startup is complete
```

## Response format

Health endpoints return JSON responses following the [RFC draft for Health Check Response Format](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06).

- **Unauthenticated requests** receive only HTTP status codes (no body) for security.
- **Authenticated requests** receive detailed JSON responses.

The format of the response is as follows:

```json
{
  "status": "pass", // or "fail"
  "checks": {
    "database:connection": [ // The name of the check.
      {
        "componentId": "primary-db", // The ID of the component.
        "componentType": "datastore", // The type of the component.
        "status": "pass", // or "fail"
        "observedValue": 12, // Optional value of the check.
        "observedUnit": "ms", // Optional unit of the check.
        "output": "Connection normal", // Optional output of the check.
        "time": "2026-01-14T10:30:00Z" // The time of the check.
      }
    ],
    "redis:latency": [
      {
        "componentId": "cache-cluster",
        "componentType": "datastore",
        "status": "pass",
        "observedValue": 3,
        "observedUnit": "ms",
        "time": "2026-01-14T10:30:00Z"
      }
    ]
  }
}
```

## Built-in health indicators

Serverpod automatically registers health indicators based on your configuration:

- **ServerpodStartupIndicator** - Tracks server initialization completion.
- **DatabaseHealthIndicator** - Checks PostgreSQL connectivity (if database is configured).
- **RedisHealthIndicator** - Checks Redis connectivity (if Redis is enabled).

## Custom health indicators

You can add custom health indicators to check external services, microservices, or other dependencies.

### Creating a custom indicator

Create a class that extends `HealthIndicator`:

```dart
import 'package:serverpod/serverpod.dart';

class StripeApiIndicator extends HealthIndicator<double> {
  @override
  String get name => 'stripe:api';

  @override
  String get componentType => HealthComponentType.component.name;

  @override
  String get observedUnit => 'ms';

  @override
  Duration get timeout => const Duration(seconds: 3);

  @override
  Future<HealthCheckResult> check() async {
    final stopwatch = Stopwatch()..start();
    try {
      // Perform your health check
      await stripeClient.ping();
      stopwatch.stop();

      return pass(
        observedValue: stopwatch.elapsedMilliseconds.toDouble(),
      );
    } catch (e) {
      return fail(output: 'Stripe API unavailable: $e');
    }
  }
}
```

### Registering custom indicators

Register your indicators when creating the Serverpod instance:

```dart
final pod = Serverpod(
  args,
  Protocol(),
  Endpoints(),
  healthConfig: HealthConfig(
    cacheTtl: Duration(seconds: 2),
    additionalReadinessIndicators: [
      StripeApiIndicator(),
      InventoryServiceIndicator(),
    ],
    additionalStartupIndicators: [
      CacheWarmupIndicator(),
    ],
  ),
);
```

### Configuration options

The `HealthConfig` class provides the following options:

- **`cacheTtl`** - How long to cache health check results (default: 1 second). Prevents "thundering herd" during high-frequency probing.
- **`additionalReadinessIndicators`** - Custom indicators checked by `/readyz`.
- **`additionalStartupIndicators`** - Custom indicators checked by `/startupz`.

Each indicator can specify its own timeout via the `timeout` getter (default: 5 seconds). This prevents slow checks from blocking the entire health endpoint.

## Health metrics collection

Independently from the health check endpoints, Serverpod also collects health metrics about the server and its dependencies while running. Metrics like CPU, memory usage and response time to the database are stored in the database every minute in the `serverpod_health_metric` and `serverpod_health_connection_info` tables. Such metrics can be graphically visualized through Serverpod Insights.

### Adding custom metrics

Sometimes it is helpful to add custom health metrics. This can be for monitoring external services or internal processes within your Serverpod. To set up your custom metrics, you must create a `HealthCheckHandler` and register it with your Serverpod.

```dart
// Create your custom health metric handler.
Future<List<ServerHealthMetric>> myHealthCheckHandler(
    Serverpod pod, DateTime timestamp) async {
  // Actually perform some checks.

  // Return a list of health metrics for the given timestamp.
  return [
    ServerHealthMetric(
      name: 'MyMetric',
      serverId: pod.serverId,
      timestamp: timestamp,
      isHealthy: true,
      value: 1.0,
    ),
  ];
}
```

Register your handler when you create your Serverpod object.

```dart
final pod = Serverpod(
    args,
    Protocol(),
    Endpoints(),
    healthCheckHandler: myHealthCheckHandler,
  );
```

Once registered, your health check handler will be called once a minute to perform any health checks that you have configured. You can view the status of your checks in Serverpod Insights or in the database.
