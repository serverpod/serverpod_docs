---
title: Logs
---

# Logs

This guide covers the fastest ways to inspect logs in Serverpod Cloud. Use Serverpod Insights for structured investigation, and use the CLI for quick checks from your terminal and accessing build logs.

## Prerequisites

Before using logs, make sure you have:

- Completed the **Installation** steps (`scloud` installed and authenticated).
- Deployed a project to Serverpod Cloud.

## Serverpod Insights

Insights is Serverpod's built-in visual log viewer. After you have deployed your server, you can access Insights through the Cloud console. It's usually the best place to start looking if you need to access Serverpod's logs.

With Insights you can see your log messages grouped by session. You can also choose to log database queries and stack traces.

:::tip

Use Serverpod Insights for root-cause analysis. Logs are grouped by session, which makes it easier to follow a single request end-to-end.

:::

## View build logs

Build logs are the first place to look when a deployment fails.

View the latest deployment build log:

```bash
scloud deployment build-log
```

View build logs for a specific deployment:

```bash
# By sequence number (0 is latest)
scloud deployment build-log 3

# By deployment UUID
scloud deployment build-log 550e8400-e29b-41d4-a716-446655440000
```

To find the ID of a deployment use the `deployment list` command:

```bash
scloud deployment list
```

## Raw runtime logs

To fetch the latest runtime logs for your deployed service:

```bash
scloud log
```

By default, this returns recent log records. Add `--utc` if you want timestamps in UTC:

```bash
scloud log --utc
```

## Stream logs in real time

To follow new logs continuously while reproducing an issue:

```bash
scloud log --tail
```

Press `Ctrl+C` to stop streaming.

## Related documentation

- [CLI reference: `log` command](../reference/cli/commands/log)
- [CLI reference: `deployment` command](../reference/cli/commands/deployment)
