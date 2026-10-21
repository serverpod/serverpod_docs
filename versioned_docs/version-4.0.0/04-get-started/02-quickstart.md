---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quickstart

This quickstart shows you how to build a full-stack Flutter and Serverpod app with an AI coding agent and deploy it to the web, all in about 15 minutes.

## Prerequisites

- [Flutter](https://flutter.dev/docs/get-started/install) 3.44.4 or later, which includes Dart 3.12.2
- An AI coding agent, such as Claude Code, Cursor, or Antigravity

To check your Flutter version, run:

```bash
flutter doctor
```

:::info
You don't need to install or set up a database. New projects use an embedded PostgreSQL database that Serverpod downloads and runs for you.
:::

## Install Serverpod

:::warning
If you installed an earlier version of Serverpod with `dart pub global activate`, remove it before you install:

```bash
dart pub global deactivate serverpod_cli
```

:::

1. Install the Serverpod CLI with Dart:

    ```bash
    dart install serverpod_cli
    ```

2. Verify the installation:

    ```bash
    serverpod
    ```

    You'll see a list of Serverpod commands.

3. To make the `serverpod` command available in new terminals, add the Dart install directory to your `PATH`:

   <Tabs>
     <TabItem value="macos" label="macOS" default>

   ```bash
   echo 'export PATH="$PATH:$HOME/Library/Application Support/Dart/install/bin"' >> ~/.zshrc
   ```

     </TabItem>
     <TabItem value="linux" label="Linux">

   ```bash
   echo 'export PATH="$PATH:$HOME/.pub-cache/bin"' >> ~/.bashr
   source ~/.bashrc
   ```

     </TabItem>
     <TabItem value="windows" label="Windows">

   ```powershell
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA\Pub\Cache\bin", "User")
   ```

     </TabItem>
   </Tabs>

## Create your project

1. Create a new Serverpod project with the `quickstart` command:

    ```bash
    serverpod quickstart my_project
    ```

2. Follow the prompts to choose your code editor or agent and configure your project. Navigate with your mouse or arrow keys, press `Space` to select, and press `Enter` to create the project. Serverpod configures the project for that editor or agent.

3. Open the `my_project` folder in the editor you selected. It's already set up with Serverpod skills and MCP servers for your agent, and it contains three packages:

    - `my_project_server` is your backend.
    - `my_project_client` is generated code that your app uses to call the server.
    - `my_project_flutter` is your Flutter app.

:::important
**If you use Cursor**, turn on the Serverpod and Dart MCP servers. Open **Customize** in the sidebar, click **MCPs**, and turn on both servers.
:::

## Start your server and app

In your terminal, go to the `my_project` folder and run the [`serverpod start`](./concepts/server-fundamentals/running-your-server) command:

```bash
cd my_project
serverpod start
```

The command starts the local development environment, including the server, Flutter app, and database. The first start takes a few minutes because Serverpod downloads PostgreSQL and builds the app.

When it's ready, the sample app opens in your browser. Try it out by entering your name and clicking **Send**. The server sends back a greeting.

Keep this terminal running. It watches your files and reloads the app every time the code changes.

## Build your app

Instruct your agent to build your app. Here are a few prompts that you can try:

<Tabs>
  <TabItem value="jobs" label="Job board" default>

> _Build a professional job marketplace where employers post openings and manage applications, while job seekers browse listings. Use an editorial-inspired design with bold typography._

  </TabItem>
  <TabItem value="crm" label="CRM">

> _Build a modern CRM for a B2B sales team. Users can manage companies, contacts, and deals. Use a sleek dark theme with vibrant accent colors, compact layouts, and data-rich dashboards._

  </TabItem>
  <TabItem value="journal" label="Social network">

> _Build a modern social network where users share posts, follow each other, comment, and react. Give it a bold consumer-app style with colorful gradients, large avatars, and playful animations._

  </TabItem>
</Tabs>

The agent writes the server code, creates the database tables, and builds the screens. When it's finished, it reloads the app in your browser.

:::tip

- If your app uses authentication, the terminal running `serverpod start` shows the verification code. Press the `C` key to copy the code.
- If the app fails to reload, press the `R` key in the terminal running `serverpod start` to force a restart of the server and the app.

:::

## Deploy your app to Serverpod Cloud

To share your app with others, deploy it to [Serverpod Cloud](/cloud). Serverpod Cloud hosts your backend, database, and web app, and gives you a public URL that anyone can access. Your first project includes a one-month free trial, with no credit card required.

1. Create an account on the [Serverpod Cloud Console](https://console.serverpod.dev/).
2. Create a new project on the Cloud Console.
3. From the `my_project` folder, run:

   ```bash
   scloud launch
   ```

4. Follow the prompts to sign in from the browser and select your Serverpod Cloud account.
5. Back in the terminal, select the Serverpod Cloud project you just created.

`scloud launch` links your project to Cloud and deploys your backend along with your web app. When the launch completes, the terminal displays the URLs for your deployed app and server:

```text
When the server has started, you can access it at:
   Web:      https://my-project.serverpod.space/
   API:      https://my-project.api.serverpod.space/
   Insights: https://my-project.insights.serverpod.space/
```

- **Web:** Your Flutter web app. Open this URL to try your app or share it with others.
- **API:** Your backend endpoint. Your app uses this URL to communicate with the server.
- **Insights:** The endpoint used to connect Serverpod Insights and monitor your server.

After the first launch, you can deploy any changes by running `scloud launch` again.

To monitor your app, use the **Logs**, **Sessions**, and **Metrics** tabs in the [Serverpod Cloud Console](https://console.serverpod.dev/). To learn more, see the [Serverpod Cloud guide](/cloud).

Your full-stack app is now live on the web. Have feedback on the agent skills, MCP servers, or the `serverpod start` workflow? Tell us on [Discord](https://serverpod.dev/discord) or open an issue on [GitHub](https://github.com/serverpod/serverpod).

Happy building with Serverpod 4!
