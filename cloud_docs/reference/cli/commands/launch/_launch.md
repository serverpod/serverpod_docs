# scloud launch

`scloud launch` is the front door for new projects: it interactively creates a Serverpod Cloud project, links your local server to it, and deploys for the first time. The flow prompts for the project name, whether to enable a database, and confirms each step before performing it.

Once your project is linked, you typically switch to `scloud deploy` for subsequent updates. For non-interactive project creation (no prompts), use `scloud project create` and pass the settings as flags.

See [Deploy your first app](/cloud/getting-started/launch) for the full walkthrough.
