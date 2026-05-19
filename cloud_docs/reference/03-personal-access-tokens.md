---
title: Personal access tokens
sidebar_position: 8
---

# Personal access tokens

Personal access tokens let you authenticate the Serverpod Cloud CLI without
interactive login. Use them in CI pipelines, scripts, or headless environments
where you cannot run `scloud auth login`.

## When to use tokens

Use a personal access token when:

- Running `scloud` in a CI/CD pipeline (e.g. GitHub Actions, GitLab CI).
- Automating deploys or other CLI commands from a script or cron job.
- Using the CLI on a server or container that has no browser for interactive login.

For normal development on your machine, `scloud auth login` is usually simpler
because it stores credentials locally and you do not need to copy tokens.

## Create a token

You must be logged in to create a token. Run:

```sh
scloud auth create-token
```

Example output:
```sh
✅ Successfully created an API token.

Use the --token option or the SERVERPOD_CLOUD_TOKEN environment variable to
authenticate with this token in scloud commands.

The token is only visible once:
c2FzAZxXRnzFeN2xTo6xVInh3k3bNanACBRM7ux5AYOLQDgzK82PZvdRn0N_f2WqLPCZ
```

The CLI prints the new token once. Store it somewhere secure (e.g. a secret in
your CI system). The token is not shown again.

### Token expiration

By default, created tokens have a time-to-live (TTL) and expire after
30 days of non-use. You can change this when creating the token:

```sh
# Expire after 7 days of non-use
scloud auth create-token --idle-ttl 7d

# No expiration from non-use (token still valid until you revoke it or set --expire-at)
scloud auth create-token --no-idle-ttl

# Expire at a fixed time (ISO 8601)
scloud auth create-token --expire-at 2026-12-31T23:59:59Z
```

Durations support units such as `s`, `m`, `h`, and `d`.

## List authentication sessions

To see your current sessions and personal access tokens (including their IDs and
creation/expiry info):

```sh
scloud auth list
```

Use this to find a token ID before revoking it with `scloud auth logout --token-id`.

## Log out and revoke tokens

- **Log out the current session** (e.g. after `auth login` on your machine):

  ```sh
  scloud auth logout
  ```

- **Revoke a specific personal access token** (use the ID from `scloud auth list`):

  ```sh
  scloud auth logout --token-id <token-id>
  ```

- **Revoke all sessions and tokens** (including all personal access tokens):

  ```sh
  scloud auth logout --all
  ```

After you revoke a token, it can no longer be used for authentication.

## Using a token with the CLI

You can pass the token in two ways: the `--token` option or the
`SERVERPOD_CLOUD_TOKEN` environment variable.

### Option: `--token`

Use the global `--token` option with any `scloud` command:

```sh
scloud --token="your-token-here" deploy
scloud --token="your-token-here" log
```

The token applies only to that command. This is useful when you have the token
in a script variable or a secret and do not want to put it in the environment.

### Environment variable: `SERVERPOD_CLOUD_TOKEN`

Set the environment variable so every `scloud` command in that process uses the token:

```sh
export SERVERPOD_CLOUD_TOKEN="your-token-here"
scloud deploy
scloud log
```

This is convenient in CI and scripts where you set the secret once (e.g. in the
pipeline config) and then run multiple commands.

If both `--token` and `SERVERPOD_CLOUD_TOKEN` are set, the `--token` option
takes precedence.

## Example: CI pipeline

In a CI pipeline, store the token as a secret and expose it as e.g.
`SERVERPOD_CLOUD_TOKEN`.

### GitHub CI

If using GitHub, the action
[serverpod-cloud-deploy](https://github.com/marketplace/actions/serverpod-cloud-deploy)
can be used to automate deployment to Serverpod Cloud such as in this GitHub
workflow example.

```yml
name: Automated Serverpod Cloud deploy

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

      - uses: serverpod/serverpod-cloud-deploy@v1
        with:
          token: ${{ secrets.MY_SERVERPOD_CLOUD_ACCESS_TOKEN }}
```

## Result

- You can run `scloud` in CI and scripts without interactive login.
- Tokens can be scoped with expiration and idle TTL.
- You can list and revoke tokens with `scloud auth list` and `scloud auth logout`.

## Related documentation

- [Auth command reference](/cloud/reference/cli/commands/auth) — Full option reference for `scloud auth login`, `create-token`, `list`, and `logout`.
- [CLI environment variables](/cloud/reference/cli/env_vars) — All `scloud` environment variables, including `SERVERPOD_CLOUD_TOKEN`.
