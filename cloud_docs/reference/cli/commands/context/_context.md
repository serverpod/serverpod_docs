# scloud context

`scloud context` manages a locally stored default project. Project-scoped commands fall back to it when no `--project` flag, environment variable, or `scloud.yaml` selects one, so set it once to work on a project from any directory.

For a per-repository default, link the directory instead with [`scloud project link`](/cloud/reference/cli/commands/project).
