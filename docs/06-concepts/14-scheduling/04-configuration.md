# Configuration

Future calls can be configured using options defined in the configuration files or environment variables. For a detailed list of configuration options, refer to the [Configuration](../configuration) page.

Below is an example of how you can configure future calls in a YAML file:

```yaml
futureCallExecutionEnabled: true

futureCall:
  concurrencyLimit: 5
  scanInterval: 2000
```

### Enable or disable future call execution

This option allows you to enable or disable the execution of future calls. By default, it is set to `true`. You might want to disable future call execution in environments where you don't want background tasks to run, such as during testing or in a staging environment where you want to focus on API behavior without triggering scheduled tasks.

Example configuration:

```yaml
futureCallExecutionEnabled: false
```

### Concurrency limit

This option sets the maximum number of future calls that can run concurrently. By default, it is set to `1`. Configuring this is useful if you have resource-intensive tasks and want to avoid overloading your server. For example, in a production environment, you might want to tune this value to ensure that not all of the server's resources are allocated to future calls, leaving room for other critical tasks.

Setting this value to a negative number or `null` removes the limitation, allowing an unlimited number of concurrent future calls. However, this should be used with caution as it can lead to resource exhaustion.

Example configuration:

```yaml
futureCall:
  concurrencyLimit: 5  # Adjust this value based on your server's capacity
```

### Scan interval

This option determines how often the system scans for future calls to execute, in milliseconds. The default value is `5000` (5 seconds). Adjusting this interval can help balance responsiveness and resource usage. For example, reducing the interval can make future calls execute closer to their scheduled time, while increasing it can reduce database load in environments with limited resources.

Example configuration:

```yaml
futureCall:
  scanInterval: 2000  # Adjust this value based on your server's responsiveness needs
```

## Managing broken future calls

Scheduled future calls can become broken if, before they run, the server is restarted and:

- The method of a future call spec class is removed, leading to the removal of the previous generated future call execution class.
- The signature of a future call method is changed in a way that will lead to a generated model that fails to deserialize the stored JSON.
- The model that is used as a parameter to a future call method is changed in a way that will lead to failure in the stored JSON deserialization.

The above cases will lead to runtime errors when trying to execute the future call. Although ensuring backwards compatibility is the responsibility of the developer, Serverpod exposes tools to prevent or remove broken future calls.

### Check broken calls

By default, the server will perform a check for broken future calls on startup if there are less than 1000 future calls scheduled in the database.

This check can be controlled using the `checkBrokenCalls` configuration option. If it is set to `true`, the server will perform a check for broken future calls on startup regardless of the number of calls. If it is set to `false`, the server will not perform a check for broken future calls on startup.

Example configuration:

```yaml
checkBrokenCalls: false
```

:::tip
The future calls check can be used with the maintenance role to programmatically validate that the server can be restarted without breaking future calls. The process will exit normally, but logs can be inspected to verify that no broken future calls were found.

```bash
$ dart run bin/main.dart --role maintenance
```
:::

### Delete broken calls

When detecting broken future calls, the server will log a warning, but will not delete them by default. This behavior can be changed by setting the `deleteBrokenCalls` configuration option to `true` (default is `false`).

This configuration is only valid if the check is executed (either automatically or through explicitly enabling `checkBrokenCalls`).

Example configuration:

```yaml
deleteBrokenCalls: false
```
