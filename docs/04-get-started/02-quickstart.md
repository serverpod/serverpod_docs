---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quickstart

Try out the **Serverpod 4 public beta**. Build and deploy a full-stack Flutter and Serverpod app, hosted on the web, in 10–15 minutes. We have tested the default setup with Antigravity, Cursor, and Claude Code, but most agentic editors will work.

## Prerequisites

Serverpod is tested on Mac, Windows, and Linux. Before you can install Serverpod, you need to have **[Flutter](https://flutter.dev/docs/get-started/install)** installed.

:::info
Check your Flutter installation by running the following command in your terminal:

```bash
$ flutter doctor
```

:::

## Install Serverpod

Serverpod is installed using the Dart package manager. To install Serverpod, run the following command in your terminal:

```txt
$ dart install serverpod_cli 4.0.0-beta.0
```

Verify the installation by running:

```bash
$ serverpod
```

:::warning

If a previous version of Serverpod is already installed with `dart pub global activate`, deactivate it before installing or upgrading:

```txt
$ dart pub global deactivate serverpod_cli
```

:::

## Create the project

Use Serverpod's `quickstart` command to create a new project.

```bash
$ serverpod quickstart my_project
```

The command opens an interactive screen where you select the editor or agent you plan to use. Navigate with your mouse or use the arrow keys to move around, press `Space` to select your editor, then press `Enter` to create the project.

Next, open your newly created project with your favorite AI powered editor. Open the _root_ folder of the full project, for example, `my_project`, which includes the server, client, and Flutter app.

:::important

If you are using Cursor, you will need to **enable the MCP server** in your project settings (_Cursor Settings_ > _Tools & MCPs_).

:::

## Start the server and the app

Start the server and the Flutter app by opening up a terminal window and running the [`serverpod start`](../06-concepts/00-start-command.md) command:

```bash
$ serverpod start
```

After the server has started and your app has finished building, the app will open in a new browser window. Try it out by entering your name and clicking the send button.

## Build your app

Instruct your AI agent to build your app. Here are a few simple prompts that you can try:

<Tabs>
  <TabItem value="jobs" label="Job board">

> _Build a professional job marketplace where employers post openings and manage applications, while job seekers browse listings. Use an editorial-inspired design with bold typography._

  </TabItem>
  <TabItem value="crm" label="CRM" default>

> _Build a modern CRM for a B2B sales team. Users can manage companies, contacts, and deals. Use a sleek dark theme with vibrant accent colors, compact layouts, and data-rich dashboards._

  </TabItem>
  <TabItem value="journal" label="Social network">

> _Build a modern social network where users share posts, follow each other, comment, and react. Give it a bold consumer-app style with colorful gradients, large avatars, and playful animations._

  </TabItem>
</Tabs>

---

The agent will start building your app. It will manage your database and perform a hot reload when the app is complete.

:::tip

If your app uses authentication, the verfication code will be displayed as an alert in Serverpod's command line interface. Press the `C` key to copy the code.

If the agent fails to reload the app, you can always hit the `R` key to force a restart of the server and the app.

:::

## Deploy the app to the cloud

Deploy your web app and backend to **[Serverpod Cloud](/cloud)**, a fully managed platform built by the Serverpod team. Your first project includes a one-month free trial, with no credit card required.

Create your Cloud account and create a project on the **[Serverpod Cloud Console](https://console.serverpod.dev/)**, then launch your app:

```bash
$ serverpod cloud launch
```

This configures your project, provisions a database, and deploys your backend along with the web build of your app.

After the first launch, you redeploy any changes by running `serverpod cloud launch` again.

:::tip

In the **[Serverpod Cloud Console](https://console.serverpod.dev/)**, open Serverpod Insights to view your server logs, CPU usage, and other information.

:::
