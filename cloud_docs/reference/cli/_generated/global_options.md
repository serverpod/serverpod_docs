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
    --yes                                 Automatically accept confirmation prompts. For use in
                                          non-interactive environments.

Available commands:
  completion   Command line completion commands
  settings     Manage local CLI user settings.
  version      Prints the version of the Serverpod Cloud CLI.

Getting started
  launch       Guided launch of a new Serverpod Cloud project.

Management
  auth         Manage user authentication.
  me           Show information about the current user.
  project      Manage Serverpod Cloud projects.

Mission Control
  db           Manage Serverpod Cloud DBs.
  deploy       Deploy a Serverpod project to the cloud.
  deployment   Manage deployments.
  domain       Bring your own domain to Serverpod Cloud.
  log          Fetch Serverpod Cloud logs.
  password     Manage Serverpod Cloud passwords.
  secret       Manage Serverpod Cloud secrets.
  variable     Manage Serverpod Cloud environment variables for a project.

Run "scloud help <command>" for more information about a command.

See the full documentation at: /cloud/
```

