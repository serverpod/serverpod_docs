---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quickstart

Build and deploy a full-stack Flutter and Serverpod app, hosted on the web, in 10–15 minutes. We have tested the default setup with Antigravity, Cursor, and Claude Code, but most agentic editors will work.

:::info

Before we start, make sure that you have [Serverpod installed](./installation).

:::

## Create the project

Use Serverpod's `create` command to create a new project. The `create` command is interactive and will guide you through the setup process.

```bash
$ serverpod create my_project
```

The command opens an interactive screen with sensible defaults already selected. Leave the defaults as they are, but make sure to select the editor or agent you plan to use, since the rest of this guide relies on it to build your app. Navigate with the arrow keys, press `Space` to select it, then press `Enter` to create the project.

Next, open your newly created project with your favorite AI powered editor. Open the root folder of the full project, for example, `my_project`, which includes the server, client, and Flutter app.

:::important

If you are using Cursor, you will need to **enable the MCP server** in your project settings (_Cursor Settings_ > _Tools & MCPs_).

:::

## Start the server and the app

Start the server and the Flutter app by opening up a terminal window and running the `serverpod start` command:

```bash
$ serverpod start
```

After the server has started and your app has finished building, it will open in a new window. Try it out by entering your name and clicking the send button.

## Build your app

Instruct the agent to build your app. Here are a few simple prompts that you can try:

<Tabs>
  <TabItem value="expense-tracker" label="Personal expense tracker" default>

> _Build a personal expense tracker with a Serverpod backend. Include a frontend form to log expenses (amount, category, description), a list displaying past entries, and a header calculating the running total._

  </TabItem>
  <TabItem value="flashcards" label="Digital flashcard maker">

> _Build a digital flashcard app with a Serverpod backend. The UI should have a form to create cards (question and answer) and a 'Study Mode' view that shows one card at a time, featuring a 'Flip' button to reveal the answer and a 'Next' button._

  </TabItem>
  <TabItem value="journal" label="Daily journal">

> _Build a journal app with a Serverpod backend. Include a simple UI with a large text area to save plain-text entries, and display a chronological feed of past entries below it (newest first)._

  </TabItem>
</Tabs>

---

The agent will start building your app. It will manage your database and perform a hot reload when the app is complete.

:::tip

If the agent fails to reload the app, you can always hit the `R` key to force a restart of the server and the app.

:::

## Deploy the app to the cloud

Deploy your app to **[Serverpod Cloud](/cloud)**, a fully managed platform built by the Serverpod team. Your first project includes a one-month free trial, with no credit card required.

Create your Cloud account on the **[Serverpod Cloud Console](https://console.serverpod.cloud/)**, then install the Serverpod Cloud command line tools:

```bash
$ dart pub global activate serverpod_cloud_cli
```

From your project's root folder, launch your app:

```bash
$ scloud launch
```

This creates the Cloud project, provisions a database, and deploys your backend along with the web build of your app.

After the first launch, redeploy changes with:

```bash
$ scloud deploy
```

:::tip

In the **[Serverpod Cloud Console](https://console.serverpod.cloud/)**, open Serverpod Insights to view server logs, CPU usage, and other information.

:::
