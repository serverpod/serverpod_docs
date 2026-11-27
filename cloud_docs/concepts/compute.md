---
sidebar_position: 13
title: Compute
description: Compute sets how much memory each copy of your Serverpod Cloud server gets and how many copies run, so your server keeps up with your traffic.
---

# Compute

Compute decides how much traffic your server can handle and how fast it responds under load. Your server runs as one or more podlets, which are running copies of your server. Serverpod Cloud adds podlets when load rises and removes them when it falls, within a range you set.

## How compute works

Two settings make up your project's compute:

- **Podlet size:** How much memory and CPU each podlet has. All podlets in a project are the same size.
- **Autoscaling range:** The fewest and the most podlets your project runs, set as **Min podlets** and **Max podlets**.

Each podlet size has this much memory, and larger sizes also get more CPU:

<div className="full-width-table">

| Podlet size | Memory |
| ----------- | ------ |
| Small       | 256 MB |
| Medium      | 512 MB |
| Large       | 1 GB   |
| XL          | 2 GB   |
| XXL         | 4 GB   |

</div>

On Starter, compute is fixed at one small podlet that [scales to zero](/cloud/concepts/scale-to-zero) when idle. On Growth, you choose the size and the range. The [pricing page](https://serverpod.dev/pricing) lists what each size costs.

## When to change compute

The size and the range solve different problems:

- **A larger size:** For a server that runs out of memory or responds slowly even when traffic is low, such as one that processes images or keeps large data sets in memory.
- **A higher Max podlets:** For traffic that comes in peaks. Serverpod Cloud adds podlets during a peak and removes them afterward.
- **A higher Min podlets:** For traffic that rises faster than new podlets can start. The podlets you keep running are ready when the rise begins.
- **Min podlets of 0:** For projects with quiet periods. The project [scales to zero](/cloud/concepts/scale-to-zero) when nobody uses it.

:::note
If you set **Max podlets** above 1, each podlet has its own memory. A value your server stores in a local cache stays on the podlet that stored it. To share cached values across podlets, use the [global cache](/concepts/endpoints-and-apis/caching#the-global-cache-and-redis) and connect your project to [Redis](/cloud/guides/redis). Without Redis, server events also reach only the podlet that posts them. The framework's [Scalability](/concepts/operations/scalability) page covers what else changes when your server runs as several copies.
:::

## Check your project's compute

To see your project's current compute, open its **Settings** in the [Serverpod Cloud console](https://console.serverpod.dev). The **Compute** card in the **Plan** section shows the podlet size, its memory, and the range of podlets the project can run, such as **0-1 PODLETS**.

From the terminal, run `serverpod cloud project show` in your project's directory. The `Compute` row shows the podlet size, its memory, and the range, such as `0-1 podlets`.

To see how much CPU and memory your podlets actually use, open [Metrics](/cloud/concepts/metrics).

## Change the podlet size and autoscaling range

In the [Serverpod Cloud console](https://console.serverpod.dev), open your project's **Settings** and select **Edit plan**. Set **Podlet size** and **Autoscaling range** in the **Compute** section, then select **Save**. The Cloud CLI can't change compute.

The change usually applies within a minute or two, and your server restarts once.

On Starter, the console shows **Upgrade plan** instead of **Edit plan**, because Starter's compute is fixed. To choose a size or a range, select **Upgrade plan** and [move the project to Growth](/cloud/concepts/plans-and-billing#change-your-projects-plan).

:::info
Only the project's owner can change compute. For anyone else, **Edit plan** is dimmed, and hovering it shows who the owner is.
:::

## Cost and limits

- **Billing:** On Growth, you pay for each podlet for the minutes it runs. On Starter, the monthly fee covers usage up to a fixed cap. The [pricing page](https://serverpod.dev/pricing) lists the price of each size and what each plan includes.
- **Podlets:** Starter runs one small podlet that [scales to zero](/cloud/concepts/scale-to-zero). On Growth, **Max podlets** goes up to 20.
- **Serverpod version:** Use Serverpod 3.3.0 or later for more than one podlet. Earlier versions lack the health checks Cloud uses while it scales and deploys. See [Serverpod and Dart SDK versions](/cloud/reference/serverpod-and-dart-sdk-versions#serverpod-versions).

## Related

- [Plans and billing](/cloud/concepts/plans-and-billing): the plans, and how to move a project between them.
- [Scale to zero](/cloud/concepts/scale-to-zero): how a project with **Min podlets** set to 0 stops when idle and wakes on the next request.
- [Use Redis for pub/sub and caching](/cloud/guides/redis): sharing a cache and server events across podlets.
- [Scalability](/concepts/operations/scalability): what changes in your server code when it runs as several copies.
- [CLI reference: `project` command](/cloud/reference/cli/commands/project): the `project show` command and its options.
