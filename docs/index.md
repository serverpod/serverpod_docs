---
sidebar_position: -1
---

# Installing Serverpod

Serverpod is an open-source, scalable app server written in Dart for the Flutter community. Serverpod automatically generates your model and client-side code by analyzing your server. Calling a remote endpoint is as easy as making a local method call.

<div style={{ position : 'relative', paddingBottom : '56.25%', height : '0' }}><iframe style={{ position : 'absolute', top : '0', left : '0', width : '100%', height : '100%' }} width="560" height="315" src="https://www.youtube-nocookie.com/embed/F7WKovEFdnw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Command line tools

Serverpod is tested on Mac, Windows, and Linux. Before you can install Serverpod, you need to have __[Flutter](https://flutter.dev/docs/get-started/install)__ installed.


Install Serverpod by running:

```bash
$ dart pub global activate serverpod_cli
```

Now test the installation by running:

```bash
$ serverpod
```

If everything is correctly configured, the help for the `serverpod` command is now displayed.

## VS Code Extension

The Serverpod VS Code extension makes it easy to work with your Serverpod projects. It provides real-time diagnostics and syntax highlighting for model files in your project.

![Serverpod extension](/img/syntax-highlighting.png)

Install the extension from the VS Code Marketplace: __[Serverpod extension](https://marketplace.visualstudio.com/items?itemName=serverpod.serverpod)__

## Serverpod Insights

__[Serverpod Insights](tools/insights)__ is a companion app bundled with Serverpod. It allows you to access your server's logs and health metrics. Insights is available for Mac and Windows, but we will be adding support for Linux in the future.

![Serverpod Insights](https://serverpod.dev/assets/img/serverpod-screenshot.webp)

