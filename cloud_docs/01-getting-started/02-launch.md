---
sidebar_label: Deploy your first app
sidebar_class_name: sidebar-icon-deploying
---

# Deploy your first app

This page shows how to deploy a Serverpod server to Serverpod Cloud using the `scloud` CLI. After completing these steps, your server will be running in a managed production environment.

## Prerequisites

Before deploying, make sure you have:

- Completed the **Installation** steps (`scloud` installed and authenticated).
- A **Serverpod project** on your machine.
- Have created a new project in the Serverpod Cloud console.

If you haven't yet created a Serverpod project, you can read more about how to get started on it in our Serverpod [framework documentation](https://docs.serverpod.dev/).

## Navigate to your project

Open a terminal and navigate to the root directory of your Serverpod project:

```bash
cd your_serverpod_project
```

## Launch the project on Serverpod Cloud

Run the interactive launch command:

```bash
scloud launch
```

This command guides you through the initial setup and deployment. It will:

- Create a new Serverpod Cloud project (if you haven't created one in the console).
- Configure the deployment environment.
- Build and deploy your server.

During the process, the CLI will ask you to confirm configuration options for your project.

## Verify the deployment

It will take a few minutes for your project to be uploaded, built, and deployed. Check the status of your last deployment with:

```bash
scloud deployment show
```

The command prints information about your deployment and its status. Once the deployment completes successfully, your Serverpod server will be running on Serverpod Cloud.

## Deploy updates

After making changes to your project, redeploy it with:

```bash
scloud deploy
```

This command builds the updated server and deploys the new version to Serverpod Cloud.

:::tip

If you are deploying a Flutter web app together with your server APIs, make sure to update the version in your Flutter app's `pubspec.yaml`. Otherwise, an old version of the web app may be cached by the user's browser.

:::
