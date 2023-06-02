# Health checks
Serverpod automatically performs health checks while running. It measures CPU and memory usage and the response time to the database. The metrics are stored in the database every minute in the serverpod_healt_metric and serverpod_health_connection_info tables. However, the best way to visualize the data is through Serverpod Insights, which gives you a graphical view.

## Adding custom metrics
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