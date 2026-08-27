# scloud context

`scloud context` manages the global project context: a locally stored project ID that `scloud` uses when a command doesn't get a project from `-p` / `--project`, `SERVERPOD_CLOUD_PROJECT_ID`, or `scloud.yaml`. The setting is a last-resort default and applies across directories.

To pin a specific codebase to a Cloud project, run [`scloud project link`](/cloud/reference/cli/commands/project). That writes `scloud.yaml` in the project directory, which takes precedence over the global context.
