---
sidebar_position: 7
sidebar_label: Personal access tokens
description: Create personal access tokens to authenticate the Serverpod Cloud CLI in CI pipelines, scripts, and headless environments without interactive login.
---

# Personal access tokens

When you need to run the Serverpod Cloud CLI in a CI pipeline, a script, or a headless environment where the browser-based `serverpod cloud auth login` flow isn't possible, you authenticate with a personal access token instead. Tokens are long-lived credentials you generate once, store as a secret, and pass to the CLI as a flag or environment variable.

For everyday development on your machine, `serverpod cloud auth login` is simpler. It stores credentials locally, so you don't need to handle tokens.

## Create a token

Sign in first, then run:

```bash
serverpod cloud auth create-token
```

Example output:

```text
✅ Successfully created an API token.

Use the --token option or the SERVERPOD_CLOUD_TOKEN environment variable to
authenticate with this token in serverpod cloud commands.

The token is only visible once:
c2FzAZxXRnzFeN2xTo6xVInh3k3bNanACBRM7ux5AYOLQDgzK82PZvdRn0N_f2WqLPCZ
```

:::warning

The CLI prints the token once. Store it somewhere secure (a secret in your CI system, a password manager). It can't be retrieved again.

:::

### Token expiration

By default, tokens expire after 30 days of non-use. Adjust this when creating the token:

```bash
# Expire after 7 days of non-use
serverpod cloud auth create-token --idle-ttl 7d

# Never expire from non-use (still valid until revoked or until --expire-at)
serverpod cloud auth create-token --no-idle-ttl

# Expire at a fixed ISO 8601 time
serverpod cloud auth create-token --expire-at 2026-12-31T23:59:59Z
```

Durations accept `s`, `m`, `h`, and `d` units.

## List authentication sessions

To see your active sessions and tokens with their IDs, creation, last-used, and expiry times:

```bash
serverpod cloud auth list
```

Use the Token Id column to identify a token before revoking it.

## Revoke a token

Revoke a specific token by its ID from `serverpod cloud auth list`:

```bash
serverpod cloud auth logout --token-id <token-id>
```

Log out the current session instead:

```bash
serverpod cloud auth logout
```

Revoke every session and token at once:

```bash
serverpod cloud auth logout --all
```

A revoked token can no longer authenticate.

## Use a token with the Cloud CLI

The CLI accepts a token two ways. For CI pipelines and shell sessions, prefer the `SERVERPOD_CLOUD_TOKEN` environment variable. The `--token` flag is a per-command override.

### Environment variable

Set the variable once so every subsequent `serverpod cloud` command in that shell uses the token:

```bash
export SERVERPOD_CLOUD_TOKEN="your-token-here"
serverpod cloud deploy
serverpod cloud log
```

Best for CI pipelines and shell sessions where you set the secret once and run multiple commands.

### Command-line flag

Pass the token directly to any command:

```bash
serverpod cloud --token="your-token-here" deploy
serverpod cloud --token="your-token-here" log
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

For the full walkthrough, see [Deploy from CI with GitHub Actions](/cloud/guides/deploy-from-ci-with-github-actions).

## Related

- [CLI reference: `auth` command](/cloud/reference/cli/commands/auth) for `auth login`, `create-token`, `list`, and `logout`.
- [CLI environment variables](/cloud/reference/cli/env_vars) for all Cloud CLI environment variables.
