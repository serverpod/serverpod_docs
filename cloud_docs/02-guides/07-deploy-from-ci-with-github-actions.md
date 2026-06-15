---
sidebar_label: Deploy from CI with GitHub Actions
description: Use the official serverpod_cloud_deploy GitHub Action to deploy your Serverpod Cloud project on every push to your main branch.
---

# Deploy from CI with GitHub Actions

Use the official [`serverpod/serverpod_cloud_deploy`](https://github.com/serverpod/serverpod_cloud_deploy) action to deploy your Serverpod Cloud project on every push to your main branch. Setup takes about ten minutes once you have a personal access token.

## Before you start

- A personal access token. See [Create a token](/cloud/concepts/personal-access-tokens#create-a-token) on the Personal access tokens page.
- The project's `scloud.yaml` committed to the repository. It's created by `scloud launch` or `scloud link`.
- Either: generated Serverpod files committed to the repository, **or** a CI step that runs `serverpod generate` (covered as a variant below).
- One Serverpod project per repository, located no more than two subdirectory levels below the repository root.

## Add the token as a repository secret

In your GitHub repository, go to **Settings → Secrets and variables → Actions → New repository secret**. Name the secret `SERVERPOD_CLOUD_TOKEN` (or anything else, as long as it matches the workflow below) and paste the token value.

## Add the workflow file

Create `.github/workflows/deploy.yml` with the following workflow:

```yaml title=".github/workflows/deploy.yml"
name: Deploy to Serverpod Cloud

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@v2

      - name: Activate serverpod command
        run: dart pub global activate serverpod_cli

      - uses: serverpod/serverpod_cloud_deploy@v1
        with:
          token: ${{ secrets.SERVERPOD_CLOUD_TOKEN }}
```

What each step does:

- The `actions/checkout@v4` step clones the repository into the runner.
- The `subosito/flutter-action@v2` step installs the Flutter SDK, which also provides Dart. The deploy action needs Dart to install `scloud`.
- The `dart pub global activate serverpod_cli` step puts the framework CLI on the runner so any pre-deploy hooks (for example, `serverpod generate`) can run.
- The `serverpod/serverpod_cloud_deploy@v1` step installs `scloud`, reads your `scloud.yaml`, and runs `scloud deploy` against your project using the token.

## Push to trigger the workflow

Commit the workflow file and push to `main`. Open the **Actions** tab in your repository to watch the run. When it succeeds, confirm the deploy went live:

```bash
scloud deployment show
```

You should see a recent deployment moving through Upload → Cloud build → Infra deploy → Service rollout, finishing with the rocket on **Service rollout**.

## Run `serverpod generate` in CI (variant)

If you don't want to commit generated Serverpod files, run `serverpod generate` as a workflow step instead. The Flutter SDK in the workflow below provides the Dart toolchain `serverpod generate` needs and is also handy if the project's pre-deploy hook builds a Flutter web client.

```yaml title=".github/workflows/deploy.yml"
name: Deploy to Serverpod Cloud

on:
  push:
    branches: [main]

permissions:
  contents: read

env:
  # Replace with your Cloud project ID and the path to your server package.
  PROJECT_ID: your-project-id
  SERVER_DIR: ./path/to/server

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter SDK
        uses: subosito/flutter-action@v2

      - name: Generate Serverpod code
        working-directory: ${{ env.SERVER_DIR }}
        run: |
          dart pub get
          dart pub global activate serverpod_cli
          serverpod generate

      - uses: serverpod/serverpod_cloud_deploy@v1
        with:
          token: ${{ secrets.SERVERPOD_CLOUD_TOKEN }}
          project_id: ${{ env.PROJECT_ID }}
          project_dir: ${{ env.SERVER_DIR }}
```

The `flutter-action@v2` step is required if the `generate` step pulls Flutter packages. Pass `project_id` and `project_dir` to the action so it knows which project to deploy and where the server code lives.

## Action inputs

| Input                 | Required | What it does                                                                                    |
| --------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `token`               | yes      | Your personal access token, passed from the repository secret.                                  |
| `working_directory`   | no       | The directory the action runs in. Defaults to the repository root.                              |
| `project_id`          | no       | The Cloud project to deploy to. Inferred from `scloud.yaml` when present.                       |
| `project_dir`         | no       | Path to the server package. Useful for monorepos where the server isn't at the repository root. |
| `project_config_file` | no       | Path to `scloud.yaml` if it's not in the default location.                                      |

## Troubleshooting

**`scloud auth login` is required in the run output.** The `token` input is empty or the secret name in the workflow doesn't match what's in your repository's secrets. Confirm the secret name in your repository matches the name your workflow references in `${{ secrets.<name> }}`.

**Project not found.** Either `scloud.yaml` isn't committed and the action can't resolve the project, or `project_id` was passed but doesn't match a project on your Cloud account. Commit `scloud.yaml`, or pass the correct `project_id` as an action input.

**Generated files missing.** The primary workflow assumes generated Serverpod files are committed. Either commit them, or switch to the variant workflow that runs `serverpod generate` in CI.

## Related

- [Personal access tokens](/cloud/concepts/personal-access-tokens) for how to create and rotate tokens.
- [Deployments](/cloud/concepts/deployments) for the deploy lifecycle the action triggers.
- [Deployment hooks](/cloud/concepts/deployment-hooks) for tasks that should run before or after a deploy.
