---
sidebar_label: Quickstart
sidebar_class_name: sidebar-icon-quickstart
slug: /quickstart
---

<!-- markdownlint-disable MD041 -->

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CollapsibleCodeBlock from '@site/src/components/CollapsibleCodeBlock';

# Quickstart

This quickstart shows you how to build a full-stack Flutter and Serverpod app with an AI coding agent and deploy it to the web, all in about 15 minutes.

## Prerequisites

- An AI coding agent, such as Claude Code, Cursor, or Antigravity

## Install Serverpod

<Tabs groupId="setup">
  <TabItem value="agent" label="Ask an agent" default>

If you use a coding agent such as Claude Code, Cursor, or Codex, you can configure your development environment with it. Give it this prompt, and the agent will install only what is missing and verify the results.

<CollapsibleCodeBlock expandLabel="Show full prompt">

```text title="Agent setup prompt"
Set up this machine for Serverpod development. Check what is already installed first and only install what is missing. Do not reinstall or upgrade anything without asking me.

1. Flutter: run `flutter --version`. If Flutter is missing, install the latest stable release for this OS following https://docs.flutter.dev/get-started/install. Use the Dart SDK bundled with Flutter, not a separate one.
2. Serverpod CLI: run `serverpod version`. If it is missing, run `dart install serverpod_cli` (if it was previously installed with `dart pub global activate`, run `dart pub global deactivate serverpod_cli` first). If the install fails because the installed Flutter is too old, stop and ask me whether to upgrade Flutter.
3. Make sure `flutter`, `dart`, and `serverpod` are on the PATH for new terminal sessions, including non-interactive shells.
4. Verify by running `flutter doctor`, `dart --version`, and `serverpod version`. Do not install the platform toolchains flutter doctor reports as missing (Android Studio, Xcode, Chrome) unless I ask.

Finish with a summary in exactly this format, one item per line and no other commentary. Leave out a section if it would be empty.

Already installed
- <tool> <version>

Installed
- <tool or package> <version>

Optional, not set up
- <item flutter doctor reports as missing> (<what it is for>)

Use these descriptions for the optional items: Android toolchain (Android apps), Xcode (iOS and macOS apps), Chrome (web apps), Linux toolchain (Linux desktop apps), Visual Studio (Windows desktop apps). After the list, ask if I want any of them installed.

Then ask me: "Do you want me to create a new Serverpod project?" and show the command to do it manually: `serverpod create <project_name>`.
```

</CollapsibleCodeBlock>
  </TabItem>
  <TabItem value="manual" label="Setup manually">

:::warning
If you installed an earlier version of Serverpod with `dart pub global activate`, remove it before you install:

```bash
$ dart pub global deactivate serverpod_cli
```

:::

1. Install [Flutter](https://docs.flutter.dev/get-started/install) 3.44.4 or later (which includes Dart 3.12.2 or later). To check your version, run `flutter doctor`.
2. Install the Serverpod CLI:

    ```bash
    $ dart install serverpod_cli
    ```

3. To make the `serverpod` command available in new terminals, add the Dart install directory to your `PATH`:

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

    ```powershell
    [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$env:LOCALAPPDATA\Pub\Cache\bin", "User")
    ```

      </TabItem>
    </Tabs>

4. Open a new terminal and verify the installation:

    ```bash
    $ serverpod
    ```

    You'll see a list of Serverpod commands.

</TabItem>
</Tabs>

## Create your project

1. Create a new Serverpod project:

    ```bash
    $ serverpod quickstart my_project
    ```

2. Follow the prompts to choose your code editor or agent. Navigate with your mouse or arrow keys, press `Space` to select, and press `Enter` to create the project.

3. Open the `my_project` folder in your selected agent or editor. It’s already set up with Serverpod skills and MCP servers for your agent

:::important
**If you use Cursor**, turn on the Serverpod and Dart MCP servers. Open **Customize** in the sidebar, click **MCPs**, and turn on both servers.
:::

## Start your server and app

From the my_project folder, run [`serverpod start`](./concepts/server-fundamentals/running-your-server):

```bash
$ cd my_project
$ serverpod start
```

This starts your server, Flutter app, and database. The first start takes a few minutes while Serverpod downloads PostgreSQL and builds the app.

When it's ready, the sample app opens in your browser. Enter your name and click Send to get a greeting from the server.

Keep this terminal running. It reloads the app whenever your code changes.

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

Deploy your app to Serverpod Cloud to make it publicly accessible. Your first project includes a one-month free trial with no credit card required.

1. Create an account in the [Serverpod Cloud Console](https://console.serverpod.dev/).

2. From your `my_project` folder, run:

   ```bash
   $ serverpod cloud launch
   ```

3. In the browser window that opens, select your account.

4. Back in the terminal, select **Open the browser and create a new project**. Your browser opens the project creation page. Enter a project name and click **Launch Project**.

5. When deployment finishes, the terminal shows your app's URLs:

   ```text
   When the server has started, you can access it at:
      Web:      https://my-project.serverpod.space/
      API:      https://my-project.api.serverpod.space/
      Insights: https://my-project.insights.serverpod.space/
   ```

Your app is now live on the web. Open the **Web** URL to try it, and send the link to anyone you want to share it with.

To deploy later changes, run `serverpod cloud launch` again.

## Next steps

- [Learn how Serverpod works](./03-how-it-works.md): See how your agent builds with Serverpod, and how endpoints, data models, and the database fit together.
- [Monitor your app](/cloud): Use the Logs, Sessions, and Metrics tabs in the [Serverpod Cloud Console](https://console.serverpod.dev/).
- Have feedback or questions? Tell us on [Discord](https://serverpod.dev/discord) or open an issue on [GitHub](https://github.com/serverpod/serverpod).

Happy building with Serverpod 4!
