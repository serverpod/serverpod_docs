# scloud status

`scloud status` shows the live state of your deployed project: whether the service is up, how many podlets (the server instances running your deployment) are ready, which deployment is serving, and whether a new one is rolling in. Use it as the first check after a deploy or when the service misbehaves.

To follow a deploy attempt in detail, use [`scloud deployment`](/cloud/reference/cli/commands/deployment); to read runtime output, use [`scloud log`](/cloud/reference/cli/commands/log).
