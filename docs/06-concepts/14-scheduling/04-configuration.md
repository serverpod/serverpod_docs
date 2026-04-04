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

A future call is considered broken if it is scheduled but is not registered or its stored data can not be deserialized. Running these future calls may cause runtime errors.

Scheduled future calls can become broken if, before they run, the server is restarted and:

- The method of a future call spec class is removed, leading to the removal of the previous generated future call execution class.
- The signature of a future call method is changed in a way that will lead to a generated model that fails to deserialize the stored JSON.
- The model that is used as a parameter to a future call method is changed in a way that will lead to failure in the stored JSON deserialization.

Although ensuring backwards compatibility is the responsibility of the developer, Serverpod provides configurations to facilitate checking that stored future calls are still valid before starting the server and optionally deleting them.

### Check broken calls

This option allows the server to perform a check for broken future calls on startup.

By default, the configuration is set to `null`. When it is set to `null` and there are less than 1000 future calls in the database, the server will perform an automatic check.

Set this value to `true` to force the check regardless of the number of calls, or `false` to opt out of the scan.

Example configuration:

```yaml
checkBrokenCalls: false
```

### Delete broken calls

This option allows you to enable or disable the deletion of broken future calls when running the check on startup. By default, it is set to `false`.

This configuration is only valid if the check is executed (either automatically or through explicitly enabling `checkBrokenCalls`).

Example configuration:

```yaml
deleteBrokenCalls: false
```
