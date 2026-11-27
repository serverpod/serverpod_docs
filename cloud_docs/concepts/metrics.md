---
sidebar_position: 11
title: Metrics
description: Metrics in the Serverpod Cloud console show your project's podlets, CPU and memory, traffic, and database over time, so you can tell whether it keeps up.
---

# Metrics

Metrics shows whether your project keeps up with its traffic. You see how many [podlets](/cloud/concepts/compute) run, how much CPU and memory they use, how many requests fail, and how busy the database is, from the last hour to the last 30 days. To see what happened in a single request, use [Logs](/cloud/concepts/logs) instead.

To open Metrics, select your project in the [Serverpod Cloud console](https://console.serverpod.dev), then the **Metrics** tab.

<!-- screenshot: cloud-console/metrics-tab.png. Owner: docs team. Last verified: 2026-11-25 against console.serverpod.dev. -->
![The Metrics tab of a project in the Serverpod Cloud console over the last 24 hours. The Podlets section shows one running podlet and no deploys in the window. Below it, the Resources section shows CPU at 4.6%, 5% of its limit, and memory at 126 MB, 25% of 512 MB.](/img/cloud-console/metrics-tab.png)

## What Metrics shows

The Metrics tab has four sections:

<div className="full-width-table">

| Section   | What it shows                                                                         |
| --------- | ------------------------------------------------------------------------------------- |
| Podlets   | Each podlet's CPU or memory over the time range, and each deploy as a marker          |
| Resources | CPU and memory, totalled across all podlets                                           |
| Traffic   | Requests, responses by status code, and the share that fail with a server error (5xx) |
| Database  | The database's CPU, memory, connections, and storage                                  |

</div>

Each Resources chart shows usage against what your compute allows, such as **25% of 512 MB**. Across all podlets, that allowance grows with the number of podlets running. Select a podlet in the Podlets section to focus the charts on it and compare it with its own [podlet size](/cloud/concepts/compute). If usage stays close to the limit, see [When to change compute](/cloud/concepts/compute#when-to-change-compute).

Hover a deploy marker to see its branch, its Serverpod version, and how long it took. Select the marker to open the deployment.

## Choose a time range

Choose **1h**, **24h**, **7d**, or **30d** to set how far back the charts go. Shorter ranges show more detail.

While **Today** is selected, the charts refresh every 30 seconds. To look at an earlier day, use the arrows or the calendar next to **Today**. To enlarge a chart, select the expand icon in its corner.

## Watch from the terminal

To watch your project from the terminal, run this in your project's directory:

```bash
serverpod cloud top
```

The command shows a live overview of the last hour of podlets, traffic, and the database, along with the latest deployments and logs. It refreshes every 5 seconds, or at the pace you set with `--interval`, such as `--interval 30s`.

The overview needs an interactive terminal. In CI or a script, use `serverpod cloud status live` and `serverpod cloud log` instead.

## Limits

- **Traffic:** It isn't tracked per podlet, so focusing on a podlet leaves the Traffic charts unchanged.
- **Database metrics:** A database that was suspended for the whole time range reports nothing. A database's metrics start when Cloud turns on metrics export for it, so there's no earlier history. When there's no data, the Database section says why instead of showing charts.

## Related

- [Compute](/cloud/concepts/compute): podlet sizes and the autoscaling range.
- [Scale to zero](/cloud/concepts/scale-to-zero): why a project can have no running podlets.
- [Logs](/cloud/concepts/logs): what happened in a single request.
- [Deployments](/cloud/concepts/deployments): the deploys the markers show.
- [CLI reference: `top` command](/cloud/reference/cli/commands/top): every `top` option.
