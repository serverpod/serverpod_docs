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

A future call is considered broken if it is scheduled but is not registered or its stored data can not be deserialized. Running these future calls may cause runtime errors. Serverpod provides configurations that allow you to check for these broken future calls and optionally delete them on startup.

### Check broken calls

This option allows you to enable or disable the checking for broken future calls on startup. By default, it is set to `null`. When it is set to `null` and there are less than 1000 future calls in the database, the server will perform a default check and log broken future calls. Set this value to `false` to opt out of the default scan.

Example configuration:

```yaml
checkBrokenCalls: false
```

### Delete broken calls

This option allows you to enable or disable the deletion of broken future calls on startup. By default, it is set to `false`.

Example configuration:

```yaml
deleteBrokenCalls: false
```
