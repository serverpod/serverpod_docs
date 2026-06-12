---
title: Introduction
description: How to find any scloud command, read its documentation, and use the global options and environment variables that apply across every command.
sidebar_position: 1
---

The Serverpod Cloud CLI (`scloud`) creates, manages, and deploys your Serverpod projects on Cloud. This reference covers every command, option, and flag.

## Install and authenticate

Before running any command:

- Install `scloud`. See [Install scloud](/cloud/getting-started/installation).
- Authenticate with `scloud auth login` interactively, or pass a personal access token in non-interactive contexts. See [Personal access tokens](/cloud/concepts/personal-access-tokens).

## Command syntax

Every `scloud` invocation follows the same shape:

```text
scloud [global options] <command> [<subcommand>] [arguments] [options]
```

Global options can appear anywhere on the line; `scloud --token foo deploy` and `scloud deploy --token foo` are equivalent. When you run a command from a project directory containing `scloud.yaml`, the project ID is picked up automatically; pass `-p <project-id>` from anywhere else.

## Global options

A small set of options applies to every command: authentication (`--token`), project selection (`-p` / `--project`), output verbosity (`-v` / `--verbose`), and analytics (`-a` / `--analytics`). The full list, including timeouts and config-file overrides, lives on the [Global options](/cloud/reference/cli/global_options) page.

## Environment variables

Most global options have an environment-variable equivalent so workflows and CI don't need flags everywhere. The two you'll reach for most often:

- **Authentication in CI:** `SERVERPOD_CLOUD_TOKEN` (equivalent to `--token`).
- **Project selection:** `SERVERPOD_CLOUD_PROJECT_ID` (equivalent to `-p`).

The full list is on the [CLI environment variables](/cloud/reference/cli/env_vars) page.

## Where the concepts live

Command pages describe *what* a command does. For the *why* and *when*, the concept pages are the home:

- Deploying, validating, rolling back: [Deployments](/cloud/concepts/deployments).
- Pre- and post-deploy automation: [Deployment hooks](/cloud/concepts/deployment-hooks).
- Runtime and build logs: [Logs](/cloud/concepts/logs).
- Default and custom domains: [Custom domains](/cloud/concepts/custom-domains).
- Managed PostgreSQL: [Database](/cloud/concepts/database).
- Sensitive values and runtime config: [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars).
- CI and headless authentication: [Personal access tokens](/cloud/concepts/personal-access-tokens).

## How this reference is organized

Each command page combines a hand-written introduction with auto-generated subcommand and option listings drawn from `scloud --help`. The sidebar lists commands alphabetically. Use the search box for fast lookup by flag or argument name.
