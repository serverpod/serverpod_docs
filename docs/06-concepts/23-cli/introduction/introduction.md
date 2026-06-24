---
sidebar_label: Introduction
description: The Serverpod CLI reference. Every command, with the global options and environment variables that apply across all of them.
sidebar_position: 1
---

# Introduction to the Serverpod CLI

The Serverpod CLI (`serverpod`) creates projects, generates server and client code, and manages your database migrations from the command line. This reference covers every command, option, and flag.

## Install the CLI

Install the CLI with Dart before running any command:

```bash
dart pub global activate serverpod_cli
```

See [Installation](/get-started/installation) for the full setup, including the prerequisites.

## Command syntax

Every `serverpod` invocation follows the same shape:

```text
serverpod [global options] <command> [<subcommand>] [arguments] [options]
```

Run `serverpod help` to list the commands, or `serverpod help <command>` for the options of a single command.

## Global options

A small set of options applies to every command: output verbosity (`-q` / `--quiet`, `-v` / `--verbose`), analytics (`-a` / `--analytics`), interactive prompts (`--interactive`), and experimental features (`--experimental-features`). The full list lives on the [Global options](/concepts/cli/global_options) page.

## Environment variables

The CLI reads a single environment variable, described on the [Environment variables](/concepts/cli/env_vars) page.

## How this reference is organized

Each command page combines a hand-written introduction with the auto-generated subcommand and option listings drawn from `serverpod help`. The sidebar lists commands alphabetically. Use the search box for fast lookup by flag or argument name.
