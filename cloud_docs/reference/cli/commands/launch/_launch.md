# scloud launch

`scloud launch` is the front door for new projects. It links your local server to a Serverpod Cloud project and deploys for the first time. You pick one of your projects, or create a new one in the console with the project ID and database setting pre-filled from your project. The command then adds pre-deploy hooks, offers to copy custom passwords from `config/passwords.yaml`, and deploys.

Once your project is linked, you typically switch to `scloud deploy` for subsequent updates. To create a project without questions in the terminal, use `scloud project create` and pass the settings as flags.

See [Deploy your first app](/cloud/getting-started/launch) for the full walkthrough.
