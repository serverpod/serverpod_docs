---
sidebar_position: 8
title: Deployment hooks
description: Run custom scripts at fixed points in a Serverpod Cloud deploy. Pre-deploy hooks handle setup like code generation; post-deploy hooks send notifications.
---

# Deployment hooks

If you need something to run on every deploy, like database migrations, deployment hooks let you trigger your own scripts before or after `scloud deploy`. Without them, those steps live in a separate command you remember to run yourself.

## When to use hooks

Hooks come in two shapes:

- **`pre_deploy`** for anything that has to run *before* Cloud receives your project (regenerate Serverpod code, build a Flutter web client, compile non-Dart assets, run database migration scripts, run a test suite as a deploy gate).
- **`post_deploy`** for anything that should fire *after* the upload completes (Slack notification, kick a downstream pipeline, mark a release in your tracker).

If your deploy doesn't depend on either, don't add hooks. Deploys work without them.

## Configure hooks

Hooks live in `scloud.yaml` under `project.scripts`. Each hook accepts either a single command (string) or a list of commands (array). See the [scloud.yaml schema](/cloud/reference/scloud-yaml-schema#scripts) for the field types and validation rules.

Single command:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy: serverpod generate
    post_deploy: echo "Deployment complete"
```

Multiple commands run sequentially:

```yaml
project:
  projectId: my-project
  scripts:
    pre_deploy:
      - serverpod generate
      - serverpod run flutter_build
    post_deploy:
      - curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK -d '{"text":"Deployed"}'
```

## How scripts run

Each command runs in your project directory (the one containing `scloud.yaml`) through the system shell (`bash -c` on macOS and Linux, `cmd /c` on Windows). Scripts inherit the environment variables of the shell that invoked `scloud deploy`, so CI-set secrets and your local `PATH` are available. Commands in an array run sequentially; output streams to your terminal in real time as each one executes.

A non-zero exit code halts further commands in that hook.

:::warning

The `pre_deploy` and `post_deploy` hooks fail asymmetrically:

- A failing `pre_deploy` script aborts the deploy *before* Cloud receives your code.
- A failing `post_deploy` script runs *after* the upload, so the deploy has already happened. The `scloud deploy` command exits with an error, but the new version is live.

Plan your scripts accordingly: put anything that must succeed before your code ships in `pre_deploy`.

:::

## Related

- [Deployments](/cloud/concepts/deployments) for the deploy lifecycle around hooks.
- [`scloud deploy`](/cloud/reference/cli/commands/deploy) for the deploy command and its flags.
