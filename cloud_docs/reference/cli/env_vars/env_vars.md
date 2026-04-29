---
title: CLI environment variables
sidebar_position: 1
---

The `scloud` command supports a number of environment variables, many of which
override the default behavior and / or can be used in place of specifying the
values on the command line.

| Name | In lieu of option | Example value | Description |
|------|-------------------|---------------|-------------|
| `SERVERPOD_CLOUD_PROJECT_ID` | `-p` / `--project` | `my-project-id` | The ID of the project. |
| `SERVERPOD_CLOUD_DISPLAY_UTC` | `-u` / `--utc` | `true` or `false` | Display timestamps in UTC timezone instead of local. |
| `SERVERPOD_CLOUD_COMMAND_ANALYTICS` | `-a` / `--analytics` |  `true` or `false` | Toggles if analytics data is sent. |
| `SERVERPOD_CLOUD_TOKEN` | `--token` |  `your-auth-token-here` | The authentication token to use for the current command. |
| `SERVERPOD_CLOUD_DIR` | `--config-dir` |  `/path/to/config/dir` | Override the directory path where Serverpod Cloud cache/authentication files are stored. |
| `SERVERPOD_CLOUD_PROJECT_DIR` | `-d` / `--project-dir` |  `/path/to/project/server` | The path to the Serverpod Cloud project server directory. |
| `SERVERPOD_CLOUD_PROJECT_CONFIG_FILE` | `--project-config-file` |  `/path/to/scloud.yaml` | The path to the Serverpod Cloud project configuration file. |
| `SERVERPOD_CLOUD_CONNECTION_TIMEOUT` | `--timeout` |  `60s` | The timeout for the connection to the Serverpod Cloud API (defaults to 60 seconds). |
