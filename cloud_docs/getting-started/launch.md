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
- A Serverpod project on your machine. See [Creating a new project](/quickstart#create-the-project) in the Serverpod installation guide.

## Launch your project

From your project's root directory:

```bash
scloud launch
```

It creates a Cloud project and ships its first version in these steps:

1. **Choose the project.** If your account has no projects, scloud asks *"Open the browser and create a new Serverpod Cloud project?"* Press Enter to accept. If you already have projects, scloud lists them, with a last option to create a new project in the browser.
2. **Create the project in the Console.** If you chose to create a new project, the Console's **New project** page opens. The project ID is pre-filled from your pubspec name (for example, `my-app`), and the database is switched on if your server config has a `database` section. Change either if you need to. Pick a plan (see [Cloud plans](https://serverpod.dev/cloud)), click **Launch Project**, and return to the terminal. The project ID becomes part of your default URL (`<project-id>.serverpod.space`).
3. **Pre-deploy hooks.** scloud adds `serverpod generate` as a pre-deploy hook, plus `serverpod run flutter_build` if your server's `pubspec.yaml` defines that script. See [Deployment hooks](/cloud/concepts/deployment-hooks) for details.
4. **Custom passwords.** If `config/passwords.yaml` has custom passwords, scloud asks which ones to copy to Cloud. Passwords from the `production` and `shared` sections are preselected. Set the rest later with `scloud password set`.

scloud then writes a `scloud.yaml` linking subsequent commands to the project, uploads your code, and deploys.

## Watch the deployment

Launch waits for the deployment and updates each of its three stages as it progresses:

```text
Upload successful.
Cloud build successful.
Rollout successful. 🚀
```

When you see the rocket on **Rollout**, your app is live. scloud then prints your project ID and the URLs your project is reachable at:

```text
Your Serverpod Cloud project ID is: my-app

When the server has started, you can access it at:
   Web:      https://my-app.serverpod.space/
   API:      https://my-app.api.serverpod.space/
   Insights: https://my-app.insights.serverpod.space/
```

## Open your app

In your browser, open the Web URL scloud printed:

```text
https://my-app.serverpod.space/
```

Your Flutter web app loads at the root. If the app wasn't built before the upload, a **Flutter web app not built** page loads instead. Projects created with the website option show a landing page at the root, with the Flutter web app under `/app`.

## What you've done

You've created a Cloud project and shipped its first version. From here:

- Every change you make ships with `scloud deploy`. See [Deployments](/cloud/concepts/deployments) for the full deploy lifecycle.
- To use your own domain instead of `<project>.serverpod.space`, see [Custom domains](/cloud/concepts/custom-domains).
