---
sidebar_label: Recover from a failed deploy
description: Diagnose why your scloud deploy failed, read the build log, identify the failure type, and ship a fix to recover without disrupting any running version.
---

# Recover from a failed deploy

Your `scloud deploy` just failed. This guide walks you through finding what broke and shipping a fix. A failed deploy doesn't disrupt a running version; Cloud only switches traffic to a successful deploy, so if a previous version was live, it stays live.

## Before you start

- The `scloud` CLI installed and authenticated. See [Install scloud](/cloud/getting-started/installation).
- A Serverpod Cloud project with at least one deploy attempt.
- Run the commands below from your server directory (so `scloud.yaml` is auto-detected), or pass `-p <project-id>` from anywhere else.

## Confirm the deploy failed

List recent deployments to see status:

```bash
scloud deployment list
```

A failed deploy shows `FAILURE` in the Status column and a short reason in the Info column:

```text
# | Project | Deploy Id                            | Status  | Started             | Finished            | Info
--+---------+--------------------------------------+---------+---------------------+---------------------+-----------------------------------
0 | my-app  | 73e66b41-64fc-4920-b6ef-4918cc6ceca1 | FAILURE | 2026-06-15 15:19:37 | 2026-06-15 15:20:34 | User build FAILURE - see build log
```

The Info column points at which lifecycle stage failed: Upload, Cloud build, Infra deploy, or Service rollout.

## Read the build log

Build logs are the only surface for build-time errors. Fetch the latest:

```bash
scloud deployment build-log
```

For a specific deploy, pass a sequence number (`0` is the latest) or the deploy UUID from `scloud deployment list`:

```bash
scloud deployment build-log 3
scloud deployment build-log 73e66b41-64fc-4920-b6ef-4918cc6ceca1
```

For long logs, redirect to a file or grep for errors:

```bash
scloud deployment build-log > build-log.txt
scloud deployment build-log | grep ERROR
```

## Identify the failure type

Most failed deploys fall into one of these patterns. Match the log output to the closest one.

**Pre-deploy hook failure.** A script in your `scloud.yaml` under `project.scripts.pre_deploy` exited non-zero, so the upload never happened. Run the failing command locally to reproduce, fix the script, commit, and redeploy. See [Deployment hooks](/cloud/concepts/deployment-hooks) for the failure semantics.

**Upload timeout.** The CLI reports `Send Timeout. Please check your internet connection and try again.` The project never reached Cloud, so nothing was built. Common on first deploys with large project packages or slow connections. Retry with a longer timeout:

```bash
scloud deploy --timeout 120s
```

If the timeout keeps tripping at high values, the issue is likely upstream (network or Cloud-side); retry later.

**Package resolution failure.** Cloud can't resolve your `pubspec.yaml`. Run `dart pub get` locally to reproduce the error, fix the pubspec (mismatched versions, missing packages, private dependencies that aren't configured), and redeploy. For private packages, see [Handling private dependencies](/cloud/reference/deployment/handling-private-dependencies).

**Build failure.** Lines beginning with `ERROR:` or `FAILED:` in the build log, usually pointing at a Dart compile error, a missing import, or a missing dependency. Fix the file in your project, commit, and redeploy.

**Migration failure.** The build succeeds but the server fails to start because a migration in your project's `migrations/` directory can't apply. The deploy is marked failed. Fix the migration locally (often a SQL error or a column that already exists), commit, and redeploy.

## Fix and redeploy

Commit the fix and redeploy:

```bash
scloud deploy
```

Watch the new attempt:

```bash
scloud deployment show
```

When **Service rollout** reports success, Cloud switches traffic to the new version.

## Related

- [Deployments](/cloud/concepts/deployments) for the deploy lifecycle and `scloud deploy --dry-run` to validate before shipping.
- [Logs](/cloud/concepts/logs) for the build-log and runtime-log surfaces.
- [Deployment hooks](/cloud/concepts/deployment-hooks) for pre- and post-deploy hook failure semantics.
- [Database](/cloud/concepts/database) for the migration model and how to reverse a schema change.
