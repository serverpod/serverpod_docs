---
description: Configure future call execution, concurrency, the scan interval, and broken-call handling through config files or environment variables.
---

# Configuration

You configure future calls in your Serverpod config files or through environment variables. The options and their environment-variable names are listed in full in the [Configuration reference](../lookups/configuration-reference).

| Option | Default | Controls |
| --- | --- | --- |
| `futureCallExecutionEnabled` | `true` | Whether this server runs future calls at all. |
| `futureCall.concurrencyLimit` | `1` | How many calls may run at once. |
| `futureCall.scanInterval` | `5000` | How often, in milliseconds, the server checks for due calls. |
| `futureCall.checkBrokenCalls` | unset | Whether to scan for broken calls on startup. |
| `futureCall.deleteBrokenCalls` | `false` | Whether to delete broken calls that are found. |

```yaml
futureCallExecutionEnabled: true

futureCall:
  concurrencyLimit: 1     # default
  scanInterval: 5000      # default, in milliseconds
```

## Execution options

### Enable or disable execution

The `futureCallExecutionEnabled` option turns future call execution on or off for a server. It is `true` by default. Set it to `false` in environments where background tasks should not run, such as a staging server where you want to test API behavior without triggering scheduled work.

```yaml
futureCallExecutionEnabled: false
```

### Concurrency limit

The `concurrencyLimit` option sets how many future calls may run at the same time. The default is `1`, meaning calls run one after another. Raise it to run more calls in parallel, or keep it small so future calls do not crowd out other work on a busy server.

Set it to `0` or a negative number to remove the limit entirely, allowing unlimited concurrent calls. Use this with care, since a burst of due calls can then exhaust the server's resources.

```yaml
futureCall:
  concurrencyLimit: 5
```

### Scan interval

The `scanInterval` option sets how often, in milliseconds, the server checks the database for calls that are due. The default is `5000` (5 seconds). A shorter interval runs calls closer to their scheduled time. A longer one reduces database load.

```yaml
futureCall:
  scanInterval: 2000
```

## Broken future calls

A scheduled call becomes broken when the code needed to run it no longer matches what was stored. This happens if, before the call runs, you restart the server after:

- Removing the method the call points to.
- Changing a future call method's signature so the stored parameters no longer deserialize.
- Changing a model used as a parameter so the stored data no longer deserializes.

A broken call fails at runtime when the server tries to execute it. You are responsible for keeping calls backward compatible, but Serverpod can detect and remove broken calls for you.

### Check for broken calls

On startup the server can scan for broken calls. Whether it does depends on `checkBrokenCalls`:

- **Unset (the default):** the check runs only when the table holds fewer than 1000 future calls, so a large backlog does not slow startup.
- **`true`:** the check always runs, regardless of how many calls are scheduled.
- **`false`:** the check never runs.

```yaml
futureCall:
  checkBrokenCalls: true
```

:::note
The `maintenance` role also runs this check. Started in that role, the server checks for broken calls, runs every currently-due future call once, and then exits. This is how future calls get processed in environments that do not run a persistent server, such as serverless hosting. See [server roles](../server-fundamentals/running-your-server#choose-a-server-role).

```bash
$ dart run bin/main.dart --role maintenance
```

Because it executes due calls, do not run this as a dry check against a production database. The process exits normally whether or not broken calls are found, so read the result from the logs.
:::

### Delete broken calls

When the check finds broken calls it logs a warning but does not delete them. Set `deleteBrokenCalls` to `true` to delete them instead. Deletion only happens when the check actually runs.

```yaml
futureCall:
  deleteBrokenCalls: true
```
