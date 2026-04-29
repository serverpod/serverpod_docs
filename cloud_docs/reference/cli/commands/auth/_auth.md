# `auth`

Handle user authentication.

See also the [personal access tokens (PAT) guide](../../personal-access-tokens)
on how to prepare and use personal access tokens for CI pipelines, scripts, or
headless environments where you cannot run `scloud auth login`.


## `auth login`

Log in to Serverpod Cloud. Most `scloud` commands requires the CLI to be authenticated.

## `auth logout`

Log out from Serverpod Cloud and remove stored credentials.

## Credentials storage

After running `auth login`, your authentication token is stored locally at:

```
~/.serverpod/cloud/serverpod_cloud_auth.json
```

This file contains a JSON object with your token:

```json
{"token": "your-token-here"}
```

## Using the token

### Environment variable

You can set the `SERVERPOD_CLOUD_TOKEN` environment variable to authenticate without logging in:

```bash
export SERVERPOD_CLOUD_TOKEN="your-token-here"
scloud me 
```

### Command-line flag

Alternatively, use the `--token` flag with any command:

```bash
scloud --token="your-token-here" me
```

This is useful for CI/CD pipelines and automated scripts.
