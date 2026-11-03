---
title: CLI environment variables
sidebar_position: 1
---

These environment variables affect the `serverpod` command:

- **`SERVERPOD_HOME`** points to the Serverpod framework directory. It is only required when running the CLI in development mode, from a checkout of the Serverpod repository. A normal installation does not need it.
- **Server configuration variables**, the `SERVERPOD_*` and `SERVERPOD_PASSWORD_*` variables, apply to commands that load your project's config, such as `serverpod start` and `serverpod database`. See the [Configuration reference](../../lookups/configuration-reference.md).
