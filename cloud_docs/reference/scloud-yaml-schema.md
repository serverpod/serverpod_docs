---
sidebar_position: 4
title: scloud.yaml schema
description: "The schema for scloud.yaml: every key, its type, what the Cloud CLI preserves across commands, and the validation errors you might see."
---

# scloud.yaml schema

A Serverpod project deployed to Serverpod Cloud has a `scloud.yaml` file at its root. The file links the local project to a Cloud project, optionally pins the Dart SDK used for builds, and lists commands to run before or after each deploy.

Two commands write the file: `serverpod cloud launch` creates it on first setup, and `serverpod cloud project link` creates or updates it when you link your codebase to a Cloud project. You can also hand-edit it at any time, and the Cloud CLI preserves your `dartSdk` and hook scripts across later commands. See [How the Cloud CLI updates the file](#how-the-cloud-cli-updates-the-file) for the exact per-field rules.

## File location

The file lives in your server package directory, alongside the server's `pubspec.yaml`. In a workspace project, that's the `*_server` package directory; in a single-package project, it's the project root.

To find the file for any subsequent command, the CLI searches the starting directory (the current directory, or the value of `--project-dir`) and up to two levels below it. If no `scloud.yaml` is found and the starting directory contains a `pubspec.yaml`, it walks one level up and searches with depth 1. This covers single-package projects where you run commands from a `client/` or `flutter/` subdirectory. Multiple matches throw an ambiguous-search error. With no match, commands that need a project require `-p <project-id>` instead.

When the CLI writes the file, it prepends this comment header so the file is recognizable when you open it:

```yaml
# This file configures your Serverpod Cloud project.
# It is automatically generated and updated by the `scloud` command.
# 
# Useful commands:
# - Deploy: `scloud deploy`
# - Get Help: `scloud help`
#
# For full documentation, visit: https://docs.serverpod.dev/cloud
```

The CLI keeps the header when it rewrites the file.

## Schema

One top-level key, `project`, with three fields.

### projectId

**Type:** string. **Required.**

The unique Cloud project identifier the CLI operates on. You set it when you create the project with `serverpod cloud launch` or `serverpod cloud project create`. See [Project identifier rules](/cloud/reference/project-id-rules) for the naming constraints.

```yaml title="scloud.yaml"
project:
  projectId: "my-app"
```

### dartSdk

**Type:** string. **Optional.**

Pins the Dart SDK version used for builds. When unset, the CLI falls back to your `.tool-versions` file and then the `environment.sdk` constraint in your `pubspec.yaml`. See [Dart SDK versions](/cloud/reference/dart-sdk-versions) for the supported versions and the full selection order.

```yaml title="scloud.yaml"
project:
  dartSdk: "^3.10.3"
```

### scripts

**Type:** map. **Optional.**

Holds two hook lists, `pre_deploy` and `post_deploy`. Each runs commands around `serverpod cloud deploy`. See [Deployment hooks](/cloud/concepts/deployment-hooks) for when each fires and how failures behave.

#### pre_deploy

**Type:** string or list of strings. **Optional.** **Default:** `serverpod cloud launch` may suggest hooks (typically `serverpod generate`).

Commands that run before the CLI uploads your project package. A single string runs one command. A list runs each command in order. Each command runs through the system shell (`bash -c` on macOS and Linux, `cmd /c` on Windows) in your project directory. A non-zero exit code halts further commands and aborts the deploy.

Single command:

```yaml title="scloud.yaml"
project:
  scripts:
    pre_deploy: "serverpod generate"
```

Multiple commands:

```yaml title="scloud.yaml"
project:
  scripts:
    pre_deploy:
      - "serverpod generate"
      - "flutter build web"
```

#### post_deploy

**Type:** string or list of strings. **Optional.** **Default:** `[]` (empty list).

Commands that run after the CLI finishes uploading, before Cloud finishes building and rolling out the new version. Same shape and shell semantics as `pre_deploy`. A failure here makes `serverpod cloud deploy` exit with an error, but Cloud keeps deploying. Check the result with `serverpod cloud status deployment show`.

Empty (the default on a freshly created project):

```yaml title="scloud.yaml"
project:
  scripts:
    post_deploy: []
```

Single command:

```yaml title="scloud.yaml"
project:
  scripts:
    post_deploy: "curl -X POST https://example.com/notify"
```

## Complete example

A minimal valid file:

```yaml title="scloud.yaml"
project:
  projectId: "my-app"
```

What `serverpod cloud launch` typically writes for a new project (a suggested `pre_deploy` hook, empty `post_deploy`):

```yaml title="scloud.yaml"
project:
  projectId: "my-app"
  dartSdk: "^3.10.3"
  scripts:
    pre_deploy:
      - "serverpod generate"
    post_deploy: []
```

## How the Cloud CLI updates the file

Both `serverpod cloud launch` and `serverpod cloud project link` rewrite `scloud.yaml` to reflect the current project. They apply these rules to each field:

- **`projectId`** is set to the project the command targets. Treat it as managed by the CLI. Hand-edits won't survive the next run.
- **`dartSdk`** is preserved as you wrote it, unless the command sets a new value.
- **`scripts.pre_deploy`** is merged. Your custom hooks are kept. Hooks that the CLI considers "suggested" (for example `serverpod generate` for projects that need it) are re-added on every run, even if you removed them.
- **`scripts.post_deploy`** is preserved entirely.

In practice, hand-edit `dartSdk` and `post_deploy` freely, and add your own `pre_deploy` hooks alongside any suggested ones. Editing `projectId` by hand has no lasting effect. To change which project the file points at, use `serverpod cloud project link`.

## Validation errors

The CLI parses `scloud.yaml` on every command that needs project context. Validation failures raise `SchemaValidationException` in one of three forms.

### Missing required field

```text
Missing required key: "project.projectId"
```

The required `projectId` field is absent. Add it, or run `serverpod cloud project link <project-id>` to set it for you.

### Wrong type for a field

```text
At path "project.projectId": Expected String, got int
```

A field's value is the wrong type. The path tells you which field; the expected and actual types tell you what to change.

### Wrong format for a script field

```text
At path "project.scripts.pre_deploy": Expected one of String, [String]
```

The `pre_deploy` or `post_deploy` value is neither a string nor a list of strings. Change it to either form (see [`pre_deploy`](#pre_deploy) for examples).

## Related

- [Project identifier rules](/cloud/reference/project-id-rules)
- [Dart SDK versions](/cloud/reference/dart-sdk-versions)
- [Deployment hooks](/cloud/concepts/deployment-hooks)
- [CLI reference: `project` command](/cloud/reference/cli/commands/project)
