---
sidebar_position: 2
sidebar_label: Deploy your first app
description: Run scloud launch to create a Cloud project, deploy your Serverpod server, and open it at a public URL. Takes about five minutes.
sidebar_class_name: sidebar-icon-deploying
---

# Deploy your first app

Get your Serverpod app live on Cloud in a few minutes.

## Before you start

You need:

- `scloud`, Serverpod Cloud's command-line tool, installed and signed in. See [Install scloud](/cloud/getting-started/installation).
- A Serverpod project on your machine. See the Serverpod [Quickstart](https://docs.serverpod.dev/get-started/quickstart) to create one.

## Launch your project

From your project's root directory:

```bash
scloud launch
```

It creates a Cloud project and ships its first version. The CLI walks you through eight prompts; press Enter at each one to accept the default (most default to yes). The four that need real decisions:

- **Project ID.** scloud suggests a default from your pubspec name (for example, `my-app`). Press Enter to accept, or type a different ID. The project ID becomes part of your default URL (`<project-id>.serverpod.space`).
- **Plan.** Type `starter` or `growth` (see [Cloud plans](https://serverpod.dev/cloud) for details). Pick `starter` for a first deploy. Starter includes a 1-month free trial; no credit card required.
- **Database.** Press Enter for yes if you want Cloud to provision and manage a Postgres database for your server. Type `n` if your app doesn't need a database, or if you plan to connect to your own.
- **Pre-deploy hooks.** Hooks run scripts before each deploy. scloud may offer to add `serverpod generate` and a Flutter build hook (if your project defines one). Accept the ones that match your project. See [Deployment hooks](/cloud/concepts/deployment-hooks) for details.

After the final confirmation, scloud creates the Cloud project, writes a `scloud.yaml` linking subsequent commands to it, uploads your code, and starts the deploy.

## Watch the deployment

Next, scloud prints the URLs your project will be reachable at:

```text
When the server has started, you can access it at:
   Web:      https://my-app.serverpod.space/
   API:      https://my-app.api.serverpod.space/
   Insights: https://my-app.insights.serverpod.space/
```

The server isn't live yet. Watch the deployment finish:

```bash
scloud deployment show
```

The command tracks the deployment through four stages, updating each line as it progresses:

```text
Tracking my-app deployment 4583d0a1-3d0a-400e-a9a5-9880da6abc94
(Press Ctrl+C to exit)

Upload successful.
Cloud build successful.
Infra deploy successful.
Service rollout successful. 🚀
```

When you see the rocket on **Service rollout**, your app is live.

## Open your app

In your browser, open the Web URL scloud printed:

```text
https://my-app.serverpod.space/
```

The server's landing page loads. If you added the Flutter build hook, navigate to `/app` to see your Flutter web app.

## What you've done

You've created a Cloud project and shipped its first version. From here:

- Every change you make ships with `scloud deploy`. See [Deployments](/cloud/concepts/deployments) for the full deploy lifecycle.
- To use your own domain instead of `<project>.serverpod.space`, see [Custom domains](/cloud/concepts/custom-domains).
