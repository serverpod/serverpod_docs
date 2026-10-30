---
sidebar_position: 4
sidebar_label: Recover from a failed deploy
description: Diagnose why a deploy to Serverpod Cloud failed, read the build log, identify the failure type, and ship a fix to recover without disrupting any running version.
---

# Recover from a failed deploy

When a deployment to Serverpod Cloud fails, use this guide to identify the cause, fix the problem, and deploy again. A failed deployment does not replace the currently running version. Serverpod Cloud switches traffic only after a successful deployment. If a previous version was live, it remains live.

## Before you start

Ensure you have:

- The Serverpod Cloud CLI set up and authenticated. See [Set up the Cloud CLI](/cloud/getting-started/installation).
- A Serverpod Cloud project with at least one deploy attempt.

## 1. Confirm the failed deployment

List recent deployments to identify the failed attempt:

```bash
serverpod cloud status deployment list
```

A failed deploy shows `FAILURE` in the Status column and a reason in the Info column. For example:

```text
# | Project | Deploy Id                            | Status  | Started (local)     | Finished (local)    | Info
--+---------+--------------------------------------+---------+---------------------+---------------------+-----------------------------------
0 | my-app  | 73e66b41-64fc-4920-b6ef-4918cc6ceca1 | FAILURE | 2026-06-15 15:19:37 | 2026-06-15 15:20:34 | User build FAILURE - see build log
```

Copy the deployment ID so you can inspect the logs for that specific attempt.

## 2. Inspect the build logs

Build-time errors appear only in the build log. Start by retrieving the latest build log:

```bash
serverpod cloud build log
```

To inspect a specific deployment, pass its sequence number (`0` is the latest) or deployment UUID from `serverpod cloud status deployment list`:

```bash
serverpod cloud build log 3
serverpod cloud build log 73e66b41-64fc-4920-b6ef-4918cc6ceca1
```

For long logs, redirect the output to a file or search for error messages:

```bash
serverpod cloud build log > build-log.txt
serverpod cloud build log | grep ERROR
```

## 3. Diagnose and fix the failure

Find the symptom that best matches your deployment status or logs, then expand the corresponding section.

<div className="troubleshooting-accordions">

<details>
<summary><strong>A pre-deploy script failed</strong></summary>

A script in your `scloud.yaml` under `project.scripts.pre_deploy` exited with a non-zero status, so the CLI stopped before uploading your project.

To fix:

1. Run the failing command locally to reproduce the error.
2. Fix script logic, file paths, or missing local environment variables.

See [Deployment hooks](/cloud/concepts/deployment-hooks) for the failure semantics and the [scloud.yaml schema](/cloud/reference/scloud-yaml-schema#pre_deploy) for the accepted formats.

</details>

<details>
<summary><strong>The CLI reported a send timeout</strong></summary>

The CLI reports `Send Timeout. Please check your internet connection and try again`. The project failed to upload to Serverpod Cloud within the default network timeout window. This commonly occurs on slower connections or first deploys containing large assets.

Increase the upload timeout and redeploy:

```bash
serverpod cloud deploy --timeout 120s
```

If the problem persists, check your network connection and retry later.

</details>

<details>
<summary><strong>The deployment failed to resolve dependencies</strong></summary>

Serverpod Cloud cannot resolve packages declared in `pubspec.yaml`.

To fix:

1. Run `dart pub get` locally.
2. Resolve version conflicts, missing packages, or private dependency configuration issues.

For private packages, see [Private dependencies](/cloud/reference/private-dependencies).

</details>

<details>
<summary><strong>The build failed with compilation errors</strong></summary>

Lines starting with `ERROR:` or `FAILED:` in the build log often indicate a Dart compilation error, missing import, or missing dependency. Fix the relevant code or dependency and redeploy.

</details>

<details>
<summary><strong>The build succeeded, but a database migration failed</strong></summary>

The build succeeded, but pending schema changes in `migrations/` failed to apply.

To fix:

1. View the runtime server logs to find the exact database error:

    ```bash
    serverpod cloud log
    ```

2. Look for `Failed to apply database migrations`. Common causes are duplicate columns or malformed SQL.
3. Correct the migration locally.

</details>

<details>
<summary><strong>The build succeeded, but the server crashed on startup</strong></summary>

The CLI reports `Rollout failed.`, and the Info column shows `Deployment failed: the new version did not become healthy and did not roll out.`

To fix:

1. Check the runtime server logs:

    ```bash
    serverpod cloud log
    ```

2. Look for `Unhandled exception:` and inspect the stack trace.

If the error is `Bad state: FutureCalls is not initialized.`, your server is trying to schedule a future call, which isn't supported on the Starter plan. To use future calls, [upgrade to the Growth or Enterprise plan](https://serverpod.dev/cloud) and redeploy.

</details>

</div>

## 4. Redeploy and verify

Once the issue is resolved locally, re-run the deployment and monitor the rollout:

```bash
serverpod cloud deploy
serverpod cloud status deployment show
```

When **Rollout** reports success, Cloud switches traffic to the new version.

## Related

- [Deployments](/cloud/concepts/deployments) for the deploy lifecycle and `serverpod cloud deploy --wet-run` to validate before shipping.
- [Logs](/cloud/concepts/logs) for the build-log and runtime-log surfaces.
- [Deployment hooks](/cloud/concepts/deployment-hooks) for pre- and post-deploy hook failure semantics.
- [Database](/cloud/concepts/database) for the migration model and how to reverse a schema change.
