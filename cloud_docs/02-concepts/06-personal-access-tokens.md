---
title: Personal access tokens
description: Create personal access tokens to authenticate scloud in CI pipelines, scripts, and headless environments without interactive login.
---

# Personal access tokens

Personal access tokens let you authenticate the Serverpod Cloud CLI without interactive login. Use them in CI pipelines, scripts, or headless environments where you cannot run `scloud auth login`.

## When to use tokens

Use a personal access token when:

- Running `scloud` in a CI/CD pipeline (GitHub Actions, GitLab CI, and so on).
- Automating deploys or other `scloud` commands from a script or cron job.
- Using `scloud` on a server or container with no browser for interactive login.

For everyday development on your machine, `scloud auth login` is simpler; it stores credentials locally and you don't need to handle tokens.

## Create a token

Sign in first, then run:

```bash
scloud auth create-token
```

Example output:

```text
✅ Successfully created an API token.

Use the --token option or the SERVERPOD_CLOUD_TOKEN environment variable to
authenticate with this token in scloud commands.

The token is only visible once:
c2FzAZxXRnzFeN2xTo6xVInh3k3bNanACBRM7ux5AYOLQDgzK82PZvdRn0N_f2WqLPCZ
```

:::caution

The CLI prints the token once. Store it somewhere secure (a secret in your CI system, a password manager). It can't be retrieved again.

:::

### Token expiration

By default, tokens expire after 30 days of non-use. Adjust this when creating the token:

```bash
# Expire after 7 days of non-use
scloud auth create-token --idle-ttl 7d

# Never expire from non-use (still valid until revoked or until --expire-at)
scloud auth create-token --no-idle-ttl

# Expire at a fixed ISO 8601 time
scloud auth create-token --expire-at 2026-12-31T23:59:59Z
```

Durations accept `s`, `m`, `h`, and `d` units.

## List authentication sessions

To see your active sessions and tokens with their IDs, creation, last-used, and expiry times:

```bash
scloud auth list
```

Use the Token Id column to identify a token before revoking it.

## Revoke a token

Revoke a specific token by its ID from `scloud auth list`:

```bash
scloud auth logout --token-id <token-id>
```

Log out the current session instead:

```bash
scloud auth logout
```

Revoke every session and token at once:

```bash
scloud auth logout --all
```

A revoked token can no longer authenticate.

## Use a token with scloud

The CLI accepts a token two ways. For CI pipelines and shell sessions, prefer the `SERVERPOD_CLOUD_TOKEN` environment variable. The `--token` flag is a per-command override.

### Environment variable

Set the variable once so every subsequent `scloud` call in that shell uses the token:

```bash
export SERVERPOD_CLOUD_TOKEN="your-token-here"
scloud deploy
scloud log
```

Best for CI pipelines and shell sessions where you set the secret once and run multiple commands.

### Command-line flag

Pass the token directly to any command:

```bash
scloud --token="your-token-here" deploy
scloud --token="your-token-here" log
```

The flag applies only to that command. Useful when the token lives in a script variable or a short-lived secret.

If both `--token` and `SERVERPOD_CLOUD_TOKEN` are set, `--token` takes precedence.

## Use a token in GitHub Actions

Store the token as a repository secret, then pass it to the official action:

```yaml
- uses: serverpod/serverpod_cloud_deploy@v1
  with:
    token: ${{ secrets.SERVERPOD_CLOUD_TOKEN }}
```

A full setup walkthrough lives in the [serverpod_cloud_deploy action README](https://github.com/serverpod/serverpod_cloud_deploy).

## Related

- [`scloud auth`](/cloud/reference/cli/commands/auth) for the full reference on `auth login`, `create-token`, `list`, and `logout`.
- [CLI environment variables](/cloud/reference/cli/env_vars) for all `scloud` environment variables.
