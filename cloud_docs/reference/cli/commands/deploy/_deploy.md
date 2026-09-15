# scloud deploy

`scloud deploy` packages your project, uploads it to Serverpod Cloud, and waits for the new version to go live. Run it from the directory containing `scloud.yaml` (typically your project root or server directory) or pass `--project-dir`.

To validate the build without touching the running app, use `scloud deploy --wet-run` (optionally with `--show-files` to preview the upload). To follow an in-flight deploy, run `scloud status deployment show`.

For the full deploy lifecycle, pre-deploy hooks, and how to recover from a failed deploy, see [Deployments](/cloud/concepts/deployments) and [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).
