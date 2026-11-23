# scloud launch

`scloud launch` links your local server to a Serverpod Cloud project and deploys it for the first time. You pick one of your projects, or create a new one in the console with the project ID and database setting pre-filled from your project. The command then adds pre-deploy hooks, offers to copy custom passwords from `config/passwords.yaml`, and deploys.

Once your project is linked, you typically switch to `scloud deploy` for subsequent updates. To create a project without opening the browser, use [`scloud project create`](/cloud/reference/cli/commands/project) with your project ID:

```bash
scloud project create my-project --enable-db
```

Pass `--no-enable-db` instead if the project doesn't use a database.

See [Deploy your first app](/cloud/getting-started/launch) for the full walkthrough.
