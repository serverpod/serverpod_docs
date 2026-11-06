---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Quickstart

Build and deploy a full-stack Flutter and Serverpod app, hosted on the web, in 10–15 minutes.

## Prerequisites

- [Flutter](https://docs.flutter.dev/get-started/install) 3.44.4 or later (which includes Dart 3.12.2 or later). To check your version, run `flutter doctor`.
- An AI coding editor, such as Claude Code, Cursor, or Antigravity.

## Install Serverpod

:::warning
If you installed an earlier version of Serverpod with `dart pub global activate`, remove it before you install:

```bash
$ dart pub global deactivate serverpod_cli
```

:::

1. Install the Serverpod CLI:

    ```bash
    $ dart install serverpod_cli
    ```

2. To make the `serverpod` command available in new terminals, add the Dart install directory to your `PATH`:

    <Tabs groupId="os">
      <TabItem value="macos" label="macOS" default>

    ```bash
    $ echo 'export PATH="$PATH:$HOME/Library/Application Support/Dart/install/bin"' >> ~/.zshrc
    ```

      </TabItem>
      <TabItem value="linux" label="Linux">

    ```bash
    $ echo 'export PATH="$PATH:$HOME/.pub-cache/bin"' >> ~/.bashrc
    ```

      </TabItem>
      <TabItem value="windows" label="Windows">

   Run this in PowerShell:

   ```powershell
   [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:LOCALAPPDATA\Dart\install\bin", "User")
   ```

      </TabItem>
    </Tabs>

3. Open a new terminal and verify the installation:

    ```bash
    $ serverpod
    ```

    You'll see a list of Serverpod commands.

## Create your project

1. Create a new Serverpod project:

    ```bash
    $ serverpod quickstart my_project
    ```

2. Follow the prompts to choose your coding editor and click `Enter` to create the project.

3. Open the project folder in your selected editor.

:::important
**If you use Cursor**, turn on the Serverpod and Dart MCP servers. Open **Customize** in the sidebar, click **MCPs**, and turn on both servers.
:::

## Start your app

From the project folder, run [`serverpod start`](./concepts/server-fundamentals/running-your-server):

```bash
$ cd my_project
$ serverpod start
```

This starts your backend server, Flutter app, and database. The first start takes a few minutes while Serverpod downloads PostgreSQL and builds the app.

When startup finishes, the sample app opens in your browser. Enter your name and select **Send**. The server responds with a personalized greeting, `Hello [your_name]`. Keep this terminal running. It watches your files and reloads your app whenever you save a change.

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

The agent will start building your app. It will manage your database and perform a hot reload when the app is complete.

:::tip

- If your app uses authentication, the terminal running `serverpod start` shows the verification code. Press the `C` key to copy the code.
- If the app fails to reload, press the `R` key in the terminal running `serverpod start` to force a restart of the server and the app.

:::

## Deploy your app to Serverpod Cloud

Deploy your app to Serverpod Cloud to make it publicly accessible. Your first project includes a one-month free trial with no credit card required.

1. Create an account in the [Serverpod Cloud Console](https://console.serverpod.dev/).

2. From the project folder, run:

   ```bash
   $ serverpod cloud launch
   ```

3. Select your account from the browser window that opens, then return to your terminal once you see _Login successful_.
4. In your terminal, use the arrow keys to select **Open the browser and create a new project**, then press **Enter**. Your browser opens the project creation page.
5. Enter a **Project ID** to set your public URL and click **Launch Project**.
6. Return to your terminal while the CLI packages and deploys your app.

When rollout finishes, your web app is live at `https://<project-id>.serverpod.space`. To deploy updates later, run `serverpod cloud launch` again from your project directory.

## Next steps

- [Learn how Serverpod works](./03-how-it-works.md): See how your agent builds with Serverpod, and how endpoints, data models, and the database fit together.
- [Monitor your app](/cloud): Use the Logs, Sessions, and Metrics tabs in the [Serverpod Cloud Console](https://console.serverpod.dev/).
- Have feedback or questions? Tell us on [Discord](https://serverpod.dev/discord) or open an issue on [GitHub](https://github.com/serverpod/serverpod). Pull requests are welcome.

Happy building with Serverpod 4!
