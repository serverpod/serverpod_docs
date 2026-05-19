---
title: Introduction
sidebar_position: 1
---

The Serverpod Cloud CLI provides all you need to create, manage, and deploy your
Serverpod projects in Serverpod Cloud.

> If you're new to developing with Serverpod, check out the [create a Serverpod project guide](https://docs.serverpod.dev/get-started) in the Serverpod framework docs!


## Getting started

Run the following to install the CLI:

```sh
dart pub global activate serverpod_cloud_cli
```

Log in to your Serverpod Cloud account using the CLI:
<br/>(If you don't have a Serverpod Cloud account yet, visit [Serverpod Cloud](https://serverpod.cloud/).)

```sh
scloud auth login
```

Go to your Serverpod server directory (e.g. `./myproject/myproject_server`)
and run the [`launch` command](/cloud/reference/cli/commands/launch)
to get an interactive, guided set up of a new Serverpod Cloud project:

```sh
scloud launch
```

If the project requires any environment variables, secrets, or passwords, they can be added with the [`variable`](/cloud/reference/cli/commands/variable), [`secret`](/cloud/reference/cli/commands/secret), and [`password`](/cloud/reference/cli/commands/password) commands. See the [Configuration Management guide](/cloud/guides/passwords) for details on when to use each. Once the project is ready to be deployed, run the following command:

```sh
scloud deploy
```

To follow the progress of the deployment, use the [`deployment show` command](/cloud/reference/cli/commands/deployment):

```sh
scloud deployment show
```

That's it, you have now deployed your Serverpod app! 🚀

For more information on the different commands, see the commands section in the side menu. For instance, to view the service's domains or to add your own custom domains, see the [`domain` command](/cloud/reference/cli/commands/domain).
