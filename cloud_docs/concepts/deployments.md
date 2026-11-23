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

The command also takes these flags:

- `-v` (`--verbose`): Shows detailed output.
- `--dart-version`: Overrides the Dart SDK used at build time.
- `--concurrency=<N>`: Sets how many files are zipped in parallel during packaging (default `5`).

The CLI packages your project, uploads it, and waits for the new version to go live. Once the deployment is live, your project is reachable at its default URLs:

- Web: `https://<project-id>.serverpod.space/`
- API: `https://<project-id>.api.serverpod.space/`
- Insights: `https://<project-id>.insights.serverpod.space/`

To use your own URL instead, see [Custom domains](/cloud/concepts/custom-domains).

:::note
Your web content is served through a [CDN](/cloud/concepts/cdn). Each successful deploy clears its cached copies, so the new version is served without waiting for the old copies to expire.
:::

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
# | Project | Deploy Id                            | Status  | Started (local)     | Finished (local)    | Info
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

## Choose what a deploy uploads {#configure-whats-included}

A Serverpod project is a Dart workspace, a folder whose root `pubspec.yaml` lists your server, client, and Flutter app packages. A deploy uploads your server project, the workspace packages your server depends on, and the root `pubspec.yaml` and `pubspec.lock`. Your Flutter app isn't uploaded. In a single-package project, a deploy uploads only the server project.

Within what's uploaded, a deploy leaves out:

- Files your `.gitignore` files exclude
- Hidden files and folders, whose names start with `.`
- Files your `.scloudignore` files exclude

The CLI creates a `.scloudignore` in your server project, such as `my_project_server/`, when you link or deploy the project. In a workspace, it also creates one in the workspace root. Its template already leaves out your passwords and config files. It also keeps your generated code and the files under `web/`, such as your Flutter web build, even where `.gitignore` excludes them.

The syntax mirrors `.gitignore`. Two rules decide where to put a pattern:

- **Patterns with a `/`:** A pattern with a `/` at the start or in the middle is relative to the folder of the `.scloudignore` it's in. Other patterns match at any depth.
- **Patterns with a `!`:** To upload a file that a `.gitignore` excludes, add the pattern with a `!` prefix to a `.scloudignore` in the same folder as that `.gitignore`, or in a folder below it. For files in your server project, that's usually the server project's `.scloudignore`.

Here's an example `.scloudignore` for your server project:

```text title="my_project_server/.scloudignore"
# Exclude a specific file
/specific_file.txt

# Exclude all log files
*.log

# Exclude a directory and its contents
/large_dir/

# Include a file that .gitignore excludes
!assets/data/initial_data.csv
```

The Serverpod Cloud CLI may generate intermediate files under `.scloud/` directories. In a workspace project, the CLI adds this pattern to the workspace root's `.gitignore` for you. In any other project, add it yourself so the files stay out of version control:

```text title=".gitignore"
# scloud deployment generated files should not be committed to git
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
- [Content delivery and caching](/cloud/concepts/cdn) for how the CDN caches your web content and clears it on every deploy.
- [Scale to zero](/cloud/concepts/scale-to-zero) for how an idle project stops its server and starts it again on the next request.
