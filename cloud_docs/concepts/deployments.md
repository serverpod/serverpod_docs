---
sidebar_position: 1
title: Deployments
description: Deploy your Serverpod app to Cloud, check deployment status, validate packages before deploying, and control what's included in the deployment.
---

# Deployments

When you ship a code change to Serverpod Cloud, `scloud deploy` builds and rolls out a new version of your server. Cloud switches traffic automatically to the latest successful deploy, keeping the previous one live if a build fails.

## Deploy your app

:::info
If this is the first time you're deploying this project to Cloud, follow [Deploy your first app](/cloud/getting-started/launch) first. It walks through `scloud launch`, which creates the project before the first deploy.
:::

Deploy your project to Cloud:

```bash
scloud deploy
```

The CLI packages your project, uploads it, and waits for the new version to go live. Once the deployment is live, your project is reachable at its default URLs:

- Web: `https://<project-id>.serverpod.space/`
- API: `https://<project-id>.api.serverpod.space/`
- Insights: `https://<project-id>.insights.serverpod.space/`

To use your own URL instead, see [`scloud domain`](/cloud/reference/cli/commands/domain).

Other flags:

- `-v` (`--verbose`): detailed output.
- `--dart-version`: override the Dart SDK used at build time.
- `--concurrency=<N>`: how many files are zipped in parallel during packaging (default `5`).

To regenerate code or run other tasks before each deploy, configure a pre-deploy hook. See [Deployment hooks](/cloud/concepts/deployment-hooks).

## Check deployment status

Watch the latest deployment as it runs:

```bash
scloud deployment show
```

The command tracks the deployment through its four lifecycle stages and updates each line as it progresses. When complete:

```text
Tracking my-app deployment 4583d0a1-3d0a-400e-a9a5-9880da6abc94
(Press Ctrl+C to exit)

Upload successful.
Cloud build successful.
Infra deploy successful.
Service rollout successful. 🚀
```

The four stages are **Upload** (your project package reaches Cloud), **Cloud build** (Cloud builds the container), **Infra deploy** (Cloud prepares the infrastructure for the new version), and **Service rollout** (the new version starts serving requests).

List recent deployments:

```bash
scloud deployment list
```

The list shows deploy IDs alongside status and timestamps:

```text
# | Project | Deploy Id                            | Status  | Started             | Finished            | Info
--+---------+--------------------------------------+---------+---------------------+---------------------+-----------------------------------
0 | my-app  | 4583d0a1-3d0a-400e-a9a5-9880da6abc94 | SUCCESS | 2026-06-03 13:41:21 | 2026-06-03 13:46:08 |
1 | my-app  | 73e66b41-64fc-4920-b6ef-4918cc6ceca1 | FAILURE | 2026-06-02 15:19:37 | 2026-06-02 15:20:34 | User build FAILURE - see build log
```

Inspect a specific deployment by its ID:

```bash
scloud deployment show <deployment-id>
```

Stream the build log for a deployment that failed during the build stage:

```bash
scloud deployment build-log
```

## Validate before deploying

A dry run packages your project and validates the package without uploading or building it:

```bash
scloud deploy --dry-run
```

Preview the file tree that will be uploaded, with ignored files marked:

```bash
scloud deploy --show-files
```

Combine the two flags to inspect what will be uploaded without deploying:

```bash
scloud deploy --dry-run --show-files
```

Save the package to a local zip (useful for CI inspection or air-gapped environments):

```bash
scloud deploy --output deployment.zip --dry-run
```

## Configure what's included

A `.scloudignore` file in your project root controls which files are packaged. The syntax mirrors `.gitignore`.

By default, every file ignored by `.gitignore` is also excluded from the deployment. To include files that `.gitignore` excludes, prefix the pattern with `!` in your `.scloudignore`:

```text title=".scloudignore"
# Exclude a specific file
/specific_file.txt

# Exclude all log files
*.log

# Exclude a directory and its contents
/large_dir/

# Include generated code, even if ignored by .gitignore
!lib/src/generated/
```

`scloud` may generate intermediate files under `.scloud/` directories. Add the pattern to your project's `.gitignore` so they don't end up in version control:

```text title=".gitignore"
# scloud deployment generated files
**/.scloud/
```

Verify your ignore patterns:

```bash
scloud deploy --dry-run --show-files
```

## Troubleshooting

**Build failure.** Stream the build log and look for lines beginning with `ERROR:` or `FAILED:`:

```bash
scloud deployment build-log
```

Common causes are missing dependencies in `pubspec.yaml` or compile errors in your code.

**Package resolution failure.** Update your `pubspec.yaml` (run `dart pub get` locally to verify), then redeploy.

For a step-by-step walkthrough, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).

## Related

- [Deployment hooks](/cloud/concepts/deployment-hooks) for pre- and post-deploy automation.
- [Private dependencies](/cloud/reference/private-dependencies) for private package access during the build.
- [Ship non-Dart files with your server](/cloud/guides/ship-non-dart-files) for shipping static assets like configuration and templates.
- [Deploy from CI with GitHub Actions](/cloud/guides/deploy-from-ci-with-github-actions) for shipping every push.
