# scloud launch

`scloud launch` links your local server to a Serverpod Cloud project and deploys it for the first time. You pick one of your projects in the terminal, or create a new one in the console with the project ID and database setting pre-filled from your project. The command then adds pre-deploy hooks, offers to copy custom passwords from `config/passwords.yaml`, and deploys.

Once your project is linked, you typically switch to `scloud deploy` for subsequent updates.

:::note

`scloud launch` creates new projects in the console. To create a project from a script or CI instead, use [`scloud project create`](/cloud/reference/cli/commands/project).

:::

See [Deploy your first app](/cloud/getting-started/launch) for the full walkthrough.
