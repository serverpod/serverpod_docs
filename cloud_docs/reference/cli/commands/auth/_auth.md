# scloud auth

`scloud auth` manages your login session: log in to Serverpod Cloud, log out, and revoke other sessions or tokens. Most `scloud` commands authenticate against the cloud API, so you need to be logged in (or pass a token) to do anything that touches your projects.

For long-lived authentication (CI pipelines, scripts), see [Personal access tokens](/cloud/concepts/personal-access-tokens), which covers token creation, the `SERVERPOD_CLOUD_TOKEN` environment variable, and the `--token` flag.

## Credentials storage

After running `scloud auth login`, your authentication token is stored locally at:

```text
~/.serverpod/cloud/serverpod_cloud_auth.json
```

This file contains a JSON object with your token:

```json
{"token": "your-token-here"}
```

Delete the file (or run `scloud auth logout`) to clear stored credentials.
