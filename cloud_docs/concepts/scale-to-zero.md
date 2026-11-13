---
sidebar_position: 10
title: Scale to zero
description: Scale to zero stops a Serverpod Cloud server after about 5 minutes without requests and starts it again on the next one.
---

# Scale to zero

Staging projects, demos, and internal tools can go hours without a request. Their server keeps running all that time. With scale to zero, Serverpod Cloud stops your server after about 5 minutes without requests and starts it again when the next request arrives.

## Which projects scale to zero

Whether a project scales to zero depends on its plan:

<div className="full-width-table">

| Plan    | Scale to zero  | To change it                                                         |
| ------- | -------------- | -------------------------------------------------------------------- |
| Starter | On             | [Move the project to Growth](#turn-off-scale-to-zero) to turn it off |
| Growth  | Off by default | [Set **Min podlets** to 0](#turn-on-scale-to-zero) to turn it on     |

</div>

To see whether your project scales to zero, open its **Settings** in the [Serverpod Cloud console](https://console.serverpod.dev). The **Compute** section of the **Plan** card shows how many podlets, the running copies of your server, the project can run. A range that starts at 0, such as **0-1 PODLETS**, means the project scales to zero. From the terminal, run `serverpod cloud project show` in your project's directory. Its `Compute` row ends with the same range, such as `0-1 podlets`.

## When to use scale to zero

Whether scale to zero suits a project depends on how it's used. It suits projects that sit idle for long stretches, such as staging projects, demos, internal tools, and apps before launch.

It doesn't suit:

- **Production apps:** The first user after a quiet period waits a few seconds while the server starts. If traffic is steady, the project rarely sits idle, so scale to zero saves little.
- **Servers that use future calls:** [Future calls](/concepts/scheduling/overview), Serverpod's way to schedule server work for later, aren't supported with scale to zero. A call that falls due while the project is at zero runs late, once the next request wakes the server.

If your project is one of these, keep its server running. Starter projects always scale to zero, so [move the project to Growth](#turn-off-scale-to-zero). Growth keeps the server running unless you turn on scale to zero.

On Growth, you pay for the time your podlets run. While a project sits at zero podlets, no podlet time is billed. The monthly plan fee still applies.

## How scale to zero works

About 5 minutes after the last request ends, the project scales down to zero podlets. The console then shows its status as **Idling**.

Only requests that reach your server wake the project or keep it awake. Here are common activities and whether each one does:

<div className="full-width-table">

| Activity                                                                                                      | Wakes it or keeps it awake?                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| A request to any of your project's addresses, including your [custom domains](/cloud/concepts/custom-domains) | Yes                                                                                                             |
| An uptime monitor that checks your project more often than every 5 minutes                                    | Yes, all the time                                                                                               |
| A connection your app keeps open for [streaming methods](/concepts/endpoints-and-apis/streaming)              | Yes, while it's open. If your app always keeps one open, the project stays awake while anyone has the app open. |
| The console's **Sessions** tab, which lists the calls to your server                                          | Yes, on a project with a database, while the tab is open with **Auto-fetch** on (the default)                   |
| Work your server does on its own, such as a timer                                                             | No                                                                                                              |
| A file the [CDN](/cloud/concepts/cdn) (content delivery network) serves from its cache                        | No, unless the CDN checks with your server first                                                                |
| A deploy                                                                                                      | No                                                                                                              |

</div>

During a deploy, Serverpod Cloud runs the new version briefly to apply database migrations and check that it starts. An idling project then stays at zero until the next request, which starts the new version. A new project's first deploy starts a podlet. If no requests arrive, the project scales down to zero about 5 minutes later.

While the project is at zero, the data in your database and your stored files stay as they are. Anything your server keeps in memory, such as a cache, starts empty after a wake-up.

## Handle the first request to an idling project

The first request to an idling project wakes it. A wake-up usually takes 4 to 6 seconds, and sometimes a few seconds more. The request waits until the server is ready, for up to 30 seconds.

In rare cases where a wake-up takes longer than 30 seconds, the request fails with a timeout error (HTTP 504), but the server keeps starting.

By default, your app waits 20 seconds for an endpoint call, which covers a typical wake-up. A new streaming connection waits only 5 seconds, which can be shorter than a wake-up. Make your app retry [a call or connection that fails](/concepts/endpoints-and-apis/error-handling-and-exceptions#handle-errors-in-your-app) while the server wakes up. You can also set longer `connectionTimeout` and `streamingConnectionTimeout` values on your `Client`.

## Check whether your project is idling

Check the project's status in the console, or run this command from your project's directory:

```bash
serverpod cloud status live
```

From anywhere else, pass `-p your-project-id`.

The console status and the `Status` row of the command's output use these labels:

<div className="full-width-table">

| What's happening                                | Console         | Cloud CLI     |
| ----------------------------------------------- | --------------- | ------------- |
| The project is running                          | **Online**      | `● Running`   |
| The project is at zero podlets                  | **Idling**      | `☾ Idling`    |
| The project is waking up                        | **Starting**    | `◐ Starting`  |
| The project is still waking up after 30 seconds | **Unavailable** | `✖ Down`      |

</div>

While a project is idling, its web and API links stay available. When you open one, the project wakes up.

:::info
Cloud CLI versions before 1.3.0 show an error for an idling project. To see which version you have, run `serverpod cloud version`. To update, run `dart install serverpod_cloud_cli`.
:::

## Turn on scale to zero

On Growth, you turn on scale to zero in the console. The Cloud CLI can't change the autoscaling range.

1. In the [Serverpod Cloud console](https://console.serverpod.dev), open your project's **Settings** and select **Edit plan**.
2. In the **Compute** section, under **Autoscaling range**, set **Min podlets** to 0. The text "scales to zero when idle" appears below **Min podlets**.
3. Select **Save**.

The console confirms with "Your plan is updated". The change can take up to a minute to apply. Your server restarts once after you save. If no requests arrive, the project then scales down to zero.

## Turn off scale to zero

On Growth, you turn off scale to zero in the console:

1. In the [Serverpod Cloud console](https://console.serverpod.dev), open your project's **Settings** and select **Edit plan**.
2. In the **Compute** section, under **Autoscaling range**, set **Min podlets** to 1 or more.
3. Select **Save**.

The console confirms with "Your plan is updated". The change can take up to a minute to apply. If the project is idling, a podlet starts without waiting for a request. If the project is running, your server restarts once. The project then keeps at least the number of podlets you set.

To stop a Starter project from scaling to zero, move it to Growth:

1. In the [Serverpod Cloud console](https://console.serverpod.dev), open your project's **Settings** and select **Upgrade plan**.
2. Under **Project plan**, choose **Growth**. The autoscaling range changes to Growth's default of 1 to 1, which keeps one podlet running.
3. Select **Save**. If you haven't added a card, the button reads **Add card and upgrade**.

Upgrading to a higher plan costs more. See [Serverpod Cloud plans](https://serverpod.dev/cloud) for the prices.

## Related

- [Deployments](/cloud/concepts/deployments): how to deploy your server and check a deployment.
- [Database](/cloud/concepts/database): the managed database, which runs separately from your podlets.
- [Scheduling overview](/concepts/scheduling/overview): future calls, which need a running server.
- [CLI reference: `status` command](/cloud/reference/cli/commands/status): the `status live` command and its options.
- [Serverpod Cloud plans](https://serverpod.dev/cloud): what each plan includes and costs.
