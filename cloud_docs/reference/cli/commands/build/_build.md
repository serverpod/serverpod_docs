# scloud build

The `scloud build` commands cover the Cloud build stage of a deploy: reading a deployment's build log and managing the secrets the build can use. Build-time errors surface in the build log, not in the runtime logs that `scloud log` fetches.

Build secrets cover credentials the build needs and your source code shouldn't carry. See [Private dependencies](/cloud/reference/private-dependencies) for the setup that uses them, and [Passwords, secrets, and environment variables](/cloud/concepts/passwords-secrets-env-vars) for the values your server reads at runtime.

For where the build sits in the deploy lifecycle, see [Deployments](/cloud/concepts/deployments). To work through a failed build step by step, see [Recover from a failed deploy](/cloud/guides/recover-from-a-failed-deploy).
