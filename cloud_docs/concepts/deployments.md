---
sidebar_position: 1
title: Deployments
description: Deploy your Serverpod app to Cloud, check deployment status, validate packages before deploying, and control what's included in the deployment.
---

# Deployments

When you ship a code change to Serverpod Cloud, `serverpod cloud deploy` builds and rolls out a new version of your server. Cloud switches traffic automatically to the latest successful deploy, keeping the previous one live if a build fails.

## Deploy your app

:::info
If this is the first time you're deploying this project to Cloud, follow [Deploy your first app](/cloud/getting-started/launch) first. It walks through `serverpod cloud launch`, which creates the project before the first deploy.
:::

Deploy your project to Cloud:

```bash
serverpod cloud deploy
```

The CLI packages your project, uploads it, and waits for the new version to go live. Once the deployment is live, your project is reachable at its default URLs:

- Web: `https://<project-id>.serverpod.space/`
- API: `https://<project-id>.api.serverpod.space/`
- Insights: `https://<project-id>.insights.serverpod.space/`

To use your own URL instead, see [Custom domains](/cloud/concepts/custom-domains).

Other flags:

- `-v` (`--verbose`): detailed output.
- `--dart-version`: override the Dart SDK used at build time.
- `--concurrency=<N>`: how many files are zipped in parallel during packaging (default `5`).

To regenerate code or run other tasks before each deploy, configure a pre-deploy hook. See [Deployment hooks](/cloud/concepts/deployment-hooks).

## Check deployment status

Watch the latest deployment as it runs:

```bash
serverpod cloud status deployment show
```

The command tracks the deployment through its three lifecycle stages and updates each line as it progresses. When complete:

```text
Tracking my-app deployment 4583d0a1-3d0a-400e-a9a5-9880da6abc94
(Press Ctrl+C to exit)

Upload successful.
Cloud build successful.
Rollout successful. 🚀
```

The three stages are **Upload** (your project package reaches Cloud), **Cloud build** (Cloud builds the container), and **Rollout** (Cloud prepares the infrastructure and the new version starts serving requests).

List recent deployments:

```bash
serverpod cloud status deployment list
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
serverpod cloud status deployment show <deployment-id>
```

Stream the build log for a deployment that failed during the build stage:

```bash
serverpod cloud build log
```

## Validate before deploying

A wet run performs every step except the deployment itself, leaving the running app untouched:

```bash
serverpod cloud deploy --wet-run
```

Preview the file tree that will be uploaded, with ignored files marked:

```bash
serverpod cloud deploy --show-files
```

Combine the two flags to inspect what will be uploaded without deploying:

```bash
serverpod cloud deploy --wet-run --show-files
```

Save the package to a local zip (useful for CI inspection or air-gapped environments):

```bash
serverpod cloud deploy --output deployment.zip --wet-run
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

The Serverpod Cloud CLI may generate intermediate files under `.scloud/` directories. Add the pattern to your project's `.gitignore` so they don't end up in version control:

```text title=".gitignore"
# scloud deployment generated files
**/.scloud/
```

Verify your ignore patterns:

```bash
serverpod cloud deploy --wet-run --show-files
```

## Troubleshooting

**Build failure.** Stream the build log and look for lines beginning with `ERROR:` or `FAILED:`:

```bash
serverpod cloud build log
```

Common causes are missing dependencies in `pubspec.yaml` or compile errors in your code.

**Package resolution failure.** Update your `pubspec.yaml` (run `dart pub get` locally to verify), then redeploy.

For a step-by-step walkthrough, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).

## Related

- [Deployment hooks](/cloud/concepts/deployment-hooks) for pre- and post-deploy automation.
- [Private dependencies](/cloud/reference/private-dependencies) for private package access during the build.
- [Ship non-Dart files with your server](/cloud/guides/ship-non-dart-files) for shipping static assets like configuration and templates.
- [Deploy from CI with GitHub Actions](/cloud/guides/deploy-from-ci-with-github-actions) for shipping every push.
