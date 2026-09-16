---
sidebar_position: 4
sidebar_label: Recover from a failed deploy
description: Diagnose why a deploy to Serverpod Cloud failed, read the build log, identify the failure type, and ship a fix to recover without disrupting any running version.
---

# Recover from a failed deploy

Your deploy to Serverpod Cloud just failed. This guide walks you through finding what broke and shipping a fix. A failed deploy doesn't disrupt a running version. Cloud only switches traffic to a successful deploy, so if a previous version was live, it stays live.

## Before you start

- The Serverpod Cloud CLI set up and authenticated. See [Set up the Cloud CLI](/cloud/getting-started/installation).
- A Serverpod Cloud project with at least one deploy attempt.

## Confirm the deploy failed

List recent deployments to see status:

```bash
serverpod cloud status deployment list
```

A failed deploy shows `FAILURE` in the Status column and a short reason in the Info column:

```text
# | Project | Deploy Id                            | Status  | Started (local)     | Finished (local)    | Info
--+---------+--------------------------------------+---------+---------------------+---------------------+-----------------------------------
0 | my-app  | 73e66b41-64fc-4920-b6ef-4918cc6ceca1 | FAILURE | 2026-06-15 15:19:37 | 2026-06-15 15:20:34 | User build FAILURE - see build log
```

That reason points at the stage that failed.

## Read the build log

Build logs are the only surface for build-time errors. Fetch the latest:

```bash
serverpod cloud build log
```

For a specific deploy, pass a sequence number (`0` is the latest) or the deploy UUID from `serverpod cloud status deployment list`:

```bash
serverpod cloud build log 3
serverpod cloud build log 73e66b41-64fc-4920-b6ef-4918cc6ceca1
```

For long logs, redirect to a file or grep for errors:

```bash
serverpod cloud build log > build-log.txt
serverpod cloud build log | grep ERROR
```

## Identify the failure type

Most failed deploys fall into one of these patterns. Match the log output to the closest one.

**Pre-deploy hook failure.** A script in your `scloud.yaml` under `project.scripts.pre_deploy` exited non-zero, so the upload never happened. Run the failing command locally to reproduce, fix the script, commit, and redeploy. See [Deployment hooks](/cloud/concepts/deployment-hooks) for the failure semantics and the [scloud.yaml schema](/cloud/reference/scloud-yaml-schema#pre_deploy) for the accepted formats.

**Upload timeout.** The CLI reports `Send Timeout. Please check your internet connection and try again.` The project never reached Cloud, so nothing was built. Common on first deploys with large project packages or slow connections. Retry with a longer timeout:

```bash
serverpod cloud deploy --timeout 120s
```

If the timeout keeps tripping at high values, the issue is likely upstream (network or Cloud-side); retry later.

**Package resolution failure.** Cloud can't resolve your `pubspec.yaml`. Run `dart pub get` locally to reproduce the error, fix the pubspec (mismatched versions, missing packages, private dependencies that aren't configured), and redeploy. For private packages, see [Private dependencies](/cloud/reference/private-dependencies).

**Build failure.** Lines beginning with `ERROR:` or `FAILED:` in the build log, usually pointing at a Dart compile error, a missing import, or a missing dependency. Fix the file in your project, commit, and redeploy.

**Migration failure.** The build succeeds, but a migration in your project's `migrations/` directory can't apply. Check the server logs with `serverpod cloud log` for `Failed to apply database migrations.` Fix the migration locally (often a SQL error or a column that already exists), commit, and redeploy.

## Fix and redeploy

Commit the fix and redeploy:

```bash
serverpod cloud deploy
```

Watch the new attempt:

```bash
serverpod cloud status deployment show
```

When **Rollout** reports success, Cloud switches traffic to the new version.

## Related

- [Deployments](/cloud/concepts/deployments) for the deploy lifecycle and `serverpod cloud deploy --wet-run` to validate before shipping.
- [Logs](/cloud/concepts/logs) for the build-log and runtime-log surfaces.
- [Deployment hooks](/cloud/concepts/deployment-hooks) for pre- and post-deploy hook failure semantics.
- [Database](/cloud/concepts/database) for the migration model and how to reverse a schema change.
