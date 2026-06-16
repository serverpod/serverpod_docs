# scloud secret

`scloud secret` stores sensitive values that your server reads from `Platform.environment` (rather than through Serverpod's `getPassword()` API). Secrets are encrypted at rest and injected as environment variables under names you choose.

For values you read through Serverpod's API, use [`scloud password`](/cloud/reference/cli/commands/password). For non-sensitive config, use [`scloud variable`](/cloud/reference/cli/commands/variable). See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for when to use which.
