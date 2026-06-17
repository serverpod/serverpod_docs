---
sidebar_position: 4
title: scloud.yaml schema
description: "The schema for scloud.yaml: every key, its type, what scloud preserves across commands, and the validation errors you might see."
---

# scloud.yaml schema

A Serverpod project deployed to Serverpod Cloud has a `scloud.yaml` file at its root. The file links the local project to a Cloud project, optionally pins the Dart SDK used for builds, and lists commands to run before or after each deploy.

scloud writes the file in two situations: `scloud launch` creates it on first setup, and `scloud project link` updates it when you point your codebase at a different Cloud project. You can also hand-edit it at any time, and scloud preserves your `dartSdk` and hook scripts across later commands. See [How scloud updates the file](#how-scloud-updates-the-file) for the exact per-field rules.

## File location

The file lives at the root of your project: the workspace root for workspace projects, or the server package directory for single-package projects. When you run `scloud launch`, scloud creates the file in the current directory.

To find the file for any subsequent command, scloud searches the starting directory (the current directory, or the value of `--project-dir`) and up to two levels below it. If no `scloud.yaml` is found and the starting directory contains a `pubspec.yaml`, scloud walks one level up and searches with depth 1; this covers single-package projects where you run scloud from a `client/` or `flutter/` subdirectory. Multiple matches throw an ambiguous-search error. With no match, commands that need a project require `-p <project-id>` instead.

When scloud writes the file, it prepends this comment header so the file is recognizable when you open it:

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

The header is preserved across subsequent scloud updates.

## Schema

One top-level key, `project`, with three fields.

### projectId

**Type:** string. **Required.**

The unique Cloud project identifier the CLI operates on. You set it when you create the project with `scloud launch` or `scloud project create`. See [Project identifier rules](/cloud/reference/project-id-rules) for the naming constraints.

```yaml title="scloud.yaml"
project:
  projectId: "my-app"
```

### dartSdk

**Type:** string. **Optional.**

Pins the Dart SDK version used for builds. When unset, scloud reads `environment.sdk` from your `pubspec.yaml` and uses the lowest version in the supported range. See [Dart SDK versions](/cloud/reference/dart-sdk-versions) for the supported versions.

```yaml title="scloud.yaml"
project:
  dartSdk: "^3.10.3"
```

### scripts

**Type:** map. **Optional.**

Holds two hook lists, `pre_deploy` and `post_deploy`. Each runs commands around `scloud deploy`. See [Deployment hooks](/cloud/concepts/deployment-hooks) for when each fires and how failures behave.

#### pre_deploy

**Type:** string or list of strings. **Optional.** **Default:** scloud may suggest hooks during `scloud launch` (typically `serverpod generate`).

Commands that run before scloud uploads your project package. A single string runs one command; a list runs each command in order. Each command runs through the system shell (`bash -c` on macOS and Linux, `cmd /c` on Windows) in your project directory. A non-zero exit code halts further commands and aborts the deploy.

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

Commands that run after scloud finishes uploading. Same shape and shell semantics as `pre_deploy`. A failure here does not roll back the deploy; the new version is already live by then.

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

What `scloud launch` typically writes for a new project (a suggested `pre_deploy` hook, empty `post_deploy`):

```yaml title="scloud.yaml"
project:
  projectId: "my-app"
  dartSdk: "^3.10.3"
  scripts:
    pre_deploy:
      - "serverpod generate"
    post_deploy: []
```

## How scloud updates the file

Both `scloud launch` and `scloud project link` rewrite `scloud.yaml` to reflect the current project. They apply these rules to each field:

- **`projectId`** is set to the project the command targets. Treat it as scloud-managed; hand-edits won't survive the next run.
- **`dartSdk`** is preserved as you wrote it, unless the command sets a new value.
- **`scripts.pre_deploy`** is merged. Your custom hooks are kept. Hooks that scloud considers "suggested" (for example `serverpod generate` for projects that need it) are re-added on every run, even if you removed them.
- **`scripts.post_deploy`** is preserved entirely.

In practice, hand-edit `dartSdk` and `post_deploy` freely, and add your own `pre_deploy` hooks alongside any suggested ones. Editing `projectId` by hand has no lasting effect; use `scloud project link` to change which project the file points at.

## Validation errors

scloud parses `scloud.yaml` on every command that needs project context. Validation failures raise `SchemaValidationException` in one of three forms.

### Missing required field

```text
Missing required key: "project.projectId"
```

The required `projectId` field is absent. Add it, or run `scloud project link <project-id>` to set it for you.

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
- [scloud project](/cloud/reference/cli/commands/project)
