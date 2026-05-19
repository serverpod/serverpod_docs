# View logs

View logs from your running applications to monitor performance, diagnose issues, and track application behavior. Serverpod Cloud automatically collects logs from your applications. You can view these logs using the `scloud log` command, which provides powerful filtering and real-time monitoring capabilities.

## Viewing deployment logs

### Basic log viewing

To view logs for your deployment:

```bash
scloud log
```

This displays the most recent logs for your deployment.

### Filtering logs by time

You can filter logs using the `--since` and `--until` options. Both options accept either ISO date strings or duration strings, providing flexibility in how you specify time ranges.

#### Using duration strings

You can quickly view logs from recent time periods using duration strings:

```bash
# View logs from the last 120 seconds
scloud log 120s

# View logs from the last 5 minutes
scloud log 5m

# View logs from the last 12 hours
scloud log 12h

# View logs from the last 7 days
scloud log 7d

# View logs in a time range using durations
scloud log --since 1h --until 10m
```

#### Using ISO date strings

You can filter logs using ISO 8601 timestamp format:

```bash
# View logs after a specific time
scloud log --since "2023-06-15T14:00:00Z"

# View logs before a specific time
scloud log --until "2023-06-15T16:00:00Z"

# View logs in a time range
scloud log --since "2023-06-15T14:00:00Z" --until "2023-06-15T16:00:00Z"
```

The timestamp format is flexible and supports various levels of precision:

```bash
# Full ISO 8601 format with seconds and timezone
scloud log --since "2023-06-15T14:00:00Z"

# Without seconds
scloud log --since "2023-06-15T14:00"

# Without minutes and seconds
scloud log --since "2023-06-15T14"

# Just the date (starts at 00:00:00)
scloud log --since "2023-06-15"
```

#### Mixing ISO dates and durations

You can mix ISO date strings and duration strings:

```bash
# View logs since a specific date until 30 minutes ago
scloud log --since "2023-06-15T14:00:00Z" --until 30m

# View logs since 1 hour ago until a specific date
scloud log --since 1h --until "2023-06-15T16:00:00Z"
```

### Real-time log streaming

To continuously stream logs as they are generated:

```bash
scloud log --tail
```

Press `Ctrl+C` to stop the stream.

> ⚠️ **Note**: The `--tail` flag cannot be used together with the `--since` or `--until` options.

### Display logs in UTC time

By default, logs are displayed in your local time zone. To view logs in UTC time:

```bash
scloud log --utc
```

## Viewing build logs

To diagnose issues during the deployment process, you can view the build logs for your deployments:

### Basic build log viewing

To view build logs for your most recent deployment:

```bash
scloud deployment build-log
```

### Viewing logs for specific deployments

You can view build logs for specific projects or deployments:

```bash
# View build logs for a specific project
scloud deployment build-log

# View build logs for a specific deployment by index (0 is most recent)
scloud deployment build-log 0

# View build logs for a specific deployment by ID
scloud deployment build-log abc123
```

### Understanding build logs

Build logs show the complete output from the build process, including:

- Package installation steps
- Compilation messages
- Warning and error messages

If a deployment failed, the build logs will help you identify where the failure occurred and any specific error messages.

### 💡 Tips for Build Logs

- Use `scloud deployment list` to see all recent deployments before viewing logs for a specific one
- Redirect lengthy build logs to a file for easier analysis:

  ```bash
  scloud deployment build-log > build-log.txt
  ```

- Filter for specific messages:

  ```bash
  scloud deployment build-log | grep ERROR
  ```

## 💡 Best Practices

1. **Use specific time ranges** when debugging known issues to reduce noise
2. **Enable UTC mode** (`--utc`) when collaborating with team members in different time zones
3. **Combine with `grep`** for further filtering:

   ```bash
   scloud log | grep ERROR
   ```

4. **Redirect output to file** for persistence or sharing:

   ```bash
   scloud log > project_logs.txt
   ```

## Log format

Each log entry includes:

- Timestamp
- Log level (INFO, ERROR, etc.)
- Origin service (API, insights, or web)
- Message content

## 🧪 Example Scenarios

### Monitoring during critical operations

```bash
# Stream logs in real-time with UTC timestamps
scloud log --tail --utc
```

### Investigating a specific incident

```bash
# View logs around a reported error
scloud log --since "2023-07-10T13:45:00Z" --until "2023-07-10T14:15:00Z"
```

## Session logs configuration

By default, the session logs settings are configured as follows:

- `SERVERPOD_SESSION_CONSOLE_LOG_ENABLED`: `true`
- `SERVERPOD_SESSION_PERSISTENT_LOG_ENABLED`: `false`

If your application needs different log handling, please adjust these
parameters using the `scloud variable create` command to set them
as [environment variables](/cloud/guides/passwords#set-an-environment-variable).

## Troubleshooting

### Invalid timestamp format

If you see an error about invalid timestamp format, ensure you're using ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`).

### No logs appearing

- Check if your time range is correct
- Ensure your application is running and generating logs
