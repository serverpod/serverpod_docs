# scloud variable

`scloud variable` manages environment variables in two tiers: plaintext variables for non-sensitive configuration (URLs, feature flags, log levels), and secrets, which are encrypted and shown masked. The `--secret` flag on `set` stores a value in the secret tier. For values your Serverpod code reads through `getPassword()`, use `scloud password` instead.

See [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for the tier comparison, naming rules, and size limits.
