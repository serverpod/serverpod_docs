## Usage

```console
Manage your Serverpod Cloud projects

Usage: scloud <command> [arguments]

Global options:
-h, --help                                Print this usage information.
-q, --quiet                               Suppress all cli output. Is overridden by  -v, --verbose.
-v, --verbose                             Prints additional information useful for development.
                                          Overrides --q, --quiet.
-a, --[no-]analytics                      Toggles if analytics data is sent.
    --version                             Prints the version of the Serverpod Cloud CLI.
    --token                               The authentication token to use for the current command.
-d, --project-dir                         The path to the Serverpod Cloud project server directory.
    --project-config-file                 The path to the Serverpod Cloud project configuration file
                                          (defaults to <server-package>/scloud.yaml)
    --timeout=<integer[us|ms|s|m|h|d]>    The timeout for the connection to the Serverpod Cloud API.
                                          (defaults to "1m")
    --yes                                 Automatically accept confirmation prompts.
    --non-interactive                     Never wait for user input, fail with an error instead. For
                                          use in non-interactive environments such as CI. Combine
                                          with --yes to accept confirmation prompts.
    --format=<text|json|yaml>             Selects the command output format.
                                          (defaults to "text")

Available commands:
  completion   Command line completion commands
  settings     Manage local CLI user settings.
  version      Prints the version of the Serverpod Cloud CLI.

Getting started
  launch       Common command to launch and deploy Serverpod Cloud projects.

Management
  auth         Manage user authentication.
  me           Show information about the current user.
  project      Manage Serverpod Cloud projects.

Mission Control
  build        View build logs and manage build secrets.
  db           Manage Serverpod Cloud DBs.
  deploy       Deploy a Serverpod project to the cloud.
  domain       Bring your own domain to Serverpod Cloud.
  log          Fetch Serverpod Cloud logs.
  password     Manage Serverpod Cloud passwords.
  status       Show project and deployment status.
  storage      Manage file storage for a project.
  variable     Manage Serverpod Cloud environment variables and secrets for a project.

Run "scloud help <command>" for more information about a command.

See the full documentation at: https://docs.serverpod.dev/cloud
```

