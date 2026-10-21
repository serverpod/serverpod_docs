---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quickstart

This quickstart shows you how to build a full-stack Flutter and Serverpod app with an AI coding agent and deploy it to the web in about 15 minutes.

## Prerequisites

- [Flutter](https://flutter.dev/docs/get-started/install) 3.44.4 or later, which includes Dart 3.12.2.
- An AI coding agent like Claude Code, Cursor, or GitHub Copilot.

To check your Flutter version, run:

```bash
flutter doctor
```

:::info

You don't need to install or set up a database. New projects use an embedded PostgreSQL that Serverpod downloads and runs for you.

:::

## Install Serverpod

1. Install the Serverpod CLI with Dart:

    ```bash
    dart install serverpod_cli
    ```

2. Verify the installation:

    ```bash
    serverpod
    ```

    You should see a list of available commands.

3. To make the `serverpod` command available in new terminals, add the Dart install directory to your PATH:

   <Tabs>
     <TabItem value="macos" label="macOS" default>

   ```bash
   echo 'export PATH="$PATH:$HOME/Library/Application Support/Dart/install/bin"' >> ~/.zshrc
   ```

     </TabItem>
     <TabItem value="linux" label="Linux">

   ```bash
   echo 'export PATH="$PATH:$HOME/.local/state/Dart/install/bin"' >> ~/.bashrc
   ```

     </TabItem>
     <TabItem value="windows" label="Windows">

   Run this in PowerShell:

   ```powershell
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:APPDATA\Dart\install\bin", "User")
   ```

     </TabItem>
   </Tabs>


:::warning

If you installed an earlier version of Serverpod with `dart pub global activate`, remove it before you install:

```bash
dart pub global deactivate serverpod_cli
```

:::


## Create your project

1. Create a new Serverpod project with the quickstart command:

    ```bash
    serverpod quickstart my_project
    ```

    Follow the prompts to choose your code agent or editor and configure your project. Navigate with your mouse or arrow keys, press `Space` to select, and press `Enter` to create the project. Serverpod uses your selection to set up the project for your selected agent or editor.

2. When setup finishes, open the newly created `my_project` folder in the agent or editor you selected. 
    Serverpod creates a `my_project` folder with three packages:

    - `my_project_server` is your backend.
    - `my_project_client` is generated code that your app uses to call the server.
    - `my_project_flutter` is your Flutter app.

:::important
**If you use Cursor**, you need to turn on the Serverpod and Dart MCP servers. Open **Customize** in the sidebar, click **MCPs**, and turn on both servers. 
:::

## Start your server and app

Open the project folder in your terminal and run the [`serverpod start`](./concepts/server-fundamentals/running-your-server) command:

```bash
serverpod start
```

Keep the terminal open while the app is running. The command starts the local development environment, including the server, Flutter app, and local database. The first start takes a few minutes, because Serverpod downloads PostgreSQL and builds the app. 

When it's ready, the sample app opens in your browser. Try it out by entering your name and clicking **Send**. The server sends back a greeting.

Keep this terminal running. It watches your files and reloads the app every time the agent changes the code.

## Build your app

Instruct your AI agent to build your app. Here are a few simple prompts that you can try:

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


The agent writes the server code, creates the database tables, and builds the screens. When it's finished, it reloads the app and displays the new app on the browser.

:::tip

- If your app uses authentication, the verification code will be displayed as an alert in Serverpod's CLI. Press the `C` key to copy the code.
- If the app fails to reload, click `R` in the terminal running `serverpod start` to force restart the server and the app. 

:::


## Deploy your app to Serverpod Cloud

To share your app with others, deploy it to **[Serverpod Cloud](/cloud)**. Serverpod Cloud hosts your backend, database, and web app, and gives you a public URL that anyone can access. Your first project includes a one-month free trial, and you don't need a credit card.

1. Create an account on the **[Serverpod Cloud Console](https://console.serverpod.dev/)**.
2. Create a project and turn on the database.
3. In the `my_project` folder, run:

   ```bash
   serverpod cloud launch
   ```

4. Follow the prompts to authenticate in the browser and select your Cloud account.
5. Back in the terminal, select the project you want to deploy

This links your project to Cloud and deploys your backend along with your web app. Wait for the deployment to finish, then use the deployed app URL provided by the CLI or Cloud Console to open your app publicly.

After the first launch, you redeploy any changes by running `serverpod cloud launch` again.

:::tip

In the **[Serverpod Cloud Console](https://console.serverpod.dev/)**, open your project and use the **Logs**, **Sessions**, and **Metrics** tabs to monitor your app. See **[Serverpod Cloud guide](/cloud_docs/)** to learn more.

:::

## Get help

We welcome feedback on agent skills, MCP servers, and the `serverpod start` workflow. If you run into issues, reach out on **[Discord](https://serverpod.dev/discord)** or file an issue on **[GitHub](https://github.com/serverpod/serverpod)**. Pull requests are welcome.

Happy building with Serverpod 4.
