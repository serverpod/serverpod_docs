---
sidebar_position: -1
---

# Installing Serverpod
Serverpod is an open-source, scalable app server written in Dart for the Flutter community. Serverpod automatically generates your model and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/QN6juNWW3js" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>


## Command line tools
Serverpod is tested on Mac, Windows, and Linux. Before you can install Serverpod, you need to have the following tools installed:
- __Flutter__ and __Dart__. You will need Flutter version 3.7 or later. https://flutter.dev/docs/get-started/install
- __Docker__. Docker is used to manage Postgres and (optionally) Redis. https://docs.docker.com/get-docker/

Once you have Flutter and Docker installed and configured, open up a terminal and install Serverpod by running:

```bash
$ dart pub global activate serverpod_cli
```

Now test the installation by running:

```bash
$ serverpod
```

If everything is correctly configured, the help for the `serverpod` command is now displayed.

## Serverpod Insights
Serverpod Insights is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.

![Serverpod Insights](https://serverpod.dev/assets/img/serverpod-screenshot.webp)

:::info

Download the latest version here: __[Serverpod Insights](insights)__. It is compatible with Serverpod version 1.2.x. Always use the same version of Serverpod Insights as for the framework itself.

:::

## VS Code Extension
The Serverpod VS Code extension makes it easy to work with your Serverpod projects. It provides real-time diagnostics and syntax highlighting for model files in your project.

![Serverpod extension](/img/syntax-highlighting.png)

Install the extension from the VS Code Marketplace: __[Serverpod extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod)__

:::info

The extension requires Serverpod 1.2 or later.

:::
