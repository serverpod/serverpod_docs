# `log`

The `scloud log` command provides a way to retrieve logs for your live service.

Running the base command below fetches the most recent logs:

```bash
scloud log
```

To retrieve logs within specific time ranges, the `--until` and `--since` options can be used. Both options accept either ISO date strings (e.g., "2024-01-15T10:30:00Z") or duration strings (e.g., "5m", "3h", "1d"). See some examples below:

```bash
# Using ISO date strings
scloud log --until=2024-12-01T00:00:00Z --since=2024-11-01T00:00:00Z
scloud log --since=2024-11-01T00:00:00Z

# Using duration strings
scloud log --since=5m
scloud log --since=1h --until=30m

# Mixing ISO dates and durations
scloud log --since=2024-11-01T00:00:00Z --until=10m
```

The `--until` option can also be passed as the first positional argument:

```bash
scloud log 10m
scloud log 3h
scloud log 14d
```

To tail the logs (i.e. get streaming real-time updates), add the `--tail` flag:

```bash
scloud log --tail
```
