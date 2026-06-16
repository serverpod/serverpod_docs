# scloud password

`scloud password` manages encrypted password values your server reads through Serverpod's `getPassword()` API. Each password is stored under a `SERVERPOD_PASSWORD_` prefix that the CLI adds on `set` and that `getPassword()` strips on read.

For the model (when to use passwords vs secrets vs variables, platform-managed defaults, and naming rules), see [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars).
