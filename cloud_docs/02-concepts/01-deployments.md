---
title: Deployments
description: Deploy your Serverpod app to Cloud, check deployment status, validate packages before deploying, and control what's included in the deployment.
---

# Deployments

A deployment is your Serverpod app packaged, uploaded, built, and run on Cloud. Each `scloud deploy` produces a new immutable deployment with its own ID and lifecycle, and Cloud serves the most recent successful one. Subsequent deploys roll your app forward without anything else for you to do.

## Deploy your app

Before deploying, run `serverpod generate` so your models and endpoints are up to date. Then deploy with:

```bash
scloud deploy
```

The CLI packages your project, uploads it, kicks off the build, and prints URLs you can access once the deployment is live:

```text
✓ Project uploaded successfully! 🚀

When the server has started, you can access it at:
  Web:      https://my-app.serverpod.space/
  API:      https://my-app.api.serverpod.space/
  Insights: https://my-app.insights.serverpod.space/

See `scloud domain --help` to set up a custom domain.
```

Each deployment moves through four stages: **Booster liftoff** (upload), **Orbit acceleration** (build), **Orbital insertion** (deploy), and **Pod commissioning** (service ready).

:::tip

If your app includes a Flutter web frontend, bump the version in your Flutter app's `pubspec.yaml` before each deploy. Otherwise an old version of the web app may be cached by the user's browser.

:::

Pass `-v` (`--verbose`) for detailed output, or `--dart-version` to override the Dart SDK used at build time.

## Check deployment status

Watch the latest deployment as it runs:

```bash
scloud deployment show
```

Output:

```text
Tracking status of my-app deploy 4583d0a1-3d0a-400e-a9a5-9880da6abc94, started at 2026-06-03 13:41:21:

✓ Booster liftoff:      Upload successful!
✓ Orbit acceleration:   Build successful!
✓ Orbital insertion:    Deploy successful!
✓ Pod commissioning:    Service successful! 🚀
```

List recent deployments:

```bash
scloud deployment list
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

## Related

- [Deployment hooks](/cloud/reference/deployment/deployment-hooks) for pre- and post-deploy automation.
- [Handling private dependencies](/cloud/reference/deployment/handling-private-dependencies) for private package access during the build.
- [Including non-Dart files](/cloud/reference/deployment/assets) for static assets.
- [Deploying using GitHub Actions](/cloud/reference/deployment/github-automation) for CI/CD setups.
